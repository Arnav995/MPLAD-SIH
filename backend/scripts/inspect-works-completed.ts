import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const filePath = path.resolve(
    "data/raw/esakshi/works-completed-test.json",
  );

  const fileContent = await fs.readFile(
    filePath,
    "utf8",
  );

  const response = JSON.parse(fileContent);

  const responseKey = "Total Works Completed";

  const rawData = response[responseKey];

  console.log("\n========== TOP LEVEL KEYS ==========\n");

  console.log(Object.keys(response));

  console.log("\n========== RAW DATA TYPE ==========\n");

  console.log(typeof rawData);

  if (typeof rawData !== "string") {
    throw new Error(
      `Expected "${responseKey}" to contain a string`,
    );
  }

  const records = JSON.parse(rawData);

  console.log("\n========== TOTAL RECORDS ==========\n");

  console.log(records.length);

  console.log("\n========== FIRST RECORD KEYS ==========\n");

  console.log(Object.keys(records[0]));

  console.log("\n========== FIRST RECORD ==========\n");

  console.dir(records[0], {
    depth: null,
  });

  console.log("\n========== SECOND RECORD ==========\n");

  console.dir(records[1], {
    depth: null,
  });
}

main().catch((error: unknown) => {
  console.error("Inspection failed:");
  console.error(error);

  process.exit(1);
});