import * as yup from "yup";

export const categorySchema = yup.object({
  id: yup.string().required(),
  name: yup.string().required(),
  parentCategory: yup.string().nullable(),
  owner: yup.string().required(),
});

export type Category = yup.InferType<typeof categorySchema>;
