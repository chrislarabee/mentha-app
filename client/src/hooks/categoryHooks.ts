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
} from "@/schemas/category";

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
        pagedCategoriesSchema
      ),
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
