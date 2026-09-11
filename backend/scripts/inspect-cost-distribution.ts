import "../src/config/env.js";

import { prisma } from "../src/db/prisma.js";

async function main() {
  const works = await prisma.work.findMany({
    where: {
      sanctionAmount: {
        not: null,
      },
    },
    select: {
      id: true,
      category: true,
      sanctionAmount: true,
      expenditures: {
        select: {
          amount: true,
        },
      },
    },
  });

  const rows = works
    .map((work) => {
      const sanction = Number(work.sanctionAmount ?? 0);

      const expenditure = work.expenditures.reduce(
        (total, item) => total + Number(item.amount ?? 0),
        0,
      );

      return {
        workId: work.id,
        category: work.category ?? "UNKNOWN",
        sanction,
        expenditure,
      };
    })
    .filter(
      (row) =>
        row.sanction > 0 &&
        row.expenditure > 0 &&
        Number.isFinite(row.sanction) &&
        Number.isFinite(row.expenditure),
    );

  const percentile = (values: number[], p: number): number | null => {
    if (values.length === 0) {
      return null;
    }

    const index = Math.floor((values.length - 1) * p);

    return values[index];
  };

  const expenditureAmounts = rows
    .map((row) => row.expenditure)
    .sort((a, b) => a - b);

  const categoryStats = new Map<
    string,
    {
      count: number;
      totalExpenditure: number;
      maxExpenditure: number;
    }
  >();

  for (const row of rows) {
    const existing = categoryStats.get(row.category) ?? {
      count: 0,
      totalExpenditure: 0,
      maxExpenditure: 0,
    };

    existing.count += 1;
    existing.totalExpenditure += row.expenditure;
    existing.maxExpenditure = Math.max(
      existing.maxExpenditure,
      row.expenditure,
    );

    categoryStats.set(row.category, existing);
  }

  console.log("\n=== COST EXPENDITURE DISTRIBUTION ===");

  console.log("Works with expenditure:", rows.length);

  console.log(
    "P50 expenditure:",
    percentile(expenditureAmounts, 0.5),
  );

  console.log(
    "P75 expenditure:",
    percentile(expenditureAmounts, 0.75),
  );

  console.log(
    "P90 expenditure:",
    percentile(expenditureAmounts, 0.9),
  );

  console.log(
    "P95 expenditure:",
    percentile(expenditureAmounts, 0.95),
  );

  console.log(
    "P99 expenditure:",
    percentile(expenditureAmounts, 0.99),
  );

  console.log("\n=== CATEGORY DISTRIBUTION ===");

  const categories = [...categoryStats.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  );

  for (const [category, stats] of categories) {
    console.log({
      category,
      works: stats.count,
      averageExpenditure: Math.round(
        stats.totalExpenditure / stats.count,
      ),
      maxExpenditure: stats.maxExpenditure,
    });
  }

  console.log("\n=== TOP 20 EXPENDITURES ===");

  rows
    .sort((a, b) => b.expenditure - a.expenditure)
    .slice(0, 20)
    .forEach((row) => {
      console.log({
        workId: row.workId,
        category: row.category,
        sanction: row.sanction,
        expenditure: row.expenditure,
      });
    });

  console.log("\n=== P99 COST OUTLIERS ===");

  const overallP99 = percentile(expenditureAmounts, 0.99);

  if (overallP99 == null) {
    console.log("No expenditure data available.");
    return;
  }

  const categoryThresholds = new Map<string, number>();

  for (const [category, stats] of categoryStats.entries()) {
    const categoryValues = rows
      .filter((row) => row.category === category)
      .map((row) => row.expenditure)
      .sort((a, b) => a - b);

    const categoryP99 = percentile(categoryValues, 0.99);

    const threshold =
      stats.count >= 30 && categoryP99 != null
        ? categoryP99
        : overallP99;

    categoryThresholds.set(category, threshold);
  }

  console.log("Overall P99:", overallP99);

  console.log("\nCategory thresholds:");

  for (const [category, threshold] of categoryThresholds.entries()) {
    console.log({
      category,
      threshold,
      sampleSize: categoryStats.get(category)?.count ?? 0,
    });
  }

  const outliers = rows
    .filter((row) => {
      const threshold =
        categoryThresholds.get(row.category) ?? overallP99;

      return row.expenditure > threshold;
    })
    .sort((a, b) => b.expenditure - a.expenditure);

  console.log("\nFlagged works:", outliers.length);

  for (const row of outliers.slice(0, 20)) {
    const threshold =
      categoryThresholds.get(row.category) ?? overallP99;

    const excessPercent =
      threshold > 0
        ? (
            ((row.expenditure - threshold) / threshold) *
            100
          ).toFixed(1)
        : "0.0";

    console.log({
      workId: row.workId,
      category: row.category,
      sanction: row.sanction,
      expenditure: row.expenditure,
      threshold,
      excessPercent: `${excessPercent}%`,
    });
  }
}

main()
  .catch((error) => {
    console.error("\nCost distribution inspection failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });