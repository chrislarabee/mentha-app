import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BaseEndpoint, updateRecord } from "./genericEndpoints";
import { axiosInstance } from "./endpoints";
import { BudgetInput, budgetReport } from "@/schemas/budget";

const baseEndpoint: BaseEndpoint = "budgets";
const queryKey = "budget";

export function useBudgetsByOwner(
  ownerId: string,
  year: number,
  month: number
) {
  return useQuery({
    queryKey: [queryKey, "by-owner", year, month],
    queryFn: async () => {
      const resp = await axiosInstance.get(
        `/${baseEndpoint}/by-owner/${ownerId}/${year}/${month}`
      );
      const results = await budgetReport.validate(resp.data);
      return results;
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BudgetInput) => {
      return updateRecord(data, baseEndpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
}
