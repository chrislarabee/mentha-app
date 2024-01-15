import { v4 as uuid4 } from "uuid";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
} from "@mui/material";

interface MenthaSelectProps<T> {
  options: T[];
  optConverter: (opt: T) => string;
  label: string;
  value?: T;
  onChange?: (value: T) => void;
  comparator?: (a: T, b?: T) => boolean;
  error?: boolean;
  errorText?: string;
}

/**
 * Wrapper component for Material UI's Select component, which has some annoying
 * inflexibility in what options it will accept and how it then handles those
 * options.
 * @param options An array of any objects.
 * @param optConverter Rendering function to apply to each option.
 * @param label Label for the Select field.
 * @param value Optional currently selected value.
 * @param onChange Function to call when the user changes the value.
 * @param comparator Optional function to use to compare options and test equality,
 * which is used for proper functioning of the MenthaSelect component. You should
 * set this param for any object types that cannot be directly compared with ===.
 * @returns
 */
export default function MenthaSelect<T>({
  options,
  optConverter,
  label,
  value,
  onChange,
  comparator,
  error,
  errorText,
}: MenthaSelectProps<T>) {
  const compare = comparator ? comparator : (a: T, b?: T) => a === b;
  const selectId = uuid4();
  const labelId = `${selectId}-label`;
  return (
    <Stack sx={{ minWidth: 150 }}>
      <FormControl>
        <InputLabel id={labelId}>{label}</InputLabel>
        <Select
          id={selectId}
          labelId={labelId}
          label={label}
          size="small"
          onChange={(event) =>
            // MaterialUI's typing is not our friend here; they type
            // event.target.value as string | undefined | T, because they allow ""
            // as "no value" for Select. MenthaSelect uses indices as values, so
            // the only case where event.target.value will be a string is if it's
            // "", which is eliminated by the assertion, but not detectable by
            // the type checker. Thus, event.target.value must be cast...
            onChange && event.target.value !== undefined
              ? onChange(options[event.target.value as number])
              : () => {}
          }
          value={options.findIndex((element) => compare(element, value))}
        >
          {options.map((opt, idx) => (
            <MenuItem key={uuid4()} value={idx}>
              {optConverter(opt)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
