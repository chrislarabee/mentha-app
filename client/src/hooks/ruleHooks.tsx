import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BaseEndpoint,
  deleteRecord,
  getRecordsByOwner,
  updateRecord,
} from "./genericEndpoints";
import { MenthaQuery } from "@/schemas/shared";
import { Rule, RuleInput, pagedRulesSchema } from "@/schemas/rule";

const baseEndpoint: BaseEndpoint = "rules";
const queryKey = "rules";

export function useRulesByOwner(
  ownerId: string,
  query: MenthaQuery,
  page: number = 1,
  pageSize: number = 50
) {
  return useQuery({
    queryKey: [queryKey, "by-owner", query, page],
    queryFn: async () =>
      await getRecordsByOwner<Rule>(
        ownerId,
        baseEndpoint,
        pagedRulesSchema,
        query,
        page,
        pageSize
      ),
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RuleInput) => {
      return updateRecord(data, baseEndpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return deleteRecord(id, baseEndpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
}
