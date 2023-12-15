import * as yup from "yup";
import { Labels, pagedResultsSchema } from "./shared";
import { categorySchema } from "./category";

export const basicRuleSchema = yup.object({
  id: yup.string().required(),
  priority: yup.number().required(),
  resultCategory: yup.string().required(),
  owner: yup.string().required(),
  matchName: yup.string().nullable(),
  matchAmt: yup.string().nullable(),
});

// TODO: Add .omit(["owner"]) once user login is set up.
export const ruleInputSchema = basicRuleSchema.shape({
  id: yup.string().nullable(),
});

export const ruleSchema = basicRuleSchema.shape({
  resultCategory: categorySchema,
});

export const ruleSchemaList = yup.array().of(ruleSchema).required();

export const pagedRulesSchema = pagedResultsSchema.shape({
  results: ruleSchemaList,
});

export type BasicRule = yup.InferType<typeof basicRuleSchema>;

export type Rule = yup.InferType<typeof ruleSchema>;

export type RuleInput = yup.InferType<typeof ruleInputSchema>;

export const RuleLabels: Labels<Rule> = {
  id: "ID",
  priority: "Priority",
  resultCategory: "Result Category",
  owner: "Owner",
  matchName: "Match Name",
  matchAmt: "Match Amt",
};

export const RuleInputLabels: Labels<RuleInput> = {
  id: RuleLabels["id"],
  priority: RuleLabels["priority"],
  resultCategory: RuleLabels["resultCategory"],
  owner: RuleLabels["owner"],
  matchName: RuleLabels["matchName"],
  matchAmt: RuleLabels["matchAmt"],
};
