// import "../src/config/env.js";

// import { EsakshiService } from "../src/ingestion/esakshi/esakshi.service.js";

// async function main() {
//   const api = new EsakshiService();

//   const states = await api.fetchStates();

//   console.log(`Found ${states.length} States / UTs\n`);

//   console.table(
//     states.map((s) => ({
//       id: s.STATE_ID,
//       state: s.STATE_NAME,
//       combo: `${s.STATE_ID},0,0,2`,
//     }))
//   );
// }

// main().catch(console.error);