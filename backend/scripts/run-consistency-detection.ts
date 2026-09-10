import "../src/config/env.js";

import { prisma } from "../src/db/prisma.js";
import { runConsistencyDetection } from "../src/services/detection/consistency.service.js";

async function main() {
  console.log("\n=== CONSISTENCY DETECTION ===");

  const result = await runConsistencyDetection();

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