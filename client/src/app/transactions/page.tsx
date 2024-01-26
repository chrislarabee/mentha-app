"use client";

import CategoryAutocomplete from "@/components/CategoryAutocomplete";
import CenteredModal from "@/components/CenteredModal";
import FilterManager from "@/components/FilterManager";
import MenthaTable from "@/components/MenthaTable";
import { useCategoriesByOwnerFlat } from "@/hooks/categoryHooks";
import {
  useTransactionsByOwner,
  useUpdateTransaction,
} from "@/hooks/transactionHooks";
import { Category, UNCATEGORIZED, findCatById } from "@/schemas/category";
import {
  MenthaQuery,
  QueryFilterParam,
  SYSTEM_USER,
  currencyFormatter,
} from "@/schemas/shared";
import {
  Transaction,
  TransactionInput,
  TransactionLabels,
  transactionInputSchema,
  transactionInputSchemas,
} from "@/schemas/transaction";
import { yupResolver } from "@hookform/resolvers/yup";
import { Add, AltRoute, Close, Edit } from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { v4 as uuid4 } from "uuid";

interface SplitTransactionProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction;
  categories: Category[];
  onSubmit?: (trans: TransactionInput[]) => void;
}

function SplitTransaction({
  open,
  onClose,
  transaction,
  categories,
  onSubmit,
}: SplitTransactionProps) {
  const transactionToInput = (): TransactionInput => ({
    id: transaction.id,
    fitId: transaction.fitId,
    amt: transaction.amt,
    type: transaction.type,
    date: transaction.date,
    name: transaction.name,
    category: transaction.category.id,
    account: transaction.account,
    owner: transaction.owner,
  });
  const total = transaction.amt;
  const { control } = useForm({
    resolver: yupResolver(transactionInputSchemas),
    defaultValues: { inputs: [transactionToInput()] },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "inputs",
  });
  const transactions = useWatch({ control, name: "inputs" });

  const getSplitTotal = () =>
    transactions.reduce((prev, current) => prev + Number(current.amt), 0);

  const generateTransactionInput = (
    amt: number,
    category: string = UNCATEGORIZED
  ): TransactionInput => ({
    fitId: transaction.fitId,
    amt: amt,
    type: transaction.type,
    date: transaction.date,
    name: transaction.name,
    category: category,
    account: transaction.account,
    owner: transaction.owner,
  });

  return (
    <CenteredModal open={open} onClose={onClose} heading="Split Transaction">
      <Stack spacing={1}>
        {fields.map((_, idx) => {
          return (
            <Stack key={uuid4()} direction="row" spacing={1}>
              <Controller
                name={`inputs.${idx}.amt`}
                control={control}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    value={field.value}
                    InputProps={{ startAdornment: "$" }}
                    type="number"
                    onChange={field.onChange}
                    autoFocus
                  />
                )}
              />
              <Controller
                name={`inputs.${idx}.category`}
                control={control}
                render={({ field }) => (
                  <CategoryAutocomplete
                    categories={categories}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <IconButton onClick={() => remove(idx)}>
                <Close />
              </IconButton>
            </Stack>
          );
        })}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle2">
            {currencyFormatter.format(getSplitTotal())} /{" "}
            {currencyFormatter.format(total)}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => {
              append(generateTransactionInput(total - getSplitTotal()));
            }}
          >
            Add Split
          </Button>
        </Stack>
        <Button
          variant="contained"
          disabled={total - getSplitTotal() != 0}
          onClick={onSubmit ? () => onSubmit(transactions) : undefined}
        >
          Apply
        </Button>
      </Stack>
    </CenteredModal>
  );
}

