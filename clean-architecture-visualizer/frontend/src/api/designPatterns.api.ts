import apiClient from "./apiClient";

export const getCodebaseASG = async () => {
  const { data } = await apiClient.get("/design-patterns/asg");
  return data;
};
