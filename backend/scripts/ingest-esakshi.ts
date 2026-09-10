import "../src/config/env.js";

import { prisma } from "../src/db/prisma.js";
import { EsakshiIngestionService } from "../src/services/ingestion/esakshi-ingestion.service.js";

const combo = process.argv[2] ?? "1,0,0,2";

async function main() {
  console.log("\n=== MPLADS-SENTINEL INGESTION ===");
  console.log("Combo:", combo);

  const service = new EsakshiIngestionService();

  const recommended =
    await service.ingestWorksRecommended(combo);

  console.log("\nWorks Recommended");
  console.log("Fetched:", recommended.fetched);
  console.log("Processed:", recommended.processed);
  console.log("Skipped:", recommended.skipped);

  const completed =
    await service.ingestWorksCompleted(combo);

  console.log("\nWorks Completed");
  console.log("Fetched:", completed.fetched);
  console.log("Processed:", completed.processed);
  console.log("Skipped:", completed.skipped);
  console.log("Unmatched:", completed.unmatched);

  console.log("\nIngestion complete.");
}

main()
  .catch((error) => {
    console.error("\nIngestion failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });