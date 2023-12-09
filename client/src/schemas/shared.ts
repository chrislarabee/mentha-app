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
