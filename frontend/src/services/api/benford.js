import { apiClient } from "./client";

export function getAnalysis() {
  return apiClient("/benford");
}