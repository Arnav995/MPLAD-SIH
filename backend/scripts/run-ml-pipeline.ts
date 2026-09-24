import "dotenv/config";

import { runMlPipeline } from "../src/services/ml/ml-pipeline.service.js";

async function main() {
  console.log("=================================");
  console.log("MPLADS-SENTINEL ML PIPELINE");
  console.log("=================================\n");

  const result = await runMlPipeline();

  console.log("\nML evaluation complete.");
  console.log(`Projects evaluated : ${result.summary.projects}`);
  console.log(`Tier 2            : ${result.summary.tier_2}`);
  console.log(`Tier 1            : ${result.summary.tier_1}`);
  console.log(`Clean             : ${result.summary.clean}`);
  console.log(
    `Duplicate pairs   : ${result.duplicate_candidates.length}`
  );

  console.log("\nDatabase persistence");
  console.log(
    `Risk assessments  : ${result.persisted.projectsPersisted}`
  );
  console.log(
    `Risk signals      : ${result.persisted.riskSignalsPersisted}`
  );
  console.log(
    `Duplicate records : ${result.persisted.duplicateCandidatesPersisted}`
  );

  console.log("\nPipeline completed successfully.");
}

main().catch((error) => {
  console.error("\nML pipeline failed:");
  console.error(error);
  process.exit(1);
});