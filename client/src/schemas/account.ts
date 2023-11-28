import * as yup from "yup";
import { Labels } from "./shared";
import { institutionSchema } from "./institution";

const accountType = ["Checking", "Savings"] as const;

export const basicAccountSchema = yup.object({
  id: yup.string().required(),
  fitId: yup.string().required(),
  accountType: yup.string().oneOf(accountType).required(),
  name: yup.string().required(),
  institution: yup.string().required(),
  owner: yup.string().required(),
});

// TODO: Add .omit(["owner"]) once user login is set up.
export const accountInputSchema = basicAccountSchema.shape({
  id: yup.string().nullable(),
});

export const accountSchema = basicAccountSchema.shape({
  institution: institutionSchema,
});

export const accountSchemaList = yup.array().of(accountSchema).required();

export type AccountType = (typeof accountType)[number];

export type BasicAccount = yup.InferType<typeof basicAccountSchema>;

export type Account = yup.InferType<typeof accountSchema>;

export type AccountInput = yup.InferType<typeof accountInputSchema>;


export const AccountInputLabels: Labels<AccountInput> = {
  id: "ID",
  fitId: "FIT ID",
  accountType: "Account Type",
  name: "Name",
  institution: "Institution",
  owner: "Owner",
};
