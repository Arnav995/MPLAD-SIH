import "dotenv/config";
import { EsakshiIngestionService } from "../src/services/ingestion/esakshi-ingestion.service.js";

(async () => {
  try {
    const service = new EsakshiIngestionService();
    const result = await service.ingestExpenditure("1,0,0,2");

    console.log("Expenditure ingestion complete.");
    console.log(result);
  } catch (error) {
    console.error("Ingestion failed:", error);
  }
})();