import * as yup from "yup";
import { Labels, pagedResultsSchema } from "./shared";

export const UNCATEGORIZED = "6c47e0cc-b47c-4661-bda3-8e8077fed6c7";

export const categorySchema = yup.object({
  id: yup.string().required(),
  name: yup.string().required(),
  parentCategory: yup.string().nullable(),
  owner: yup.string().required(),
});

export const categorySchemaList = yup.array().of(categorySchema).required();

export const pagedCategoriesSchema = pagedResultsSchema.shape({
  results: categorySchemaList,
});

// TODO: Add .omit(["owner"]) once user login is set up.
export const categoryInputSchema = categorySchema.shape({
  id: yup.string().nullable(),
});

export const subcategorySchema = categorySchema.shape({
  parentCategory: yup.string().required(),
});

export const primaryCategorySchema = categorySchema
  .shape({
    subcategories: yup.array().of(categorySchema).required(),
  })
  .omit(["parentCategory"]);

export const primaryCategorySchemaList = yup
  .array()
  .of(primaryCategorySchema)
  .required();

export const pagedPrimaryCategoriesSchema = pagedResultsSchema.shape({
  results: primaryCategorySchemaList,
});

export type Category = yup.InferType<typeof categorySchema>;

export type CategoryInput = yup.InferType<typeof categoryInputSchema>;

export type Subcategory = yup.InferType<typeof subcategorySchema>;

export type PrimaryCategory = yup.InferType<typeof primaryCategorySchema>;

export const CategoryInputLabels: Labels<CategoryInput> = {
  id: "ID",
  name: "Name",
  parentCategory: "Parent Category",
  owner: "Owner",
};
