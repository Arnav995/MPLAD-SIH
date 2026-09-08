import "dotenv/config";

import { EsakshiService } from
  "../src/ingestion/esakshi/esakshi.service.js";

import type {
  WorksCompletedRecord,
} from "../src/ingestion/esakshi/esakshi.types.js";

async function main() {
  console.log(
    "Fetching and parsing Works Completed...",
  );

  const service = new EsakshiService();

  const records =
    await service.fetchReport<WorksCompletedRecord>(
      "worksCompleted",
      "0,0,0,2",
    );

  console.log(
    `Successfully parsed ${records.length} completed works.`,
  );

  console.log(
    "\n========== FIRST COMPLETED WORK ==========\n",
  );

  console.dir(records[0], {
    depth: null,
  });

  console.log(
    "\n========== DATA CHECK ==========\n",
  );

  console.log({
    totalRecords: records.length,

    firstWorkId: records[0]?.WORK_ID,

    firstRecommendationId:
      records[0]?.WORK_RECOMMENDATION_DTL_ID,

    firstState:
      records[0]?.STATE_NAME,

    firstAmount:
      records[0]?.ACTUAL_AMOUNT,
  });
}

main().catch((error: unknown) => {
  console.error(
    "Works Completed parser test failed:",
  );

  console.error(error);

  process.exit(1);
});