export default function TransactionsPage() {
  const [filters, setFilters] = useState<Record<string, QueryFilterParam>>({});
  const [query, setQuery] = useState<MenthaQuery>({
    sorts: [
      { field: "date", direction: "desc" },
      { field: "name", direction: "asc" },
    ],
    filters: [],
  });
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [newCat, setNewCat] = useState<string>(UNCATEGORIZED);
  const [splitTransaction, setSplitTransaction] = useState<Transaction>();
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });

  const { data: transactions, isLoading } = useTransactionsByOwner(
    SYSTEM_USER,
    query,
    paginationModel.page + 1,
    paginationModel.pageSize
  );
  const { data: categories } = useCategoriesByOwnerFlat(SYSTEM_USER);

  const updateMutation = useUpdateTransaction();

  const { reset, handleSubmit } = useForm({
    resolver: yupResolver(transactionInputSchema),
  });

  const resetCatSelect = () => {
    setCatModalOpen(false);
    setNewCat(UNCATEGORIZED);
    reset();
  };

  const closeSplitModal = () => {
    setSplitModalOpen(false);
    setSplitTransaction(undefined);
  };

  const findTranById = (id: string) => {
    if (transactions) {
      return transactions.results.find((tran) => tran.id === id);
    }
  };

  const transactionTable = transactions && categories && (
    <MenthaTable
      isLoading={isLoading}
      paginationModel={paginationModel}
      setPaginationModel={setPaginationModel}
      labels={TransactionLabels}
      rows={transactions.results}
      totalRows={transactions.totalHitCount}
      columns={[
        {
          field: "date",
          type: "date",
          formatter: (value: string) => new Date(value).toLocaleDateString(),
        },
        { field: "name", widthPct: 0.5 },
        { field: "amt", type: "number", formatter: currencyFormatter.format },
        {
          field: "category",
          widthPct: 0.2,
          getter: (value: Category) => value.name,
        },
      ]}
      actions={[
        {
          label: "Edit Category",
          icon: <Edit />,
          onClick: (transactionId: string) => {
            let tran = findTranById(transactionId);
            if (tran) {
              setNewCat(tran.category.id);
              reset({
                id: tran.id,
                fitId: tran.fitId,
                amt: tran.amt,
                date: tran.date,
                name: tran.name,
                category: tran.category.id,
                account: tran.account,
                owner: tran.owner,
              });
              setCatModalOpen(true);
            }
          },
        },
        {
          label: "Split Transaction",
          icon: <AltRoute sx={{ transform: "rotate(90deg)" }} />,
          onClick: (transactionId: string) => {
            let tran = findTranById(transactionId);
            if (tran) {
              setSplitTransaction(tran);
              setSplitModalOpen(true);
            }
          },
        },
      ]}
    >
      <FilterManager
        columnOptions={[
          "name",
          { field: "amt", type: "number" },
          { field: "date", type: "date" },
          {
            field: "category",
            type: "category",
            renderFilterTerm: (term) => {
              const result = categories.results.find((cat) => cat.id === term);
              return result?.name || term;
            },
          },
        ]}
        categories={categories.results}
        optionLabels={TransactionLabels}
        filters={filters}
        setFilters={(filters) => {
          setFilters(filters);
          setQuery((prev) => ({
            sorts: prev.sorts,
            filters: Object.values(filters),
          }));
        }}
      />
    </MenthaTable>
  );

  const spinner = isLoading && (
    <Stack direction="row" justifyContent="center" padding={10}>
      <CircularProgress />
    </Stack>
  );

  return (
    <Container component={Paper} sx={{ padding: "20px 0px" }}>
      {categories && splitTransaction && (
        <SplitTransaction
          open={splitModalOpen}
          onClose={closeSplitModal}
          transaction={splitTransaction}
          categories={categories.results}
          onSubmit={async (trans) => {
            for (let i = 0; i < trans.length; i++) {
              await updateMutation.mutate(trans[i]);
            }
            closeSplitModal();
          }}
        />
      )}
      <CenteredModal open={catModalOpen} onClose={resetCatSelect}>
        {categories && (
          <Stack spacing={1}>
            <CategoryAutocomplete
              required
              categories={categories.results}
              value={findCatById(newCat, categories.results)}
              onChange={(id) => id && setNewCat(id)}
            />
            <Stack direction="row" justifyContent="space-evenly">
              <Button fullWidth onClick={resetCatSelect}>
                Cancel
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit((data) => {
                  data.category = newCat;
                  updateMutation.mutate(data);
                  resetCatSelect();
                })}
              >
                Apply
              </Button>
            </Stack>
          </Stack>
        )}
      </CenteredModal>
      {spinner || transactionTable}
    </Container>
  );
}
