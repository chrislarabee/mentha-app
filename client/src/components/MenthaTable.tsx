import { Labels } from "@/schemas/shared";
import { ReactElement, ReactNode, useState } from "react";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridValueFormatterParams,
  GridValueGetterParams,
} from "@mui/x-data-grid";
import {
  Button,
  IconButton,
  List,
  ListItem,
  Popover,
  Stack,
  Tooltip,
} from "@mui/material";
import { FilterList } from "@mui/icons-material";

export interface PaginationModel {
  page: number;
  pageSize: number;
}

export interface ColumnDefinition<T> {
  field: keyof T;
  widthPct?: number;
  type?: "string" | "date" | "number" | "singleSelect";
  formatter?: (value: any) => string;
  getter?: (value: any) => string;
  renderComponent?: (value: any) => ReactElement;
  editable?: boolean;
}

interface MenthaTableProps<T> {
  rows: T[];
  columns: (keyof T | ColumnDefinition<T>)[];
  labels: Labels<T>;
  paginationModel: PaginationModel;
  setPaginationModel: (value: PaginationModel) => void;
  totalRows: number;
  isLoading: boolean;
  actions?: {
    label: string;
    icon: ReactElement<any, string>;
    onClick: (id: string) => void;
  }[];
  onFilter?: () => {};
  children?: ReactNode;
}

export default function MenthaTable<T extends Record<string, any>>({
  paginationModel,
  setPaginationModel,
  totalRows,
  isLoading,
  rows,
  columns,
  labels,
  actions,
  children,
}: MenthaTableProps<T>) {
  const [filterPopoverAnchor, setFilterPopoverAnchor] =
    useState<HTMLButtonElement | null>(null);
  const [newFilterCol, setNewFilterCol] = useState<ColumnDefinition<T>>();

  const columnDef: ColumnDefinition<T>[] = columns.map((value) => {
    if (value instanceof Object) {
      return value;
    } else {
      return { field: value } as ColumnDefinition<T>;
    }
  });

  const gridColDef: GridColDef[] = columnDef.map((def) => ({
    field: def.field.toString(),
    headerName: labels[def.field],
    type: def.type,
    flex: def.widthPct,
    editable: def.editable,
    valueFormatter: (params: GridValueFormatterParams) =>
      def.formatter ? def.formatter(params.value) : params.value,
    valueGetter: (params: GridValueGetterParams) =>
      def.getter ? def.getter(params.value) : params.value,
  }));

  if (actions) {
    gridColDef.push({
      field: "actions",
      type: "actions",
      getActions: (params) => {
        return actions.map((action) => (
          <Tooltip title={action.label}>
            <GridActionsCellItem
              label={action.label}
              icon={action.icon}
              onClick={() => action.onClick(params.id.toString())}
            />
          </Tooltip>
        ));
      },
    });
  }

  const filterPopoverOpen = Boolean(filterPopoverAnchor);

  const filterPopId = filterPopoverOpen ? "filter-popover" : undefined;

  const filterButton = (
    <IconButton
      aria-describedby={filterPopId}
      onClick={(event) => setFilterPopoverAnchor(event.currentTarget)}
    >
      <FilterList />
    </IconButton>
  );

  const filterColumnOptions = (
    <List>
      {columnDef.map((def) => (
        <ListItem key={def.field.toString()}>
          <Button onClick={() => setNewFilterCol(def)}>
            {labels[def.field]}
          </Button>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Stack spacing={children ? 2 : 0}>
      <Stack direction="row" justifyContent="space-between">
        <Tooltip title="Add filter">{filterButton}</Tooltip>
        <Stack direction="row" justifyContent="flex-end">
          {children}
        </Stack>
      </Stack>
      <Popover
        id={filterPopId}
        open={filterPopoverOpen}
        onClose={() => {
          setFilterPopoverAnchor(null);
          setNewFilterCol(undefined);
        }}
        anchorEl={filterPopoverAnchor}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {newFilterCol ? "Filter Inputs Here" : filterColumnOptions}
      </Popover>
      <DataGrid
        loading={isLoading}
        columns={gridColDef}
        rows={rows}
        rowCount={totalRows}
        pageSizeOptions={[50, 100]}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        disableColumnFilter
        disableColumnSelector
      />
    </Stack>
  );
}
