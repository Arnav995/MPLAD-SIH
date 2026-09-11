import { getProjects } from "./district";
import { request, queryString } from "./client";

export const getMPOverview = async (params = {}) => {
  const response = await request(`/summary${queryString(params)}`);
  return response.data;
};

export const getMyProjects = (params = {}) =>
  getProjects({
    page: 1,
    page_size: 10,
    sort: "risk_desc",
    ...params,
  });