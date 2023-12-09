import { Labels } from "@/schemas/shared";
import { ReactElement } from "react";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridValueFormatterParams,
  GridValueGetterParams,
} from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";

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
}: MenthaTableProps<T>) {
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

  return (
    <DataGrid
      loading={isLoading}
      columns={gridColDef}
      rows={rows}
      rowCount={totalRows}
      pageSizeOptions={[]}
      paginationMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={setPaginationModel}
    />
  );
}
