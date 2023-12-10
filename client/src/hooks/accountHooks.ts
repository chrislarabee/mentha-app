import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BaseEndpoint,
  deleteRecord,
  getRecord,
  getRecordsByOwner,
  updateRecord,
} from "./genericEndpoints";
import {
  Account,
  AccountInput,
  BasicAccount,
  basicAccountSchema,
  pagedAccountsSchema,
} from "@/schemas/account";
import { MenthaQuery } from "@/schemas/shared";

const baseEndpoint: BaseEndpoint = "accounts";
const queryKey = "account";

export function useAccount(id: string) {
  return useQuery({
    queryKey: [queryKey, id],
    queryFn: async () =>
      await getRecord<BasicAccount>(id, baseEndpoint, basicAccountSchema),
  });
}

export function useAccountsByOwner(ownerId: string, query: MenthaQuery) {
  return useQuery({
    queryKey: [queryKey, "by-owner"],
    queryFn: async () =>
      await getRecordsByOwner<Account>(
        ownerId,
        baseEndpoint,
        pagedAccountsSchema,
        query
      ),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AccountInput) => {
      return updateRecord(data, baseEndpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
}

export function useDeleteAccount() {
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
