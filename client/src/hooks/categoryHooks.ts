import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BaseEndpoint,
  deleteRecord,
  getRecord,
  getRecordsByOwner,
  updateRecord,
} from "./genericEndpoints";
import {
  Category,
  CategoryInput,
  PrimaryCategory,
  categorySchema,
  categorySchemaList,
  pagedCategoriesSchema,
  pagedPrimaryCategoriesSchema,
} from "@/schemas/category";
import { axiosInstance } from "./endpoints";
import { MenthaQuery } from "@/schemas/shared";

const baseEndpoint: BaseEndpoint = "categories";
const queryKey = "category";

export function useCategory(id: string) {
  return useQuery({
    queryKey: [queryKey, id],
    queryFn: async () =>
      await getRecord<Category>(id, baseEndpoint, categorySchema),
  });
}

export function useCategoriesByOwner(ownerId: string, query: MenthaQuery) {
  return useQuery({
    queryKey: [queryKey, "by-owner", query],
    queryFn: async () =>
      await getRecordsByOwner<PrimaryCategory>(
        ownerId,
        baseEndpoint,
        pagedPrimaryCategoriesSchema,
        query
      ),
  });
}

export function useCategoriesByOwnerFlat(ownerId: string) {
  const getCategoriesByOwnerFlat = async (ownerId: string) => {
    const resp = await axiosInstance.get(
      `/categories/by-owner/${ownerId}/flat`,
      {}
    );
    const results = await categorySchemaList.validate(resp.data);
    return results;
  };
  return useQuery({
    queryKey: [queryKey, "by-owner", "flat"],
    queryFn: async () => await getCategoriesByOwnerFlat(ownerId),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CategoryInput) => {
      return updateRecord(data, baseEndpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
}

export function useDeleteCategory() {
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
