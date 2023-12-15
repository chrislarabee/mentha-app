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
}: MenthaAutocompleteProps<T>) {
  return (
    <Autocomplete
      aria-required={required}
      options={options.map((opt) => optConverter(opt))}
      value={value && optConverter(value)}
      onChange={(event, value) => (onChange ? onChange(value) : null)}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={errorText}
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
