import "dotenv/config";

import { prisma } from "../src/db/prisma.js";
import { EsakshiService } from "../src/ingestion/esakshi/esakshi.service.js";
import { EsakshiIngestionService } from "../src/services/ingestion/esakshi-ingestion.service.js";

const DELAY_MS = 700;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("\n=== PAN INDIA EXPENDITURE INGESTION ===");

  const api = new EsakshiService();
  const ingestion = new EsakshiIngestionService();

  const states = await api.fetchStates();

  let totalProcessed = 0;

  for (const state of states) {
    const combo = `${state.STATE_ID},0,0,2`;

    console.log(`\n${state.STATE_NAME}`);

    const result = await ingestion.ingestExpenditure(combo);

    console.log(
      `Processed : ${result.processed}/${result.fetched}`,
    );

    totalProcessed += result.processed;

    await sleep(DELAY_MS);
  }

  console.log("\n=================================");
  console.log("PAN INDIA EXPENDITURE COMPLETE");
  console.log(`Transactions : ${totalProcessed}`);
  console.log("=================================");
}

main()
  .catch((error) => {
    console.error("Ingestion failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });