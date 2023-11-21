export type Labels<T> = {
  [P in keyof T]-?: string;
};

export type PropsOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: P;
};
