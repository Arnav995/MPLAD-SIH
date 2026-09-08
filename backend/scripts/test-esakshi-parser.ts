import "dotenv/config";

import EsakshiClient from
  "../src/ingestion/esakshi/esakshi.client.js";

import {
  parseTilesReportData,
} from "../src/ingestion/esakshi/esakshi.parser.js";

import type {
  AllocatedLimitRecord,
} from "../src/ingestion/esakshi/esakshi.types.js";

async function main() {
  const client = new EsakshiClient();

  console.log("Fetching raw eSAKSHI data...");

  const rawResponse =
    await client.getTilesReportData(
      "0,0,0,2",
      "Allocated Limit for Hon'ble MPs",
    );

  console.log("Raw response received.");

  const records =
    parseTilesReportData<AllocatedLimitRecord>(
      rawResponse,
      "Allocated Limit",
    );

  console.log(
    `Successfully parsed ${records.length} records.`,
  );

  console.log("\n========== FIRST RECORD ==========\n");

  console.dir(records[0], {
    depth: null,
  });

  console.log("\n========== SAMPLE AMOUNTS ==========\n");

  for (const record of records.slice(0, 5)) {
    console.log({
      mp: record.MP_NAME,
      constituency: record.CONSTITUENCY,
      allocatedAmount: record.ALLOCATED_AMT,
    });
  }
}

main().catch((error: unknown) => {
  console.error("Parser test failed:");

  console.error(error);

  process.exit(1);
});