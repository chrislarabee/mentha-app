import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { v4 as uuid } from "uuid";

export type HeaderDefinition<T> = {
  [P in keyof T]?: string;
};

export default function MenthaTable<T extends Record<string, any>>({
  rows,
  definition,
}: {
  rows: T[];
  definition: HeaderDefinition<T>;
}) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            {Object.values(definition).map((label) => (
              <TableCell key={uuid()}>{label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {Object.keys(definition).map((field) => (
                <TableCell key={`${row.id}_${field}`}>{row[field]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
