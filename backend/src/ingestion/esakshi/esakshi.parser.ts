import type{
     EsakshiRawResponse
} from "./esakshi.types.js"
import { EsakshiRequestError } from "./esakshi.errors.js"
import { error } from "node:console";

export function parseTilesReportData<T>(response: EsakshiRawResponse,
     key: string,
): T[]{
     const rawData = response[key];

     if(!rawData){
          throw new EsakshiRequestError(
               `Esakshi response doesn't contain key: ${key}`
          );
     }

     if(typeof rawData !== "string"){
          throw new EsakshiRequestError(`Expected "${key}" to be a json string`);
     }
try {
     const parsedData: unknown = JSON.parse(rawData);

     if(!Array.isArray(parsedData)){
          throw new EsakshiRequestError(
               `Parsed ${key} data is not an Array`
          )
     }
     return parsedData as T[];

} catch (err) {
     if(err instanceof EsakshiRequestError){
          throw err;
     }
     throw new EsakshiRequestError(
          `Failed to parse esakshi response for key: "${key}"`,
     );
}

}