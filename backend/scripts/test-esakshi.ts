import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import EsakshiClient from "../src/ingestion/esakshi/esakshi.client.js";

async function main() {
  const client = new EsakshiClient();

  console.log("Fetching eSAKSHI data...");

  const response = await client.getTilesReportData(
    "0,0,0,2",
    "Allocated Limit for Hon'ble MPs",
  );

  const outputDir = path.resolve("data/raw/esakshi");

  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(
    outputDir,
    "allocated-limit-test.json",
  );

  await fs.writeFile(
    outputPath,
    JSON.stringify(response, null, 2),
    "utf8",
  );

  console.log(`Saved raw response to: ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error("eSAKSHI request failed:");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});