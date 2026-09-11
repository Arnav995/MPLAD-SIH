import "dotenv/config";

import { EsakshiService } from "../src/ingestion/esakshi/esakshi.service.js";

async function main() {
  const service = new EsakshiService();

  const response =
    await service.fetchRawReport(
      "expenditure",
      "1,0,0,2",
    );

  console.log("\nResponse keys:");
  console.log(
    Object.keys(response),
  );

  console.log("\nRaw response:");
  console.dir(response, {
    depth: 4,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});