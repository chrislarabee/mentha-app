import { Labels } from "@/schemas/shared";
import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Button, Stack, TextField } from "@mui/material";
import { UseMutationResult } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  Controller,
  FieldErrors,
  FieldValues,
  SubmitHandler,
  UseControllerProps,
  UseFormReturn,
  useForm,
} from "react-hook-form";
import { v4 as uuid4 } from "uuid";
import * as yup from "yup";

export interface TextFieldDefinition<T> {
  field: keyof T;
  type?: "text" | "number" | "date";
  required?: boolean;
}

interface FormTextFieldProps<T extends FieldValues>
  extends UseControllerProps<T> {
  label: string;
  type?: "text" | "number" | "date";
  required?: boolean;
  errors?: FieldErrors<T>;
}

function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  type,
  errors,
  required,
}: FormTextFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required }}
      render={({ field }) => (
        <TextField
          {...field}
          size="small"
          label={label}
          type={type}
          value={field.value || ""}
          required={required}
          error={errors && errors[name] !== undefined}
          helperText={errors ? errors[name]?.message?.toString() : null}
        />
      )}
    />
  );
}

interface FormProps<T extends FieldValues> {
  mutation: UseMutationResult<void, Error, T, any>;
  formConfig:
    | UseFormReturn<any, any, undefined>
    | { schema: yup.ObjectSchema<any, any, any, any> };
  labels: Labels<T>;
  textFields?: (keyof T | TextFieldDefinition<T>)[];
  defaultValues?: T;
  onSubmit?: (data: T) => void;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

export default function Form<T extends FieldValues>({
  mutation,
  formConfig,
  labels,
  textFields = [],
  defaultValues,
  onSubmit,
  onSubmitSuccess,
  onCancel,
  children,
}: FormProps<T>) {
  const textFieldDef: TextFieldDefinition<T>[] = textFields.map((value) => {
    if (value instanceof Object) {
      return value;
    } else {
      return { field: value, type: "text" } as TextFieldDefinition<T>;
    }
  });

  const config =
    "schema" in formConfig
      ? useForm({
          resolver: yupResolver(formConfig.schema),
          defaultValues: formConfig.schema.cast(defaultValues),
        })
      : formConfig;

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = config;

  const submit: SubmitHandler<T> = (data) => {
    if (onSubmit) {
      onSubmit(data);
    }
    mutation.mutate(data);
    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
  };

  return (
    <Box component="form">
      <Stack spacing={1}>
        {textFieldDef.map((textF) => (
          <FormTextField
            key={uuid4()}
            control={control}
            name={textF.field.toString()}
            label={labels[textF.field]}
            type={textF.type}
            errors={errors}
            required={textF.required}
          />
        ))}
        {children}
        <Stack direction="row" justifyContent="space-evenly">
          {onCancel && (
            <Button fullWidth onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button fullWidth variant="contained" onClick={handleSubmit(submit)}>
            Submit
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
