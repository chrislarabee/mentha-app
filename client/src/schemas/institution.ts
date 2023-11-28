import * as yup from "yup";
import { Labels } from "./shared";

export const institutionSchema = yup.object({
  id: yup.string().required(),
  name: yup.string().required(),
  fitId: yup.string().required(),
});

// TODO: Add .omit(["owner"]) once user login is set up.
export const institutionInputSchema = institutionSchema.shape({
  id: yup.string().nullable(),
});

export const institutionSchemaList = yup
  .array()
  .of(institutionSchema)
  .required();

export type BasicInstitution = yup.InferType<typeof institutionSchema>;

export type Institution = yup.InferType<typeof institutionSchema>;

export type InstitutionInput = yup.InferType<typeof institutionInputSchema>;

export const InstitutionInputLabels: Labels<InstitutionInput> = {
  id: "ID",
  name: "Name",
  fitId: "FIT ID",
};
