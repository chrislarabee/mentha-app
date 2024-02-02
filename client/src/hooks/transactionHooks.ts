import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BaseEndpoint,
  getRecordsByOwner,
  updateRecord,
} from "./genericEndpoints";
import {
  Transaction,
  TransactionInput,
  pagedTransactionsSchema,
} from "@/schemas/transaction";
import { MenthaQuery } from "@/schemas/shared";
import { axiosInstance } from "./endpoints";

const baseEndpoint: BaseEndpoint = "transactions";
const queryKey = "transaction";

export function useTransactionsByOwner(
  ownerId: string,
  query: MenthaQuery,
  page: number = 1,
  pageSize: number = 50
) {
  return useQuery({
    queryKey: [queryKey, "by-owner", query, page],
    queryFn: async () =>
      await getRecordsByOwner<Transaction>(
        ownerId,
        baseEndpoint,
        pagedTransactionsSchema,
        query,
        page,
        pageSize
      ),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TransactionInput) => {
      return updateRecord(data, baseEndpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
}

export function useOldestTransaction(ownerId: string) {
  return useQuery({
    queryKey: [queryKey, "by-owner", ownerId],
    queryFn: async () => {
      const results = await getRecordsByOwner<Transaction>(
        ownerId,
        baseEndpoint,
        pagedTransactionsSchema,
        { sorts: [{ field: "date", direction: "asc" }], filters: [] },
        1,
        1
      );
      return results.results[0];
    },
  });
}

export function useApplyRules(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ownerId: string, uncategorizedOnly: boolean = true) => {
      await axiosInstance.put(
        `${baseEndpoint}/apply-rules/${ownerId}`,
        {},
        { params: { uncategorizedOnly } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      if (onSuccess) {
        onSuccess();
      }
    },
  });
}

export function useImportTransactions(onSuccess?: (result: string) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ownerId: string) => {
      const resp = await axiosInstance.post(
        `${baseEndpoint}/import/${ownerId}`
      );
      return resp.data as string;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      if (onSuccess) {
        onSuccess(result);
      }
    },
  });
}
