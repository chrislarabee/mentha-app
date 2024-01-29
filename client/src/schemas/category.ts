import * as yup from "yup";
import { Labels, SYSTEM_USER, pagedResultsSchema } from "./shared";

export const INCOME = "a3720dcc-0ba4-426d-9c41-620a0fbe0ad6";
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

export const findCatById = (id: string, cats: Category[]) => {
  let result: Category = {
    id: UNCATEGORIZED,
    name: "Uncategorized",
    owner: SYSTEM_USER,
  };
  let findResult = cats.find((cat) => cat.id === id);
  if (findResult) {
    result = findResult;
  }
  return result;
};

export function sortCategories<C extends Category>(
  categories: C[],
  uncategorizedPos: "first" | "last" | "alpha" = "last"
) {
  return categories.sort((catA, catB) => {
    if (catA.id === UNCATEGORIZED && uncategorizedPos !== "alpha") {
      return uncategorizedPos === "last" ? 1 : -1;
    } else if (catB.id === UNCATEGORIZED && uncategorizedPos !== "alpha") {
      return uncategorizedPos === "last" ? -1 : 1;
    }
    return catA.name.localeCompare(catB.name);
  });
}
