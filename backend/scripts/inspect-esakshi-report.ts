import "../src/config/env.js";

import { EsakshiService } from "../src/ingestion/esakshi/esakshi.service";
import type { WorksRecommendedRecord } from "../src/ingestion/esakshi/esakshi.types";

const combo = process.argv[2] ?? "1,0,0,2";

async function main() {
  const service = new EsakshiService();

  const result = await service.fetchReport<WorksRecommendedRecord>(
    "worksRecommended",
    combo,
  );

  console.log("\n=== WORKS RECOMMENDED PROFILE ===");
  console.log("Combo:", combo);
  console.log("Records:", result.length);

  const recommendationIds = new Set(
    result.map((r) => r.WORK_RECOMMENDATION_DTL_ID),
  );

  const constituencyIds = new Set(
    result.map((r) => r.CONSTITUENCY_ID),
  );

  const mpNames = new Set(
    result.map((r) => r.MP_NAME),
  );

  const stages = new Map<string, number>();

  for (const record of result) {
    const stage = record.WORK_STAGE || "EMPTY";
    stages.set(stage, (stages.get(stage) ?? 0) + 1);
  }

  const duplicateIds = new Map<number, number>();

  for (const record of result) {
    const id = record.WORK_RECOMMENDATION_DTL_ID;
    duplicateIds.set(id, (duplicateIds.get(id) ?? 0) + 1);
  }

  const duplicates = [...duplicateIds.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  const missing = {
    activityName: result.filter((r) => !r.ACTIVITY_NAME).length,
    description: result.filter((r) => !r.WORK_DESCRIPTION).length,
    recommendationDate: result.filter(
      (r) => !r.RECOMMENDATION_DATE,
    ).length,
    recommendedAmount: result.filter(
      (r) => r.RECOMMENDED_AMOUNT == null,
    ).length,
    constituencyId: result.filter(
      (r) => r.CONSTITUENCY_ID == null,
    ).length,
    recommendationDtlId: result.filter(
      (r) => r.WORK_RECOMMENDATION_DTL_ID == null,
    ).length,
  };

  console.log("\nUnique recommendation IDs:", recommendationIds.size);
  console.log("Duplicate recommendation IDs:", duplicates.length);

  if (duplicates.length > 0) {
    console.log("\nTop duplicate recommendation IDs:");

    console.table(
      duplicates.slice(0, 20).map(([id, count]) => ({
        recommendationDtlId: id,
        count,
      })),
    );
  }

  console.log("\nUnique constituencies:", constituencyIds.size);
  console.log("Unique MPs:", mpNames.size);

  console.log("\nLifecycle stages:");

  console.table(
    [...stages.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([stage, count]) => ({
        stage,
        count,
      })),
  );

  console.log("\nMissing fields:");
  console.table(missing);

  console.log("\nFirst record:");
  console.dir(result[0], {
    depth: null,
    colors: true,
  });
}

main().catch((error) => {
  console.error("\nWorks Recommended profiling failed:");
  console.error(error);
  process.exit(1);
});
// import "../src/config/env.js";

// import EsakshiClient from "../src/ingestion/esakshi/esakshi.client";
// import { ESAKSHI_REPORTS } from "../src/ingestion/esakshi/esakshi.reports";

// const reportName = process.argv[2];
// const combo = process.argv[3] ?? "0,0,0,2";

// if (!reportName) {
//   console.error(
//     "Usage: npm run esakshi:inspect-report -- <reportName> [combo]",
//   );
//   process.exit(1);
// }

// async function main() {
//   const config =
//     ESAKSHI_REPORTS[
//       reportName as keyof typeof ESAKSHI_REPORTS
//     ];

//   if (!config) {
//     throw new Error(`Unknown report: ${reportName}`);
//   }

//   const client = new EsakshiClient();

//   console.log("\n=== eSAKSHI RAW REPORT REQUEST ===");
//   console.log("Report:", reportName);
//   console.log("Request key:", config.requestKey);
//   console.log("Expected response key:", config.responseKey);
//   console.log("Combo:", combo);
//   console.log("Fetching...\n");

//   const response = await client.getTilesReportData(
//     combo,
//     config.requestKey,
//   );

//   console.log("\n=== RAW RESPONSE KEYS ===");

//   for (const [key, value] of Object.entries(response)) {
//     console.log(
//       `- ${key}: ${
//         typeof value === "string"
//           ? `${value.length} chars`
//           : typeof value
//       }`,
//     );
//   }

//   console.log("\n=== RAW RESPONSE PREVIEW ===");

//   for (const [key, value] of Object.entries(response)) {
//     console.log(`\n--- ${key} ---`);

//     if (typeof value === "string") {
//       console.log(value.slice(0, 1000));
//     } else {
//       console.dir(value, {
//         depth: 3,
//         colors: true,
//       });
//     }
//   }
// }

// main().catch((error) => {
//   console.error("\nReport inspection failed:");
//   console.error(error);
//   process.exit(1);
// });
// // import "../src/config/env.js";

// // import { EsakshiService } from "../src/ingestion/esakshi/esakshi.service";

// // const reportName = process.argv[2];
// // const combo = process.argv[3] ?? "0,0,0,2";

// // if (!reportName) {
// //   console.error(
// //     "Usage: npm run esakshi:inspect-report -- <reportName> [combo]",
// //   );
// //   process.exit(1);
// // }

// // async function main() {
// //   const service = new EsakshiService();

// //   console.log("\n=== eSAKSHI REPORT REQUEST ===");
// //   console.log("Report:", reportName);
// //   console.log("Combo:", combo);
// //   console.log("Fetching...\n");

// //   const result = await service.fetchReport(
// //     reportName as never,
// //     combo,
// //   );

// //   console.log("\n=== eSAKSHI REPORT INSPECTION ===");
// //   console.log("Report:", reportName);
// //   console.log("Combo:", combo);
// //   console.log("Record count:", result.length);

// //   if (result.length === 0) {
// //     console.log("No records returned.");
// //     return;
// //   }

// //   console.log("\nFirst record:");
// //   console.dir(result[0], {
// //     depth: null,
// //     colors: true,
// //   });

// //   console.log("\nKeys:");
// //   console.log(
// //     Object.keys(result[0] as Record<string, unknown>),
// //   );

// //   if (result.length > 1) {
// //     console.log("\nSecond record:");
// //     console.dir(result[1], {
// //       depth: null,
// //       colors: true,
// //     });
// //   }
// // }

// // main().catch((error) => {
// //   console.error("\nReport inspection failed:");
// //   console.error(error);
// //   process.exit(1);
// // });