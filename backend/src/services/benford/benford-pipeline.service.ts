import { spawn } from "child_process";
import path from "path";
import { prisma } from "../../db/prisma.js";

export interface BenfordResult {
  totalTransactions: number;
  chiSquareValue: number;
  chiSquareThreshold: number;
  pVal: string;
  firstDigitDistribution: Array<{
    digit: number;
    expected: number;
    actual: number;
    status: string;
  }>;
  flaggedTransactions: Array<{
    id: string;
    district: string;
    contractor: string;
    amount: string;
    leadDigit: number;
    anomalyScore: number;
    reason: string;
    projectRef: string;
  }>;
}

export async function runBenfordPipeline(): Promise<BenfordResult> {
  const expenditures = await prisma.expenditure.findMany({
    select: {
      amount: true,
      vendorNameFromSource: true,
      constituencyFromSource: true,
      work: {
        select: {
          workId: true,
          activityName: true,
        },
      },
    },
  });

  const records = expenditures.map((e) => ({
    amount: Number(e.amount),
    contractor: e.vendorNameFromSource ?? "Unknown Vendor",
    district: e.constituencyFromSource ?? "Unknown",
    projectRef: String(e.work.workId),
    activity: e.work.activityName,
  }));

  const pythonPath =
    process.platform === "win32"
      ? path.resolve("../AnomalyLayer/.venv/Scripts/python.exe")
      : path.resolve("../AnomalyLayer/.venv/bin/python");

  const scriptPath = path.resolve("../AnomalyLayer/benford_check.py");

  return new Promise((resolve, reject) => {
    const py = spawn(pythonPath, [scriptPath]);

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (d) => (stdout += d.toString()));
    py.stderr.on("data", (d) => (stderr += d.toString()));

    py.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || "Benford pipeline failed"));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error("Invalid JSON returned by benford_check.py"));
      }
    });

    py.stdin.write(JSON.stringify(records));
    py.stdin.end();
  });
}