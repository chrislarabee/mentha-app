import { Autocomplete, TextField } from "@mui/material";
import {
  Controller,
  FieldErrors,
  FieldValues,
  UseControllerProps,
} from "react-hook-form";

export type AutocompleteOption = {
  id: string;
  label: string;
};

interface MenthaAutocompleteProps<T> {
  options: T[];
  optConverter: (opt: T) => AutocompleteOption;
  label: string;
  required?: boolean;
  value?: T;
  onChange?: (value: AutocompleteOption | null) => void;
  error?: boolean;
  errorText?: string;
  minWidth?: number;
  size?: "small" | "medium";
}

export default function MenthaAutocomplete<T>({
  options,
  optConverter,
  label,
  required,
  value,
  onChange,
  error,
  errorText,
  minWidth,
  size,
}: MenthaAutocompleteProps<T>) {
  // TODO: Somewhere in here there's still an annoying warning thrown by MUI
  // re: the controlled/uncontrolled switching. Find a way to resolve that
  // permanently.
  return (
    <Autocomplete
      aria-required={required}
      options={options.map((opt) => optConverter(opt))}
      fullWidth
      value={value && optConverter(value)}
      onChange={(event, value) => (onChange ? onChange(value) : null)}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      sx={{ minWidth: minWidth }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={errorText}
          size={size}
        />
      )}
    />
  );
}

interface MenthaAutocompleteControlledProps<T extends FieldValues>
  extends UseControllerProps<T>,
    MenthaAutocompleteProps<T> {
  errors: FieldErrors<T>;
}

export function MenthaAutocompleteControlled<T extends FieldValues>({
  control,
  name,
  label,
  required,
  value,
  onChange,
  options,
  optConverter,
  errors,
}: MenthaAutocompleteControlledProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required }}
      render={({ field }) => (
        <MenthaAutocomplete
          {...field}
          label={label}
          value={value}
          options={options}
          optConverter={optConverter}
          onChange={onChange}
          required={required}
          error={errors && errors[name] !== undefined}
          errorText={errors && errors[name]?.message?.toString()}
        />
      )}
    />
  );
}
