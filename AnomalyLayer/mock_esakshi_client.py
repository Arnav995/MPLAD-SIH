"""
Mock responses matching the documented eSAKSHI response schemas, used to test
the ingestion + parsing pipeline end-to-end without hitting the live server.
Swap MockESakshiClient back for the real ESakshiClient once you're ready to
test against the actual government server from an environment with network access.
"""

import random
from datetime import datetime, timedelta

random.seed(7)

VENDORS = [("Vendor A Constructions", 3001), ("Vendor B Infra", 3002), ("Vendor C Builders", 3003)]
CATEGORIES = ["Drinking Water", "Road Construction", "Community Hall", "Street Lighting"]


class MockESakshiClient:
    """Drop-in replacement for ESakshiClient — same method signatures, canned data."""

    def __init__(self, *args, **kwargs):
        self.request_log = []

    def get_state_data(self):
        return [{"ID": 21, "CAPTION": "Maharashtra"}, {"ID": 9, "CAPTION": "Uttar Pradesh"}]

    def get_constituency_data(self, state_id):
        return [{"ID": 250, "CAPTION": "Nagpur"}, {"ID": 251, "CAPTION": "Bhandara-Gondiya"}]

    def get_mp_and_const_combo(self, constituency_id, house_type):
        return [{"ID": 3019087, "CAPTION": "Nitin Jairam Gadkari"}]

    def get_tiles_report_data(self, state_id, constituency_id, mp_id, house_type, tenure_id, key):
        if str(state_id) == "0" and str(constituency_id) == "0":
            raise RuntimeError("This mock also refuses national scope — matches the real guard's intent")

        n = 25
        records = []
        for i in range(n):
            rec_date = datetime(2024, 4, 1) + timedelta(days=random.randint(0, 300))
            sanction_date = rec_date + timedelta(days=random.randint(10, 90))
            end_date = sanction_date + timedelta(days=random.randint(60, 400))
            vendor_name, vendor_id = random.choice(VENDORS)
            category = random.choice(CATEGORIES)
            base_id = 136000 + i

            if key == "Works Recommended":
                records.append({
                    "WORK_RECOMMENDATION_DTL_ID": base_id,
                    "ACTIVITY_NAME": f"WS/MP672/2024-2025/{base_id}-{category}",
                    "WORK_CATEGORY": category,
                    "WORK_DESCRIPTION": f"{category} improvement work in ward {i}",
                    "WORK_STAGE": "Work Completed",
                    "RECOMMENDATION_DATE": rec_date.strftime("%d-%b-%Y"),
                    "RECOMMENDED_AMOUNT": round(random.uniform(150000, 1500000), 2),
                    "SANCTION_DATE": sanction_date.strftime("%d-%b-%Y"),
                    "SANCTION_AMOUNT": round(random.uniform(150000, 1500000), 2),
                    "LETTER_NO": f"LN-{base_id}",
                    "IDA_NAME": "Nagpur Municipal Corporation",
                    "CONSTITUENCY_ID": constituency_id,
                    "CONSTITUENCY": "Nagpur",
                    "STATE_NAME": "Maharashtra",
                    "HOUSE_OF_PARLIAMENT": house_type,
                    "TENURE": "18th Lok Sabha",
                    "MP_NAME": "Nitin Jairam Gadkari",
                })
            elif key == "Works Completed":
                records.append({
                    "WORK_ID": 58000 + i,
                    "WORK_RECOMMENDATION_DTL_ID": base_id,
                    "ACTIVITY_NAME": f"WS/MP672/2024-2025/{base_id}-{category}",
                    "WORK_CATEGORY": category,
                    "STATE_NAME": "Maharashtra",
                    "IDA_NAME": "Nagpur Municipal Corporation",
                    "MP_NAME": "Nitin Jairam Gadkari",
                    "CONSTITUENCY_ID": constituency_id,
                    "CONSTITUENCY": "Nagpur",
                    "ACTUAL_AMOUNT": round(random.uniform(150000, 1500000), 2),
                    "ACTUAL_END_DATE": end_date.strftime("%d-%b-%Y"),
                    "AVERAGE_RATING": round(random.uniform(2.5, 5.0), 1),
                })
            elif key == "Expenditure on Completed and On-going Works as on Date":
                records.append({
                    "WORK_ID": f"WS/MP672/2024-2025/{base_id}",
                    "WORK_RECOMMENDATION_DTL_ID": base_id,
                    "ACTIVITY_NAME": f"WS/MP672/2024-2025/{base_id}-{category}",
                    "STATE_NAME": "Maharashtra",
                    "IDA_NAME": "Nagpur Municipal Corporation",
                    "IA_NAME": "Public Works Department",
                    "VENDOR_NAME": vendor_name,
                    "VENDOR_ID": vendor_id,
                    "FUND_DISBURSED_AMT": round(random.uniform(100000, 1500000), 2),
                    "EXPENDITURE_DATE": end_date.strftime("%d-%b-%Y"),
                    "WORK_STATUS": "Payment Success",
                    "CONSTITUENCY": "Nagpur",
                    "MP_NAME": "Nitin Jairam Gadkari",
                })

        # Real API wraps the array as a JSON string under the report's response key
        return {key: records}

    def get_attach_ids_by_flag(self, flag, work_id):
        return {"FILE_NAME": ["sample_document.pdf"], "ATTACH_ID": [f"{work_id}.mockattach"]}

    def get_attachment_by_id(self, attach_id):
        return {"FILE_NAME": "sample_document.pdf", "URL": "<base64 would be here>"}

    def get_review_details_by_work(self, work_recommendation_dtl_id):
        return [{"WORK_REVIEW_ID": 1, "WORK_RECOM_DTL_ID": work_recommendation_dtl_id,
                  "STAR_RATING": random.choice([2, 3, 4, 5]), "REVIEW_DETAIL": "[redacted in mock]"}]
