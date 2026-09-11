"""
MPLADS-Sentinel — Ingestion Pipeline Orchestrator

Pulls the four core datasets (Recommended, Sanctioned*, Completed, Expenditure)
for exactly the constituencies listed in config.yaml — nothing wider.

*Note: "Works Sanctioned" isn't in our mock fixture separately since the real
API returns sanction fields embedded in "Works Recommended" — verify this
against the real response the first time you run against the live server,
and add a dedicated pull only if sanction data actually lives elsewhere.

Usage:
    python ingest_pipeline.py --mock     # test against canned responses (safe, no network)
    python ingest_pipeline.py            # run against the real live server
"""

import argparse
import json
import yaml
from pathlib import Path

REPORT_KEYS = [
    "Works Recommended",
    "Works Completed",
    "Expenditure on Completed and On-going Works as on Date",
]


def load_config(path="config.yaml") -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


def _extract_records(result, key: str) -> list:
    if not isinstance(result, dict):
        return []
    raw = result.get(key)
    if raw is None:
        for k, v in result.items():
            if key.lower() in k.lower() or k.lower() in key.lower():
                raw = v
                break
        if raw is None and len(result) == 1:
            raw = list(result.values())[0]

    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except Exception:
            return []
    elif isinstance(raw, list):
        return raw
    return []


def run(mock: bool):
    cfg = load_config()
    scope = cfg["scope"]

    if mock:
        from mock_esakshi_client import MockESakshiClient
        client = MockESakshiClient()
        print("[mock mode] no real network calls will be made")
    else:
        from esakshi_client import ESakshiClient
        client = ESakshiClient(cfg["safety"], cfg["cache"])
        print("[LIVE mode] this will make real requests to mplads.mospi.gov.in")

    raw_dir = Path("./raw_pulls")
    raw_dir.mkdir(exist_ok=True)

    all_results = {key: [] for key in REPORT_KEYS}

    for const_id in scope["constituency_ids"]:
        print(f"\n--- Constituency {const_id} ---")
        mp_list = client.get_mp_and_const_combo(const_id, scope["house_type"])
        if not mp_list:
            print(f"  no MP found for constituency {const_id}, skipping")
            continue
        mp = mp_list[0]
        mp_id = mp["ID"]
        print(f"  MP: {mp['CAPTION']} (ID {mp_id})")

        for key in REPORT_KEYS:
            print(f"  fetching '{key}'...")
            result = client.get_tiles_report_data(
                state_id=scope["state_id"],
                constituency_id=const_id,
                mp_id=mp_id,
                house_type=scope["house_type"],
                tenure_id=scope["tenure_id"],
                key=key,
            )
            records = _extract_records(result, key)
            print(f"    -> {len(records)} records")
            all_results[key].extend(records)

    for key, records in all_results.items():
        safe_name = key.lower().replace(" ", "_")
        out_path = raw_dir / f"{safe_name}.json"
        with open(out_path, "w") as f:
            json.dump(records, f, indent=2)
        print(f"\nSaved {len(records)} total records -> {out_path}")

    if hasattr(client, "request_log") and client.request_log:
        with open(raw_dir / "request_log.json", "w") as f:
            json.dump(client.request_log, f, indent=2)
        print(f"\nRequest log saved ({len(client.request_log)} calls) -> raw_pulls/request_log.json")

    return all_results


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mock", action="store_true", help="run against mock data, no real network calls")
    args = parser.parse_args()
    run(mock=args.mock)
