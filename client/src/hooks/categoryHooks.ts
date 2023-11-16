import { useQuery } from "@tanstack/react-query";
import { getRecord } from "./genericEndpoints";
import { Category, categorySchema } from "@/schemas/category";

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: async () =>
      await getRecord<Category>(id, "categories", categorySchema),
  });
}
