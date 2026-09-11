import "../src/config/env.js";

import { prisma } from "../src/db/prisma.js";
import { runRiskAssessment } from "../src/services/risk/risk.service.js";

async function main() {
  console.log("\n=== RISK ASSESSMENT ===");

  const result = await runRiskAssessment();

  console.log("Works evaluated:", result.worksEvaluated);
  console.log("\nRisk assessment complete.");
}

main()
  .catch((error) => {
    console.error("\nRisk assessment failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });