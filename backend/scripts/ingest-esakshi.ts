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
  });// import "../src/config/env.js";

// import { prisma } from "../src/db/prisma.js";
// import { EsakshiService } from "../src/ingestion/esakshi/esakshi.service.js";
// import { EsakshiIngestionService } from "../src/services/ingestion/esakshi-ingestion.service.js";

// const DELAY_MS = 600;

// async function sleep(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// async function main() {
//   console.log("\n=== MPLADS-SENTINEL PAN INDIA INGESTION ===");

//   const api = new EsakshiService();
//   const ingestion = new EsakshiIngestionService();

//   const states = await api.fetchStates();

//   console.log(`Found ${states.length} States / UTs`);

//   let totalRecommended = 0;
//   let totalCompleted = 0;

//   for (const state of states) {
//     const combo = `${state.STATE_ID},0,0,2`;

//     console.log("\n-----------------------------");
//     console.log(`State : ${state.STATE_NAME}`);
//     console.log(`Combo : ${combo}`);

//     const recommended = await ingestion.ingestWorksRecommended(combo);

//     console.log(
//       `Recommended: ${recommended.processed}/${recommended.fetched}`
//     );

//     const completed = await ingestion.ingestWorksCompleted(combo);

//     console.log(
//       `Completed: ${completed.processed}/${completed.fetched}`
//     );

//     totalRecommended += recommended.processed;
//     totalCompleted += completed.processed;

//     await sleep(DELAY_MS);
//   }

//   console.log("\n=================================");
//   console.log("PAN INDIA INGESTION COMPLETE");
//   console.log(`Recommended Works : ${totalRecommended}`);
//   console.log(`Completed Works   : ${totalCompleted}`);
//   console.log("=================================");
// }

// main()
//   .catch((error) => {
//     console.error("\nIngestion failed:");
//     console.error(error);
//     process.exitCode = 1;
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });