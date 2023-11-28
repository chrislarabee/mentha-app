import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BaseEndpoint,
  deleteRecord,
  getRecord,
  updateRecord,
} from "./genericEndpoints";
import {
  BasicInstitution,
  InstitutionInput,
  institutionSchema,
} from "@/schemas/institution";

const baseEndpoint: BaseEndpoint = "institutions";
const queryKey = "institution";

export function useInstitution(id: string) {
  return useQuery({
    queryKey: [queryKey, id],
    queryFn: async () =>
      await getRecord<BasicInstitution>(id, baseEndpoint, institutionSchema),
  });
}

export function useUpdateInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InstitutionInput) => {
      return updateRecord(data, baseEndpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
}

export function useDeleteInstitution() {
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
