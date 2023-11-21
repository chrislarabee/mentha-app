import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
  primaryCategorySchemaList,
} from "@/schemas/category";

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: async () =>
      await getRecord<Category>(id, "categories", categorySchema),
  });
}

export function useCategoriesByOwner(ownerId: string) {
  return useQuery({
    queryKey: ["category", "by-owner"],
    queryFn: async () =>
      await getRecordsByOwner<PrimaryCategory>(
        ownerId,
        "categories",
        primaryCategorySchemaList
      ),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CategoryInput) => {
      return updateRecord(data, "categories");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return deleteRecord(id, "categories");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category"] });
    },
  });
}
