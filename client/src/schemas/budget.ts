import * as yup from "yup";
import { categorySchema } from "./category";
import { Labels } from "./shared";

export const budgetSchema = yup.object({
  id: yup.string().required(),
  category: yup.string().required(),
  amt: yup.number().required(),
  period: yup.number().min(1).required(),
  createDate: yup.date().required(),
  inactiveDate: yup.date().nullable(),
  owner: yup.string().required(),
});

export const budgetInputSchema = budgetSchema.shape({
  id: yup.string().nullable(),
});

export const allocatedBudgetSchema = budgetSchema.shape({
  category: categorySchema,
  monthAmt: yup.number().required(),
  accumulatedAmt: yup.number().required(),
  allocatedAmt: yup.number().required(),
});

export const allocatedBudgetSchemaList = yup
  .array()
  .of(allocatedBudgetSchema)
  .required();

export const budgetReport = yup.object({
  income: yup.array().of(allocatedBudgetSchema).required(),
  budgets: yup.array().of(allocatedBudgetSchema).required(),
  other: yup.array().of(allocatedBudgetSchema).required(),
  budgetedIncome: yup.number().required(),
  budgetedExpenses: yup.number().required(),
  actualIncome: yup.number().required(),
  actualExpenses: yup.number().required(),
  anticipatedNet: yup.number().required(),
});

export type Budget = yup.InferType<typeof budgetSchema>;

export type AllocatedBudget = yup.InferType<typeof allocatedBudgetSchema>;

export type BudgetInput = yup.InferType<typeof budgetInputSchema>;

export type BudgetReport = yup.InferType<typeof budgetReport>;

export const BudgetInputLabels: Labels<BudgetInput> = {
  id: "ID",
  category: "Category",
  amt: "Amt",
  period: "Frequency",
  createDate: "Creation Date",
  inactiveDate: "Inactivation Date",
  owner: "Owner",
};

export const AllocatedBudgetLabels: Labels<AllocatedBudget> = {
  id: BudgetInputLabels["id"],
  category: BudgetInputLabels["category"],
  amt: BudgetInputLabels["amt"],
  monthAmt: "Monthly Amt",
  allocatedAmt: "Allocated Amt",
  accumulatedAmt: "Accumulated Amt",
  period: BudgetInputLabels["period"],
  createDate: BudgetInputLabels["createDate"],
  inactiveDate: BudgetInputLabels["inactiveDate"],
  owner: BudgetInputLabels["owner"],
};
