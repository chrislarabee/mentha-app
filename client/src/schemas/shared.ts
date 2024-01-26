import * as yup from "yup";

export const SYSTEM_USER = "9b4923d8-53aa-4f40-b602-9e4765420c07";

export type Labels<T> = {
  [P in keyof T]-?: string;
};

export type PropsOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: P;
};

export const pagedResultsSchema = yup.object({
  results: yup.array().of(yup.object({})).required(),
  hitCount: yup.number().required(),
  totalHitCount: yup.number().required(),
  page: yup.number().required(),
  pageSize: yup.number().nullable(),
  hasNext: yup.boolean().required(),
  hasPrev: yup.boolean().required(),
});

export type PagedResults<T> = {
  results: T[];
  hitCount: number;
  totalHitCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export const SortDirections = ["asc", "desc"] as const;

export type SortDirection = (typeof SortDirections)[number];

export type QuerySortParam = {
  field: string;
  direction: SortDirection;
};

export const FilterOperators = ["=", ">", ">=", "<", "<=", "like"] as const;

export type FilterOperator = (typeof FilterOperators)[number];

export type QueryFilterParam = {
  field: string;
  op: FilterOperator;
  term: any;
};

export type MenthaQuery = {
  sorts: QuerySortParam[];
  filters: QueryFilterParam[];
};

export function convertArrayToRecordOfArrays<
  T,
  U extends string | number | symbol
>(array: T[], keyExtractor: (obj: T) => U): Record<U, T[]> {
  let results = array.reduce(
    (prev, curr) => ({ ...prev, [keyExtractor(curr)]: [] }),
    {} as Record<U, T[]>
  );
  array.map((obj) => {
    let key = keyExtractor(obj);
    results[key].push(obj);
  });
  return results;
}

export function removeNullsFromArray<T>(array: (T | null | undefined)[]): T[] {
  return array.filter(
    (element) => element !== null && element !== undefined
  ) as T[];
}

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function generateMonthArray(
  baseDate: Date,
  numMonths: number,
  sortDirection: "asc" | "desc" = "asc"
) {
  let startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  let result: Date[] = Array(new Date(startDate));
  if (numMonths < 0) {
    startDate.setMonth(startDate.getMonth() + numMonths);
  }
  for (let i = 1; i < Math.abs(numMonths); i++) {
    result.push(new Date(startDate.setMonth(startDate.getMonth() + 1)));
  }
  if (sortDirection === "asc") {
    result.sort((a, b) => a.getTime() - b.getTime());
  } else {
    result.sort((a, b) => b.getTime() - a.getTime());
  }
  return result;
}
