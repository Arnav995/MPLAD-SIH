import { prisma } from "./db/prisma.js";

async function main() {
  console.log("\n=== TIER-2 DEBUG ===\n");

  const assessments =
    await prisma.riskAssessment.findMany({
      where: {
        tier: "TIER_2",
      },

      select: {
        workId: true,
        riskIndex: true,
        tier: true,
      },

      orderBy: {
        riskIndex: "desc",
      },

      take: 20,
    });

  console.log(
    "TIER_2 assessments:",
    assessments.length,
  );

  console.table(
    assessments.map((assessment) => ({
      workId: assessment.workId,
      riskIndex:
        assessment.riskIndex.toString(),
      tier: assessment.tier,
    })),
  );

  const count =
    await prisma.riskAssessment.count({
      where: {
        tier: "TIER_2",
      },
    });

  console.log(
    "\nTOTAL TIER_2:",
    count,
  );

  const work4352 =
    await prisma.riskAssessment.findUnique({
      where: {
        workId: 4352,
      },
    });

  console.log(
    "\nWORK 4352:",
    work4352,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });