import "../src/config/env.js";

import { prisma } from "../src/db/prisma.js";
import { runDuplicateDetection } from "../src/services/detection/duplicate.service.js";

async function main() {
  console.log("\n=== DUPLICATE / OVERLAP DETECTION ===");

  const result = await runDuplicateDetection();

  console.log("Works checked:", result.worksChecked);
  console.log("Candidates created:", result.candidatesCreated);

  console.log("\nDetection complete.");
}

main()
  .catch((error) => {
    console.error("\nDetection failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });