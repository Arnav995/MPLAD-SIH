import "dotenv/config";
import { runBenfordPipeline } from "../src/services/benford/benford-pipeline.service.js";

async function main() {
  console.log("Running Benford forensic analysis...\n");

  const result = await runBenfordPipeline();

  console.log(`Transactions : ${result.totalTransactions}`);
  console.log(`Chi Square   : ${result.chiSquareValue}`);
  console.log(`P Value      : ${result.pVal}`);
  console.log(`Flagged Rows : ${result.flaggedTransactions.length}`);

  console.log("\nCompleted.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});