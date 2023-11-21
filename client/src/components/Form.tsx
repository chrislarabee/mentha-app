import { Labels, PropsOfType } from "@/schemas/shared";
import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Button, Stack, TextField } from "@mui/material";
import { UseMutationResult } from "@tanstack/react-query";
import {
  Controller,
  FieldErrors,
  FieldValues,
  SubmitHandler,
  UseControllerProps,
  UseFormReturn,
  useForm,
} from "react-hook-form";
import * as yup from "yup";

interface FormTextFieldProps<T extends FieldValues>
  extends UseControllerProps<T> {
  label: string;
  required?: boolean;
  errors?: FieldErrors<T>;
}

function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
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
  stringFields?: PropsOfType<T, string>[];
  defaultValues?: T;
  onSubmit?: (data: T) => void;
  onSubmitSuccess?: () => void;
}

export default function Form<T extends FieldValues>({
  mutation,
  formConfig,
  labels,
  stringFields = [],
  defaultValues,
  onSubmit,
  onSubmitSuccess,
}: FormProps<T>) {
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
        {stringFields.map((textF) => (
          <FormTextField
            control={control}
            name={textF.toString()}
            label={labels[textF]}
            errors={errors}
          />
        ))}
        {/* TODO: Add date and other field types here as needed. */}
        <Button variant="contained" onClick={handleSubmit(submit)}>
          Submit
        </Button>
      </Stack>
    </Box>
  );
}
