import { Category } from "@/schemas/category";
import { FilterOperator, Labels, QueryFilterParam } from "@/schemas/shared";
import { Add, Close, FilterList } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { v4 as uuid4 } from "uuid";
import CategoryAutocomplete from "./CategoryAutocomplete";
import MenthaPopover, { useMenthaPopoverAnchor } from "./MenthaPopover";
import MenthaSelect from "./MenthaSelect";

interface FilterInputProps {
  heading: string;
  onApply?: (op: FilterOperator, term: string) => void;
}

function TextFilterInputs({ heading, onApply }: FilterInputProps) {
  const [term, setTerm] = useState<string>("");
  const [op, setOp] = useState<"=" | "like">("like");
  const apply = () => {
    if (onApply && term && op) {
      onApply(op, term);
    }
  };
  return (
    <>
      <Typography>{heading}</Typography>
      <MenthaSelect
        options={["equals", "contains"]}
        optConverter={(opt) => opt}
        label="Operator"
        value={op === "=" ? "equals" : "contains"}
        onChange={(value) => setOp(value === "equals" ? "=" : "like")}
      />
      <TextField
        label="Term"
        size="small"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        required={true}
      />
      <Button variant="contained" onClick={apply}>
        Apply
      </Button>
    </>
  );
}

const NumberlikeOps = ["=", ">", ">=", "<", "<="] as const;

type NumberlicOp = (typeof NumberlikeOps)[number];

interface NumberlikeFilterInputsProps extends FilterInputProps {
  type: "number" | "date";
}

function NumberlikeFilterInputs({
  heading,
  onApply,
  type,
}: NumberlikeFilterInputsProps) {
  const [term, setTerm] = useState<string>("");
  const [op, setOp] = useState<NumberlicOp>("=");
  const apply = () => {
    if (onApply && term && op) {
      onApply(op, term);
    }
  };
  return (
    <>
      <Typography>{heading}</Typography>
      <MenthaSelect
        options={NumberlikeOps}
        optConverter={(opt) => opt}
        label="Operator"
        value={op}
        onChange={setOp}
      />
      <TextField
        size="small"
        label={type === "number" ? "Term" : undefined}
        type={type}
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        required={true}
      />
      <Button variant="contained" onClick={apply}>
        Apply
      </Button>
    </>
  );
}

interface CategoryFilterInputsProps extends FilterInputProps {
  categories: Category[];
}

function CategoryFilterInputs({
  heading,
  onApply,
  categories,
}: CategoryFilterInputsProps) {
  const [term, setTerm] = useState<string>("");
  const apply = () => {
    if (onApply && term) {
      onApply("=", term);
    }
  };
  return (
    <>
      <Typography>{heading}</Typography>
      <CategoryAutocomplete
        required
        categories={categories}
        onChange={(id) => setTerm(id || "")}
      />
      <Button variant="contained" onClick={apply}>
        Apply
      </Button>
    </>
  );
}

type Selector<T = any> = ({
  value,
  onChange,
}: {
  value?: T;
  onChange: (value: T) => void;
}) => JSX.Element;

interface SelectDef<T = any> {
  Selector: Selector<T>;
  valueConverter: (opt: T) => string;
}

interface SelectFilterInputsProps<T> extends FilterInputProps {
  selectDef: SelectDef;
}

function SelectFilterInputs<T>({
  heading,
  onApply,
  selectDef: { Selector, valueConverter },
}: SelectFilterInputsProps<T>) {
  const [term, setTerm] = useState<T>();
  const apply = () => {
    if (onApply && term) {
      onApply("=", valueConverter(term));
    }
  };
  return (
    <>
      <Typography>{heading}</Typography>
      <Selector value={term} onChange={setTerm} />
      <Button variant="contained" onClick={apply}>
        Apply
      </Button>
    </>
  );
}

type FilterConfigType = "string" | "date" | "number" | "select" | "category";

interface FilterConfiguration<T> {
  field: keyof T;
  type: FilterConfigType;
  selectDef?: SelectDef;
  renderOp?: (op: FilterOperator) => string;
  renderFilterTerm?: (term: string) => string;
}

interface AddFilterBtnProps<T> {
  columnOptions: (keyof T | FilterConfiguration<T>)[];
  optionLabels: Labels<T>;
  filters: Record<string, QueryFilterParam>;
  setFilters: (filters: Record<string, QueryFilterParam>) => void;
  categories?: Category[];
}

