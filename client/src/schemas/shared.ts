export const SYSTEM_USER = "9b4923d8-53aa-4f40-b602-9e4765420c07";

export type Labels<T> = {
  [P in keyof T]-?: string;
};

export type PropsOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: P;
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
