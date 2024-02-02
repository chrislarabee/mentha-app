import { dateToTimelessISOString } from "@/schemas/shared";
import { netIncomeByDateSchemaList } from "@/schemas/trend";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "./endpoints";

const baseEndpoint = "trends";
const queryKey = "trends";

export function useNetIncomeByOwner(
  ownerId: string,
  startDt?: Date,
  endDt?: Date
) {
  return useQuery({
    queryKey: [queryKey, "by-owner", startDt, endDt],
    queryFn: async () => {
      const resp = await axiosInstance.get(
        `/${baseEndpoint}/net-income/${ownerId}`,
        {
          params: {
            startDt: dateToTimelessISOString(startDt),
            endDt: dateToTimelessISOString(endDt),
          },
        }
      );
      const results = await netIncomeByDateSchemaList.validate(resp.data);
      return results;
    },
  });
}
