import * as yup from "yup";
import { categorySchema } from "./category";

export const netIncomeByMonthSchema = yup.object({
  date: yup.date().required(),
  income: yup.number().required(),
  expense: yup.number().required(),
  net: yup.number().required(),
});

export const netIncomeByMonthSchemaList = yup
  .array()
  .of(netIncomeByMonthSchema)
  .required();

export type NetIncomeByMonth = yup.InferType<typeof netIncomeByMonthSchema>;

export type NetIncomeByMonthList = yup.InferType<
  typeof netIncomeByMonthSchemaList
>;

export const categorySpendingByMonthSchema = yup.object({
  date: yup.date().required(),
  category: categorySchema,
  amt: yup.number().required(),
});

export const categorySpendingByMonthSchemaList = yup
  .array()
  .of(categorySpendingByMonthSchema)
  .required();

export type CategorySpendingByMonth = yup.InferType<
  typeof categorySpendingByMonthSchema
>;

export type CategorySpendingByMonthList = yup.InferType<
  typeof categorySpendingByMonthSchemaList
>;
