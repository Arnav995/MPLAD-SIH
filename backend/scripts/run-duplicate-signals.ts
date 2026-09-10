import "../src/config/env.js";

import { prisma } from "../src/db/prisma.js";
import { createDuplicateRiskSignals } from "../src/services/detection/duplicate-signal.service.js";

async function main() {
  console.log("\n=== DUPLICATE RISK SIGNALS ===");

  const result = await createDuplicateRiskSignals();

  console.log("Candidates processed:", result.candidatesProcessed);
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