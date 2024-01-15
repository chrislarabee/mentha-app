import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BaseEndpoint, updateRecord } from "./genericEndpoints";
import { axiosInstance } from "./endpoints";
import { BudgetInput, allocatedBudgetSchemaList } from "@/schemas/budget";

const baseEndpoint: BaseEndpoint = "budgets";
const queryKey = "budget";

export function useBudgetsByOwner(
  ownerId: string,
  year: number,
  month: number,
  filterInactive: boolean = true
) {
  return useQuery({
    queryKey: [queryKey, "by-owner", year, month],
    queryFn: async () => {
      const resp = await axiosInstance.get(
        `/${baseEndpoint}/by-owner/${ownerId}/${year}/${month}`
      );
      let results = await allocatedBudgetSchemaList.validate(resp.data);
      const compareDate = new Date(year, month, 1);
      if (filterInactive) {
        results = results.filter(
          (bgt) => !bgt.inactiveDate || bgt.inactiveDate < compareDate
        );
      }
      results = results.filter((bgt) => bgt.createDate <= compareDate);
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
