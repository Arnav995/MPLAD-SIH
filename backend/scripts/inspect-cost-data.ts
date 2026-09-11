import "../src/config/env.js";

import { prisma } from "../src/db/prisma.js";

async function main() {
  const works = await prisma.work.findMany({
    select: {
      id: true,
      sanctionAmount: true,
      expenditures: {
        select: {
          amount: true,
        },
      },
    },
  });

  let withSanction = 0;
  let withExpenditure = 0;
  let exceedingSanction = 0;

  let highestRatio = 0;
  let highestWorkId: number | null = null;
  let highestSanction = 0;
  let highestExpenditure = 0;

  for (const work of works) {
    if (work.sanctionAmount == null) {
      continue;
    }

    const sanction = Number(work.sanctionAmount);

    if (!Number.isFinite(sanction) || sanction <= 0) {
      continue;
    }

    withSanction++;

    const expenditure = work.expenditures.reduce(
      (total, item) =>
        total + Number(item.amount ?? 0),
      0,
    );

    if (expenditure > 0) {
      withExpenditure++;
    }

    if (expenditure > sanction) {
      exceedingSanction++;
    }

    const ratio = expenditure / sanction;

    if (ratio > highestRatio) {
      highestRatio = ratio;
      highestWorkId = work.id;
      highestSanction = sanction;
      highestExpenditure = expenditure;
    }
  }

  console.log("\n=== COST DATA INSPECTION ===");
  console.log("Works:", works.length);
  console.log("Works with sanction:", withSanction);
  console.log("Works with expenditure:", withExpenditure);
  console.log(
    "Expenditure exceeding sanction:",
    exceedingSanction,
  );

  console.log("\nHighest expenditure/sanction ratio:");
  console.log("Work ID:", highestWorkId);
  console.log("Sanction:", highestSanction);
  console.log("Expenditure:", highestExpenditure);
  console.log(
    "Ratio:",
    `${(highestRatio * 100).toFixed(2)}%`,
  );
}

main()
  .catch((error) => {
    console.error("\nInspection failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });