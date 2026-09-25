import { spawn } from "node:child_process";
import path from "node:path";

import {
  Prisma,
  RiskSeverity,
  RiskSignalType,
  RiskTier,
} from "@prisma/client";

import { prisma } from "../../db/prisma.js";

type MlProjectResult = {
  work_id: string;
  risk_index: number | null;
  tier: string;
  primary_anchors: unknown;
  signal_type_count: number;
  reasons: unknown;
  tier_promotion_reason: unknown;
  rule_score: number | null;
  rule_violations: unknown;
  cost_anomaly_score: number | null;
  cost_anomaly_flag: boolean;
  cost_anomaly_method: unknown;
  category_median: number | null;
  category_sample_size: number | null;
  duplicate_score: number | null;
  duplicate_paired_with: unknown;
  duplicate_reason: unknown;
  fast_track_flag: boolean;
};

type MlDuplicateCandidate = {
  work_id_a: string;
  work_id_b: string;
  district: string | null;
  category: string | null;
  text_similarity: number | null;
  days_apart: number | null;
  amount_ratio: number | null;
  same_vendor: boolean;
  duplicate_suspicion_score: number | null;
  reason: string | null;
};

type MlPipelineResult = {
  projects: MlProjectResult[];
  duplicate_candidates: MlDuplicateCandidate[];
  summary: {
    projects: number;
    tier_2: number;
    tier_1: number;
    clean: number;
  };
};

type MlInputRecord = {
  WORK_RECOMMENDATION_DTL_ID: string;
  WORK_ID: string | null;
  WORK_CATEGORY: string;
  WORK_DESCRIPTION: string;
  ACTIVITY_NAME: string;
  IDA_NAME: string;
  MP_NAME: string;
  CONSTITUENCY: string;
  LETTER_NO: string;
  VENDOR_NAME: string | null;
  RECIPIENT_TYPE: string;
  IS_TRIBAL_TRUST: boolean;
  IS_SC_AREA: null;
  IS_ST_AREA: null;
  RECOMMENDATION_DATE: string | null;
  SANCTION_DATE: string | null;
  ACTUAL_END_DATE: string | null;
  SANCTION_AMOUNT: number | null;
  RECOMMENDED_AMOUNT: number | null;
  ACTUAL_AMOUNT: number | null;
  FUND_DISBURSED_AMT: number;
};

function getPythonExecutable() {
  const configuredPath = process.env.ML_PYTHON_PATH;

  if (configuredPath) {
    return configuredPath;
  }

  const anomalyLayerPath = path.resolve(
    process.cwd(),
    "..",
    "AnomalyLayer",
  );

  if (process.platform === "win32") {
    return path.join(
      anomalyLayerPath,
      ".venv",
      "Scripts",
      "python.exe",
    );
  }

  return path.join(
    anomalyLayerPath,
    ".venv",
    "bin",
    "python",
  );
}

function getAnomalyLayerPath() {
  return path.resolve(
    process.cwd(),
    "..",
    "AnomalyLayer",
  );
}

function runPythonPipeline(
  records: MlInputRecord[],
): Promise<MlPipelineResult> {
  return new Promise((resolve, reject) => {
    const pythonExecutable = getPythonExecutable();
    const workingDirectory = getAnomalyLayerPath();

    const pythonProcess = spawn(
      pythonExecutable,
      ["score_backend.py"],
      {
        cwd: workingDirectory,
        windowsHide: true,
        stdio: [
          "pipe",
          "pipe",
          "pipe",
        ],
      },
    );

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on(
      "data",
      (chunk) => {
        stdout += chunk.toString();
      },
    );

    pythonProcess.stderr.on(
      "data",
      (chunk) => {
        stderr += chunk.toString();
      },
    );

    pythonProcess.on(
      "error",
      (error) => {
        reject(
          new Error(
            `Failed to start ML Python process: ${error.message}`,
          ),
        );
      },
    );

    pythonProcess.on(
      "close",
      (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `ML pipeline failed with exit code ${code}.\n${stderr}`,
            ),
          );

          return;
        }

        const lines = stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        const jsonLine = lines.at(-1);

        if (!jsonLine) {
          reject(
            new Error(
              "ML pipeline returned no JSON output.",
            ),
          );

          return;
        }

        try {
          const result =
            JSON.parse(jsonLine) as MlPipelineResult & {
              error?: string;
            };

          if (result.error) {
            reject(
              new Error(
                `ML pipeline error: ${result.error}`,
              ),
            );

            return;
          }

          resolve(result);
        } catch {
          reject(
            new Error(
              `Could not parse ML pipeline output as JSON.\n${stdout}`,
            ),
          );
        }
      },
    );

    pythonProcess.stdin.write(
      JSON.stringify(records),
    );

    pythonProcess.stdin.end();
  });
}

async function buildMlInput(): Promise<MlInputRecord[]> {
  const works = await prisma.work.findMany({
    orderBy: {
      id: "asc",
    },

    select: {
      recommendationDtlId: true,
      workId: true,
      category: true,
      description: true,
      activityName: true,
      idaNameFromSource: true,
      mpNameFromSource: true,
      constituencyNameFromSource: true,
      letterNo: true,
      recommendationDate: true,
      sanctionDate: true,
      completionDate: true,
      recommendedAmount: true,
      sanctionAmount: true,
      actualAmount: true,

      expenditures: {
        select: {
          amount: true,
          vendorNameFromSource: true,
        },
      },
    },
  });

  return works.map((work) => {
    const vendorNames = work.expenditures
      .map((expenditure) =>
        expenditure.vendorNameFromSource?.trim(),
      )
      .filter(
        (
          name,
        ): name is string => Boolean(name),
      );

    const uniqueVendorNames = [
      ...new Set(vendorNames),
    ];

    const expenditureTotal =
      work.expenditures.reduce(
        (
          total,
          expenditure,
        ) =>
          total +
          Number(
            expenditure.amount ?? 0,
          ),
        0,
      );

    return {
      WORK_RECOMMENDATION_DTL_ID:
        work.recommendationDtlId.toString(),

      WORK_ID:
        work.workId?.toString() ?? null,

      WORK_CATEGORY:
        work.category ?? "Unknown",

      WORK_DESCRIPTION:
        work.description ?? "",

      ACTIVITY_NAME:
        work.activityName ?? "",

      IDA_NAME:
        work.idaNameFromSource ?? "",

      MP_NAME:
        work.mpNameFromSource ?? "",

      CONSTITUENCY:
        work.constituencyNameFromSource ?? "",

      LETTER_NO:
        work.letterNo ?? "",

      VENDOR_NAME:
        uniqueVendorNames.length > 0
          ? uniqueVendorNames.join(" | ")
          : null,

      RECIPIENT_TYPE:
        "Government Agency",

      IS_TRIBAL_TRUST:
        false,

      IS_SC_AREA:
        null,

      IS_ST_AREA:
        null,

      RECOMMENDATION_DATE:
        work.recommendationDate?.toISOString() ?? null,

      SANCTION_DATE:
        work.sanctionDate?.toISOString() ?? null,

      ACTUAL_END_DATE:
        work.completionDate?.toISOString() ?? null,

      SANCTION_AMOUNT:
        work.sanctionAmount != null
          ? Number(work.sanctionAmount)
          : null,

      RECOMMENDED_AMOUNT:
        work.recommendedAmount != null
          ? Number(work.recommendedAmount)
          : null,

      ACTUAL_AMOUNT:
        work.actualAmount != null
          ? Number(work.actualAmount)
          : null,

      FUND_DISBURSED_AMT:
        expenditureTotal,
    };
  });
}

function toRiskTier(tier: string): RiskTier {
  if (tier === "tier_2") {
    return RiskTier.TIER_2;
  }

  if (tier === "tier_1") {
    return RiskTier.TIER_1;
  }

  return RiskTier.CLEAN;
}

function toSeverity(score: number): RiskSeverity {
  if (score >= 0.8) {
    return RiskSeverity.HIGH;
  }

  if (score >= 0.5) {
    return RiskSeverity.MEDIUM;
  }

  return RiskSeverity.LOW;
}

function asNumber(value: unknown): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return value;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}

async function persistMlResults(
  result: MlPipelineResult,
) {
  const works = await prisma.work.findMany({
    select: {
      id: true,
      recommendationDtlId: true,
    },
  });

  const workIdByRecommendationId =
    new Map<string, number>();

  for (const work of works) {
    workIdByRecommendationId.set(
      work.recommendationDtlId.toString(),
      work.id,
    );
  }

  const riskAssessmentRows = result.projects
    .map((project) => {
      const workId =
        workIdByRecommendationId.get(
          project.work_id,
        );

      if (workId == null) {
        return null;
      }

      const riskIndex =
        asNumber(project.risk_index) ?? 0;

      const anchors =
        asStringArray(
          project.primary_anchors,
        );

      const reasons =
        asStringArray(
          project.reasons,
        );

      return {
        workId,

        riskIndex:
          new Prisma.Decimal(riskIndex),

        tier:
          toRiskTier(project.tier),

        primaryAnchors:
          anchors as Prisma.InputJsonValue,

        explanation: {
          reasons,
          tierPromotionReason:
            project.tier_promotion_reason,
          signalTypeCount:
            project.signal_type_count,
          ruleScore:
            project.rule_score,
          ruleViolations:
            project.rule_violations,
          costAnomalyScore:
            project.cost_anomaly_score,
          costAnomalyFlag:
            project.cost_anomaly_flag,
          costAnomalyMethod:
            project.cost_anomaly_method,
          categoryMedian:
            project.category_median,
          categorySampleSize:
            project.category_sample_size,
          duplicateScore:
            project.duplicate_score,
          duplicatePairedWith:
            project.duplicate_paired_with,
          duplicateReason:
            project.duplicate_reason,
          fastTrackFlag:
            project.fast_track_flag,
        } as Prisma.InputJsonValue,

        evaluatedAt: new Date(),
      };
    })
    .filter(
      (
        row,
      ): row is NonNullable<typeof row> =>
        row !== null,
    );

  const riskSignalRows: Prisma.RiskSignalCreateManyInput[] =
    [];

  for (const project of result.projects) {
    const workId =
      workIdByRecommendationId.get(
        project.work_id,
      );

    if (workId == null) {
      continue;
    }

    const costScore =
      asNumber(
        project.cost_anomaly_score,
      );

    if (
      project.cost_anomaly_flag &&
      costScore != null
    ) {
      const reasons =
        asStringArray(
          project.reasons,
        );

      const costReason =
        reasons.find(
          (reason) =>
            reason
              .toLowerCase()
              .includes("category median"),
        ) ??
        "Cost anomaly detected by the ML cost-anomaly layer.";

      riskSignalRows.push({
        workId,

        type:
          RiskSignalType.COST_ANOMALY,

        severity:
          toSeverity(costScore),

        score:
          new Prisma.Decimal(
            costScore * 100,
          ),

        reason: costReason,

        evidence: {
          method:
            project.cost_anomaly_method,
          score:
            costScore,
          categoryMedian:
            project.category_median,
          categorySampleSize:
            project.category_sample_size,
        } as Prisma.InputJsonValue,
      });
    }

    const duplicateScore =
      asNumber(
        project.duplicate_score,
      );

    if (
      duplicateScore != null &&
      duplicateScore >= 0.5
    ) {
      const pairedWith =
        asStringArray(
          project.duplicate_paired_with,
        );

      riskSignalRows.push({
        workId,

        type:
          RiskSignalType.DUPLICATE_OVERLAP,

        severity:
          toSeverity(duplicateScore),

        score:
          new Prisma.Decimal(
            duplicateScore * 100,
          ),

        reason:
          typeof project.duplicate_reason ===
          "string"
            ? project.duplicate_reason
            : "Potential duplicate/overlap candidate identified by the ML duplicate detector.",

        evidence: {
          score:
            duplicateScore,
          pairedWith,
        } as Prisma.InputJsonValue,
      });
    }
  }

  const duplicateRows =
    result.duplicate_candidates
      .map((candidate) => {
        const workAId =
          workIdByRecommendationId.get(
            candidate.work_id_a,
          );

        const workBId =
          workIdByRecommendationId.get(
            candidate.work_id_b,
          );

        if (
          workAId == null ||
          workBId == null ||
          workAId === workBId
        ) {
          return null;
        }

        const firstId =
          Math.min(
            workAId,
            workBId,
          );

        const secondId =
          Math.max(
            workAId,
            workBId,
          );

        return {
          workAId: firstId,

          workBId: secondId,

          textSimilarity:
            candidate.text_similarity != null
              ? new Prisma.Decimal(
                  candidate.text_similarity,
                )
              : null,

          amountRatio:
            candidate.amount_ratio != null
              ? new Prisma.Decimal(
                  candidate.amount_ratio,
                )
              : null,

          daysApart:
            candidate.days_apart != null
              ? Math.round(
                  candidate.days_apart,
                )
              : null,

          sameVendor:
            candidate.same_vendor,

          suspicionScore:
            candidate.duplicate_suspicion_score != null
              ? new Prisma.Decimal(
                  candidate.duplicate_suspicion_score *
                    100,
                )
              : null,

          humanReviewReason:
            candidate.reason,
        };
      })
      .filter(
        (
          row,
        ): row is NonNullable<typeof row> =>
          row !== null,
      );

  const uniqueDuplicateRows =
    new Map<
      string,
      (typeof duplicateRows)[number]
    >();

  for (const row of duplicateRows) {
    const key =
      `${row.workAId}:${row.workBId}`;

    uniqueDuplicateRows.set(
      key,
      row,
    );
  }

  const finalDuplicateRows =
    [...uniqueDuplicateRows.values()];

    // await prisma.$transaction(
    // async (tx) => {
    //   await tx.riskSignal.deleteMany({});

    //   await tx.riskAssessment.deleteMany({});

    //   await tx.duplicateCandidate.deleteMany({});

    //   if (riskAssessmentRows.length > 0) {
    //     await tx.riskAssessment.createMany({
    //       data: riskAssessmentRows,
    //     });
    //   }

    //   if (riskSignalRows.length > 0) {
    //     await tx.riskSignal.createMany({
    //       data: riskSignalRows,
    //     });
    //   }

    //   if (finalDuplicateRows.length > 0) {
    //     await tx.duplicateCandidate.createMany({
    //       data: finalDuplicateRows,
    //       skipDuplicates: true,
    //     });
    //   }
    // },
    // {
    //   timeout: 60_000,
    // },
    //
  //);
  const BATCH_SIZE = 5000;

// Clear previous ML outputs
await prisma.riskSignal.deleteMany({});
await prisma.riskAssessment.deleteMany({});
await prisma.duplicateCandidate.deleteMany({});

console.log("Writing risk assessments...");

for (let i = 0; i < riskAssessmentRows.length; i += BATCH_SIZE) {
  await prisma.riskAssessment.createMany({
    data: riskAssessmentRows.slice(i, i + BATCH_SIZE),
  });
}

console.log("Writing risk signals...");

for (let i = 0; i < riskSignalRows.length; i += BATCH_SIZE) {
  await prisma.riskSignal.createMany({
    data: riskSignalRows.slice(i, i + BATCH_SIZE),
  });
}

console.log("Writing duplicate candidates...");

for (let i = 0; i < finalDuplicateRows.length; i += BATCH_SIZE) {
  await prisma.duplicateCandidate.createMany({
    data: finalDuplicateRows.slice(i, i + BATCH_SIZE),
    skipDuplicates: true,
  });

  if ((i / BATCH_SIZE + 1) % 10 === 0) {
    console.log(
      `  ${Math.min(i + BATCH_SIZE, finalDuplicateRows.length)} / ${finalDuplicateRows.length}`,
    );
  }
}

  return {
    projectsPersisted:
      riskAssessmentRows.length,

    riskSignalsPersisted:
      riskSignalRows.length,

    duplicateCandidatesPersisted:
      finalDuplicateRows.length,
  };
}

export async function runMlPipeline() {
  console.log(
    "Loading projects from database...",
  );

  const records =
    await buildMlInput();

  console.log(
    `Sending ${records.length} projects to Python ML pipeline...`,
  );

  const result =
    await runPythonPipeline(records);

  console.log(
    `ML evaluation complete: ${result.summary.projects} projects.`,
  );

  console.log(
    `Tier 2: ${result.summary.tier_2}`,
  );

  console.log(
    `Tier 1: ${result.summary.tier_1}`,
  );

  console.log(
    `Clean: ${result.summary.clean}`,
  );

  console.log(
    `Duplicate candidates: ${result.duplicate_candidates.length}`,
  );

  console.log(
    "Persisting ML results to database...",
  );

  const persisted =
    await persistMlResults(result);

  console.log(
    `Persisted ${persisted.projectsPersisted} risk assessments.`,
  );

  console.log(
    `Persisted ${persisted.riskSignalsPersisted} risk signals.`,
  );

  console.log(
    `Persisted ${persisted.duplicateCandidatesPersisted} duplicate candidates.`,
  );

  return {
    ...result,
    persisted,
  };
}