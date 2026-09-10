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
// import fs from "node:fs/promises";
// import path from "node:path";

// async function main() {
//   const filePath = path.resolve(
//     "data/raw/esakshi/works-completed-test.json",
//   );

//   const fileContent = await fs.readFile(
//     filePath,
//     "utf8",
//   );

//   const response = JSON.parse(fileContent);

//   const responseKey = "Total Works Completed";

//   const rawData = response[responseKey];

//   console.log("\n========== TOP LEVEL KEYS ==========\n");

//   console.log(Object.keys(response));

//   console.log("\n========== RAW DATA TYPE ==========\n");

//   console.log(typeof rawData);

//   if (typeof rawData !== "string") {
//     throw new Error(
//       `Expected "${responseKey}" to contain a string`,
//     );
//   }

//   const records = JSON.parse(rawData);

//   console.log("\n========== TOTAL RECORDS ==========\n");

//   console.log(records.length);

//   console.log("\n========== FIRST RECORD KEYS ==========\n");

//   console.log(Object.keys(records[0]));

//   console.log("\n========== FIRST RECORD ==========\n");

//   console.dir(records[0], {
//     depth: null,
//   });

//   console.log("\n========== SECOND RECORD ==========\n");

//   console.dir(records[1], {
//     depth: null,
//   });
// }

// main().catch((error: unknown) => {
//   console.error("Inspection failed:");
//   console.error(error);

//   process.exit(1);
// });