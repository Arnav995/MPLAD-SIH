import "../src/config/env.js";

import { prisma } from "../src/db/prisma.js";
import { RiskSignalType } from "@prisma/client";

async function main() {
  console.log("\n=== TIER-2 SIGNAL INSPECTION ===\n");

  const duplicateSignals = await prisma.riskSignal.findMany({
    where: {
      type: RiskSignalType.DUPLICATE_OVERLAP,
    },
    select: {
      workId: true,
      score: true,
      severity: true,
      reason: true,
    },
  });

  const costSignals = await prisma.riskSignal.findMany({
    where: {
      type: RiskSignalType.COST_ANOMALY,
    },
    select: {
      workId: true,
      score: true,
      severity: true,
      reason: true,
    },
  });

  const consistencySignals = await prisma.riskSignal.findMany({
    where: {
      type: RiskSignalType.CROSS_STAGE_CONSISTENCY,
    },
    select: {
      workId: true,
      score: true,
      severity: true,
      reason: true,
    },
  });

  const costWorkIds = new Set(costSignals.map((signal) => signal.workId));
  const consistencyWorkIds = new Set(
    consistencySignals.map((signal) => signal.workId),
  );

  const duplicateWithCost = duplicateSignals.filter((signal) =>
    costWorkIds.has(signal.workId),
  );

  const duplicateWithConsistency = duplicateSignals.filter((signal) =>
    consistencyWorkIds.has(signal.workId),
  );

  const allSignalWorkIds = new Set([
    ...duplicateSignals.map((signal) => signal.workId),
    ...costSignals.map((signal) => signal.workId),
    ...consistencySignals.map((signal) => signal.workId),
  ]);

  const worksWithMultipleTypes = [...allSignalWorkIds].filter((workId) => {
    const hasDuplicate = duplicateSignals.some(
      (signal) => signal.workId === workId,
    );

    const hasCost = costSignals.some(
      (signal) => signal.workId === workId,
    );

    const hasConsistency = consistencySignals.some(
      (signal) => signal.workId === workId,
    );

    return [hasDuplicate, hasCost, hasConsistency].filter(Boolean).length >= 2;
  });

  console.log("Duplicate signals:", duplicateSignals.length);
  console.log("Cost signals:", costSignals.length);
  console.log("Consistency signals:", consistencySignals.length);

  console.log("\nDuplicate + Cost:", duplicateWithCost.length);
  console.log(
    "Duplicate + Consistency:",
    duplicateWithConsistency.length,
  );

  console.log(
    "Works with 2+ signal types:",
    worksWithMultipleTypes.length,
  );

  console.log("\nSample duplicate + cost works:");

  console.table(
    duplicateWithCost.slice(0, 20).map((signal) => ({
      workId: signal.workId,
      duplicateScore: signal.score.toString(),
      duplicateSeverity: signal.severity,
      costScore:
        costSignals
          .find((cost) => cost.workId === signal.workId)
          ?.score.toString() ?? null,
      costSeverity:
        costSignals.find((cost) => cost.workId === signal.workId)
          ?.severity ?? null,
    })),
  );

  console.log("\nSample works with 2+ signal types:");

  console.table(
    worksWithMultipleTypes.slice(0, 20).map((workId) => ({
      workId,
      duplicate: duplicateSignals.some(
        (signal) => signal.workId === workId,
      ),
      cost: costSignals.some(
        (signal) => signal.workId === workId,
      ),
      consistency: consistencySignals.some(
        (signal) => signal.workId === workId,
      ),
    })),
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