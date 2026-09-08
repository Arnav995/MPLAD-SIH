import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const filePath = path.resolve(
    "data/raw/esakshi/allocated-limit-test.json",
  );

  const fileContent = await fs.readFile(
    filePath,
    "utf8",
  );

  const response = JSON.parse(fileContent);

  console.log("\n========== RESPONSE TYPE ==========");
  console.log(typeof response);

  console.log("\n========== IS ARRAY ==========");
  console.log(Array.isArray(response));

  console.log("\n========== TOP LEVEL KEYS ==========");

  if (
    typeof response === "object" &&
    response !== null &&
    !Array.isArray(response)
  ) {
    console.log(Object.keys(response));
  }

  console.log("\n========== RESPONSE PREVIEW ==========");

  console.dir(response, {
    depth: 2,
    maxArrayLength: 3,
  });

  console.log("\n========== FIRST RECORD ==========");

  if (Array.isArray(response)) {
    console.dir(response[0], {
      depth: null,
    });
  }
}

main().catch((error: unknown) => {
  console.error("Inspection failed:");
  console.error(error);

  process.exit(1);
});