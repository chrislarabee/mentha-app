import { dateToTimelessISOString } from "@/schemas/shared";
import {
  categorySpendingByMonthSchemaList,
  netIncomeByMonthSchemaList,
} from "@/schemas/trend";
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
    queryKey: [queryKey, "by-owner", "net-income", startDt, endDt],
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
      const results = await netIncomeByMonthSchemaList.validate(resp.data);
      return results;
    },
  });
}

export function useCategorySpendingByOwner(
  ownerId: string,
  categoryId: string,
  startDt?: Date,
  endDt?: Date
) {
  return useQuery({
    queryKey: [
      queryKey,
      "by-owner",
      "category-spending",
      categoryId,
      startDt,
      endDt,
    ],
    queryFn: async () => {
      const resp = await axiosInstance.get(
        `/${baseEndpoint}/category-spend/${ownerId}`,
        {
          params: {
            category: categoryId,
            startDt: dateToTimelessISOString(startDt),
            endDt: dateToTimelessISOString(endDt),
          },
        }
      );
      const results = await categorySpendingByMonthSchemaList.validate(
        resp.data
      );
      return results;
    },
  });
}
