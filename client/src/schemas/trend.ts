import * as yup from "yup";

export const netIncomeByDateSchema = yup.object({
  date: yup.date().required(),
  income: yup.number().required(),
  expense: yup.number().required(),
  net: yup.number().required(),
});

export const netIncomeByDateSchemaList = yup
  .array()
  .of(netIncomeByDateSchema)
  .required();

export type NetIncomeByDate = yup.InferType<typeof netIncomeByDateSchema>;

export type NetIncomeByDateList = yup.InferType<
  typeof netIncomeByDateSchemaList
>;
