import "dotenv/config";

import { EsakshiService } from "../src/ingestion/esakshi/esakshi.service.js";
import type { ExpenditureRecord } from "../src/ingestion/esakshi/esakshi.types.js";

async function main() {
  const service = new EsakshiService();

  const records =
    await service.fetchReport<ExpenditureRecord>(
      "expenditure",
      "1,0,0,2",
    );

  console.log("Records:", records.length);

  console.log("\nFirst 5 records:");
  console.dir(records.slice(0, 5), {
    depth: null,
  });

  console.log("\nFields:");
  console.log(
    Object.keys(records[0] ?? {}),
  );

  console.log("\nMissing values:");

  const fields = [
    "WORK_ID",
    "WORK_RECOMMENDATION_DTL_ID",
    "ACTIVITY_NAME",
    "IA_NAME",
    "VENDOR_NAME",
    "VENDOR_ID",
    "FUND_DISBURSED_AMT",
    "EXPENDITURE_DATE",
    "WORK_STATUS",
    "CONSTITUENCY",
    "MP_NAME",
  ] as const;

  for (const field of fields) {
    const missing = records.filter(
      (record) =>
        record[field] === null ||
        record[field] === undefined ||
        record[field] === "",
    ).length;

    console.log(
      `${field}: ${missing}/${records.length} missing`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 