export default function FilterManager<T>({
  columnOptions,
  optionLabels,
  filters,
  setFilters,
  categories,
}: AddFilterBtnProps<T>) {
  const [newFilterCol, setNewFilterCol] = useState<FilterConfiguration<T>>();
  const [filterPopoverAnchor, setFilterPopoverAnchor] =
    useMenthaPopoverAnchor();

  const filterPopoverId = "filter-popover";

  const handleClose = () => {
    setNewFilterCol(undefined);
    setFilterPopoverAnchor(null);
  };

  const filterColOptDef: FilterConfiguration<T>[] = columnOptions.map(
    (value) => {
      if (value instanceof Object) {
        return value;
      } else {
        return { field: value, type: "string" } as FilterConfiguration<T>;
      }
    }
  );

  const filterColumnOptions = (
    <List dense>
      {filterColOptDef.map((colOpt) => (
        <ListItem key={colOpt.field.toString()}>
          <Button
            size="small"
            onClick={() => setNewFilterCol(colOpt)}
            variant="outlined"
            startIcon={<Add />}
          >
            {optionLabels[colOpt.field]}
          </Button>
        </ListItem>
      ))}
    </List>
  );

  const defaultRenderOp = (op: FilterOperator, type: FilterConfigType) => {
    if (type === "string") {
      return op === "=" ? "equals" : "contains";
    } else {
      return op;
    }
  };

  const filterDisplay = Object.entries(filters).map(([uuid, f]) => {
    const filterDef = filterColOptDef.find(
      (def) => def.field.toString() === f.field
    );
    let renderOp = (op: FilterOperator) => op.toString();
    let term = f.term;
    if (filterDef) {
      renderOp = filterDef.renderOp
        ? filterDef.renderOp
        : (op: FilterOperator) => defaultRenderOp(op, filterDef.type);
      if (filterDef.renderFilterTerm) {
        term = filterDef.renderFilterTerm(term);
      }
    }
    const label = optionLabels[f.field as keyof T];
    let chipLabel = `${label} ${renderOp(f.op)} ${term}`;
    return (
      <Chip
        key={uuid}
        variant="outlined"
        label={chipLabel}
        deleteIcon={<Close />}
        onDelete={() => {
          const clone = { ...filters };
          delete clone[uuid];
          setFilters(clone);
        }}
      />
    );
  });

  const apply = (op: FilterOperator, term: string) => {
    if (newFilterCol) {
      const uuid = uuid4();
      const filter: QueryFilterParam = {
        field: newFilterCol.field.toString(),
        op: op,
        term: term,
      };
      setFilters({ ...filters, [uuid]: filter });
    }
    handleClose();
  };

  const FilterInput = ({ config }: { config: FilterConfiguration<T> }) => {
    const heading = `Add ${optionLabels[config.field]} Filter`;
    if (["number", "date"].includes(config.type)) {
      return (
        <NumberlikeFilterInputs
          heading={heading}
          onApply={apply}
          type={config.type === "date" ? "date" : "number"}
        />
      );
    } else if (config.type === "category" && categories) {
      return (
        <CategoryFilterInputs
          heading={heading}
          onApply={apply}
          categories={categories}
        />
      );
    } else if (config.type === "select" && config.selectDef) {
      return (
        <SelectFilterInputs
          heading={heading}
          onApply={apply}
          selectDef={config.selectDef}
        />
      );
    } else {
      return <TextFilterInputs heading={heading} onApply={apply} />;
    }
  };

  const filterInputs = (
    <Box sx={{ padding: 2 }}>
      <Stack spacing={1}>
        {newFilterCol && <FilterInput config={newFilterCol} />}
      </Stack>
    </Box>
  );

  return (
    <Stack direction="row" alignItems="center">
      <MenthaPopover
        id={filterPopoverId}
        anchor={filterPopoverAnchor}
        onClose={handleClose}
      >
        {newFilterCol ? filterInputs : filterColumnOptions}
      </MenthaPopover>
      <Tooltip title="Add filter">
        <IconButton
          aria-describedby={filterPopoverId}
          onClick={(event) => setFilterPopoverAnchor(event.currentTarget)}
        >
          <FilterList />
        </IconButton>
      </Tooltip>
      {filterDisplay}
    </Stack>
  );
}
