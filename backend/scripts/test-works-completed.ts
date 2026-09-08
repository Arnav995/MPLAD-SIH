import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import EsakshiClient from
  "../src/ingestion/esakshi/esakshi.client.js";

import {
  ESAKSHI_REPORTS,
} from "../src/ingestion/esakshi/esakshi.reports.js";

async function main() {
  const client = new EsakshiClient();

  const combo = "0,0,0,2";

  const report =
    ESAKSHI_REPORTS.worksCompleted;

  console.log(
    "Fetching Works Completed raw response...",
  );

  console.log({
    combo,
    requestKey: report.requestKey,
  });

  const response =
    await client.getTilesReportData(
      combo,
      report.requestKey,
    );

  const outputDir = path.resolve(
    "data/raw/esakshi",
  );

  await fs.mkdir(outputDir, {
    recursive: true,
  });

  const outputPath = path.join(
    outputDir,
    "works-completed-test.json",
  );

  await fs.writeFile(
    outputPath,
    JSON.stringify(response, null, 2),
    "utf8",
  );

  console.log(
    `Saved raw response to: ${outputPath}`,
  );

  console.log("\n========== RESPONSE KEYS ==========\n");

  console.log(Object.keys(response));

  console.log("\n========== RAW KEY PREVIEW ==========\n");

  for (const [key, value] of Object.entries(response)) {
    console.log({
      key,
      type: typeof value,
      preview:
        typeof value === "string"
          ? value.slice(0, 200)
          : value,
    });
  }
}

main().catch((error: unknown) => {
  console.error(
    "Works Completed test failed:",
  );

  console.error(error);

  process.exit(1);
});