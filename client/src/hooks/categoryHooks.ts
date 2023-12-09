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
  pagedCategoriesSchema,
  pagedPrimaryCategoriesSchema,
} from "@/schemas/category";
import { axiosInstance } from "./endpoints";

const baseEndpoint: BaseEndpoint = "categories";
const queryKey = "category";

export function useCategory(id: string) {
  return useQuery({
    queryKey: [queryKey, id],
    queryFn: async () =>
      await getRecord<Category>(id, baseEndpoint, categorySchema),
  });
}

export function useCategoriesByOwner(ownerId: string) {
  return useQuery({
    queryKey: [queryKey, "by-owner"],
    queryFn: async () =>
      await getRecordsByOwner<PrimaryCategory>(
        ownerId,
        baseEndpoint,
        pagedPrimaryCategoriesSchema
      ),
  });
}

async function getCategoriesByOwnerFlat(ownerId: string) {
  const resp = await axiosInstance.get(
    `/categories/by-owner/${ownerId}/flat`,
    {}
  );
  const results = await pagedCategoriesSchema.validate(resp.data);
  return results;
}

export function useCategoriesByOwnerFlat(ownerId: string) {
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
