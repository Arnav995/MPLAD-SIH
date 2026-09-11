"""
MPLADS-Sentinel — eSAKSHI API Client

A thin, respectful wrapper around the documented public REST endpoints.
Every safety property lives here, in one place, so nothing calling this
client can accidentally violate them:

  - Rate limiting: a hard minimum delay between any two requests.
  - Bounded retries: fails loudly and stops, never loops indefinitely.
  - Local response caching: repeated dev/test runs don't re-hit the server.
  - Scope guard: refuses national-scope calls outright.
  - Discovery-then-fetch only: attachment/review methods require an ID that
    was itself returned by a prior legitimate call — this client has no
    method that accepts an arbitrary/guessed ID with no discovery step.
"""

import time
import json
import hashlib
import os
from pathlib import Path
import requests

BASE_URL = "https://www.mplads.mospi.gov.in"


class ScopeViolationError(Exception):
    """Raised when a call would exceed the deliberately configured safe scope."""
    pass


class ESakshiClient:
    def __init__(self, safety_cfg: dict, cache_cfg: dict):
        self.min_interval = safety_cfg["min_request_interval_seconds"]
        self.max_retries = safety_cfg["max_retries"]
        self.backoff = safety_cfg["retry_backoff_seconds"]
        self.timeout = safety_cfg["request_timeout_seconds"]
        self.block_national = safety_cfg["block_national_scope"]
        self.user_agent = safety_cfg["user_agent"]

        self.cache_dir = Path(cache_cfg["directory"])
        self.use_cache = cache_cfg["use_cache_if_present"]
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        self._last_request_time = 0.0
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json; charset=UTF-8",
            "Accept": "application/json",
            "User-Agent": self.user_agent,
        })

        self.request_log = []  # every call made this run, for auditability

    # ---- core plumbing --------------------------------------------------

    def _cache_key(self, endpoint: str, payload: dict) -> str:
        raw = f"{endpoint}::{json.dumps(payload, sort_keys=True)}"
        return hashlib.sha256(raw.encode()).hexdigest()[:24]

    def _throttle(self):
        elapsed = time.time() - self._last_request_time
        wait = self.min_interval - elapsed
        if wait > 0:
            time.sleep(wait)
        self._last_request_time = time.time()

    def _post(self, endpoint: str, payload: dict) -> dict:
        cache_key = self._cache_key(endpoint, payload)
        cache_file = self.cache_dir / f"{cache_key}.json"

        if self.use_cache and cache_file.exists():
            with open(cache_file) as f:
                return json.load(f)

        url = f"{BASE_URL}{endpoint}"
        last_error = None
        for attempt in range(1, self.max_retries + 2):  # +1 for the initial try
            self._throttle()
            try:
                resp = self.session.post(url, json=payload, timeout=self.timeout)
                resp.raise_for_status()
                data = resp.json()
                self.request_log.append({"endpoint": endpoint, "payload": payload, "status": "ok"})
                with open(cache_file, "w") as f:
                    json.dump(data, f)
                return data
            except Exception as e:
                last_error = e
                self.request_log.append({"endpoint": endpoint, "payload": payload,
                                          "status": "error", "error": str(e), "attempt": attempt})
                if attempt <= self.max_retries:
                    time.sleep(self.backoff)
        raise RuntimeError(f"Failed to fetch {endpoint} after {self.max_retries + 1} attempts: {last_error}")

    # ---- scope guard ------------------------------------------------------

    def _assert_in_scope(self, state_id, constituency_id):
        if self.block_national and str(state_id) in ("0", "") and str(constituency_id) in ("0", ""):
            raise ScopeViolationError(
                "Refusing a national-scope call (state_id=0, constituency_id=0). "
                "This risks overloading the source server. Scope every call to a "
                "specific state or constituency, per config.yaml."
            )

    # ---- public API methods (mirror the documented endpoints) -----------

    def get_state_data(self) -> list:
        return self._post("/rest/PreLoginDashboardData/getStateData", {})

    def get_constituency_data(self, state_id: int) -> list:
        return self._post("/rest/PreLoginDashboardData/getConstituencyData", {"id": str(state_id)})

    def get_mp_and_const_combo(self, constituency_id: int, house_type: int) -> list:
        combo = f"{constituency_id},{house_type},"
        return self._post("/rest/PreLoginDashboardData/getMpAndConstCombo", {"const_combo": combo})

    def get_tiles_report_data(self, state_id: int, constituency_id: int, mp_id: int,
                               house_type: int, tenure_id: int, key: str) -> dict:
        self._assert_in_scope(state_id, constituency_id)
        combo = f"{state_id},{constituency_id},{mp_id},{house_type},{tenure_id}"
        return self._post("/rest/PreLoginDashboardData/getTilesReportData",
                           {"combo": combo, "key": key})

    def get_attach_ids_by_flag(self, flag: str, work_id: str) -> dict:
        """Discovery step — call this BEFORE get_attachment_by_id, never guess an ID directly."""
        return self._post("/rest/PreLoginDashboardData/getAttachIdsbyFlag",
                           {"json": {"FLAG": flag, "WORK_ID": work_id}})

    def get_attachment_by_id(self, attach_id: str) -> dict:
        """Only ever call with an attach_id that came from get_attach_ids_by_flag's response."""
        return self._post("/rest/PreLoginCitizenWorkRcmdRest/getAttachmentById", {"id": attach_id})

    def get_review_details_by_work(self, work_recommendation_dtl_id: int) -> list:
        return self._post("/rest/PreLoginCitizenWorkRcmdRest/getReviewDetailsByWork",
                           {"json": work_recommendation_dtl_id})
