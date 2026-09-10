import "../src/config/env.js";

import { prisma } from "../src/db/prisma.js";
import { runCostDetection } from "../src/services/detection/cost.service.js";

async function main() {
  console.log("\n=== COST ANOMALY DETECTION ===");

  const result = await runCostDetection();

  console.log("Works checked:", result.worksChecked);
  console.log("Signals created:", result.signalsCreated);

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