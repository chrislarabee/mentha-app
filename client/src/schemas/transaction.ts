import * as yup from "yup";
import { Labels, pagedResultsSchema } from "./shared";
import { categorySchema } from "./category";

export const TransactionTypes = ["credit", "debit"] as const;
export type TransactionType = (typeof TransactionTypes)[number];

export const basicTransactionSchema = yup.object({
  id: yup.string().required(),
  fitId: yup.string().required(),
  amt: yup.number().required(),
  type: yup.string().oneOf(TransactionTypes).required(),
  date: yup.date().required(),
  name: yup.string().required(),
  category: yup.string().required(),
  account: yup.string().required(),
  owner: yup.string().required(),
});

// TODO: Add .omit(["owner"]) once user login is set up.
export const transactionInputSchema = basicTransactionSchema.shape({
  id: yup.string().nullable(),
});

export const transactionSchema = basicTransactionSchema.shape({
  category: categorySchema,
});

export const transactionSchemaList = yup
  .array()
  .of(transactionSchema)
  .required();

export const pagedTransactionsSchema = pagedResultsSchema.shape({
  results: transactionSchemaList,
});

export const transactionInputSchemas = yup.object({
  inputs: yup.array().of(transactionInputSchema).required(),
});

export type BasicTransaction = yup.InferType<typeof basicTransactionSchema>;

export type Transaction = yup.InferType<typeof transactionSchema>;

export type TransactionInput = yup.InferType<typeof transactionInputSchema>;

export type TransactionInputs = yup.InferType<typeof transactionInputSchema>;

export const TransactionLabels: Labels<Transaction> = {
  id: "ID",
  fitId: "FIT ID",
  amt: "Amt",
  type: "Type",
  date: "Date",
  name: "Name",
  category: "Category",
  account: "Account",
  owner: "Owner",
};
