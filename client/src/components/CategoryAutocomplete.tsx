import { Category, sortCategories } from "@/schemas/category";
import MenthaAutocomplete, { AutocompleteOption } from "./MenthaAutocomplete";
import {
  Controller,
  FieldErrors,
  FieldValues,
  UseControllerProps,
} from "react-hook-form";

interface CategoryAutocompleteProps {
  categories: Category[];
  required?: boolean;
  value?: Category | string;
  onChange?: (id: string | null | undefined) => void;
  error?: boolean;
  errorText?: string;
  size?: "small" | "medium";
}

export default function CategoryAutocomplete({
  categories,
  required,
  value,
  onChange,
  error,
  errorText,
  size,
}: CategoryAutocompleteProps) {
  const tfCatToOpt = (cat: Category) => ({
    id: cat.id,
    label: cat.name,
  });

  const getValue = (v?: Category | string) => {
    if (v instanceof Object || v === undefined) {
      return v;
    } else if (v === "") {
      return undefined;
    } else {
      return categories.find((cat) => cat.id === v);
    }
  };

  // TODO: Somewhere in here there's still an annoying warning thrown by MUI
  // re: the controlled/uncontrolled switching. Find a way to resolve that
  // permanently.
  return (
    <MenthaAutocomplete
      options={sortCategories(categories, "first")}
      optConverter={tfCatToOpt}
      label="Category"
      required={required}
      value={getValue(value)}
      onChange={(value: AutocompleteOption | null) =>
        onChange && value ? onChange(value.id) : null
      }
      error={error}
      errorText={errorText}
      minWidth={200}
      size={size}
    />
  );
}

interface CategoryAutocompleteControlledProps<T extends FieldValues>
  extends UseControllerProps<T>,
    CategoryAutocompleteProps {
  errors: FieldErrors<T>;
}

// This does not work currently
export function CategoryAutocompleteControlled<T extends FieldValues>({
  control,
  name,
  required,
  value,
  onChange,
  categories,
  errors,
}: CategoryAutocompleteControlledProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required }}
      render={({ field }) => (
        <CategoryAutocomplete
          {...field}
          value={value}
          categories={categories}
          onChange={onChange}
          error={errors && errors[name] !== undefined}
          errorText={errors && errors[name]?.message?.toString()}
        />
      )}
    />
  );
}
