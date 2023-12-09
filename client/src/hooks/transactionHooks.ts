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

const baseEndpoint: BaseEndpoint = "transactions";
const queryKey = "transaction";

export function useTransactionsByOwner(
  ownerId: string,
  page: number = 1,
  pageSize: number = 50
) {
  return useQuery({
    queryKey: [queryKey, "by-owner", page],
    queryFn: async () =>
      await getRecordsByOwner<Transaction>(
        ownerId,
        baseEndpoint,
        pagedTransactionsSchema,
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
