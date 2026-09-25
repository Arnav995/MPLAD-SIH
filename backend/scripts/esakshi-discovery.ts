import "../src/config/env.js";

import { EsakshiService } from "../src/ingestion/esakshi/esakshi.service.js";

async function main() {
  const api = new EsakshiService();

  const states = await api.fetchStates();

  console.log(`States found: ${states.length}`);
  console.log("");

  states.forEach((s) =>
    console.log(`${s.STATE_ID} -> ${s.STATE_NAME}`)
  );
}

main().catch(console.error);