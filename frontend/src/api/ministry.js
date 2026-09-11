import { request, queryString } from "./client";

export const getNationalOverview = async (params = {}) => {
  const response = await request(`/summary${queryString(params)}`);
  return response.data;
};

export const getTier2Digest = (params = {}) =>
  request(`/alerts/tier2-digest${queryString(params)}`);

export const getBenfordAnalysis = async () => ({
  unavailable: true,
  message: "Benford analysis is not available in the current MVP.",
});
export const getMinistrySummary = () =>
  request("/summary");

export const getMinistryProjects = (params = {}) =>
  request(`/projects${queryString(params)}`);