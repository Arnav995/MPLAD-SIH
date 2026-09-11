import "dotenv/config";

import { runMlPipeline } from "../src/services/ml/ml-pipeline.service.js";

async function main() {
  console.log("Starting ML risk pipeline...");

  const result = await runMlPipeline();

  console.log("");
  console.log("ML pipeline completed.");
  console.log(`Projects evaluated: ${result.summary.projects}`);
  console.log(`Tier 2: ${result.summary.tier_2}`);
  console.log(`Tier 1: ${result.summary.tier_1}`);
  console.log(`Clean: ${result.summary.clean}`);
  console.log(
    `Duplicate candidates: ${result.duplicate_candidates.length}`,
  );

  console.log("");
  console.log("Database persistence completed.");
  console.log(`Risk assessments: ${result.persisted.projectsPersisted}`);
  console.log(`Risk signals: ${result.persisted.riskSignalsPersisted}`);
  console.log(
    `Duplicate candidates: ${result.persisted.duplicateCandidatesPersisted}`,
  );
}

main().catch((error) => {
  console.error("");
  console.error("ML pipeline failed:");
  console.error(error);

  process.exit(1);
});