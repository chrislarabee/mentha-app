"use client";

import CenteredModal from "@/components/CenteredModal";
import MenthaTable from "@/components/MenthaTable";
import {
  useCategoriesByOwner,
  useCategoriesByOwnerFlat,
} from "@/hooks/categoryHooks";
import {
  useTransactionsByOwner,
  useUpdateTransaction,
} from "@/hooks/transactionHooks";
import { Category, UNCATEGORIZED } from "@/schemas/category";
import { SYSTEM_USER } from "@/schemas/shared";
import {
  Transaction,
  TransactionLabels,
  transactionInputSchema,
} from "@/schemas/transaction";
import { yupResolver } from "@hookform/resolvers/yup";
import { AltRoute, Edit } from "@mui/icons-material";
import {
  Autocomplete,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function TransactionsPage() {
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCat, setNewCat] = useState<string>(UNCATEGORIZED);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });

  const { data: transactions, isLoading } = useTransactionsByOwner(
    SYSTEM_USER,
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

  const tfCatToOpt = (cat: Category) => ({
    id: cat.id,
    label: cat.name,
  });

  const findCatById = (id: string) => {
    let result: Category = {
      id: UNCATEGORIZED,
      name: "Uncategorized",
      owner: SYSTEM_USER,
    };
    if (categories) {
      let findResult = categories.results.find((cat) => cat.id === id);
      if (findResult) {
        result = findResult;
      }
    }
    return result;
  };

  const findTranById = (id: string) => {
    if (transactions) {
      return transactions.results.find((tran) => tran.id === id);
    }
  };

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

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
          onClick: (transactionId: string) => {},
        },
      ]}
    />
  );

  const spinner = isLoading && (
    <Stack direction="row" justifyContent="center" padding={10}>
      <CircularProgress />
    </Stack>
  );
  return (
    <Container component={Paper} sx={{ padding: "20px 0px" }}>
      <CenteredModal open={catModalOpen} onClose={resetCatSelect}>
        {categories && (
          <Stack spacing={1}>
            <Autocomplete
              aria-required
              options={categories.results.map((cat) => tfCatToOpt(cat))}
              value={tfCatToOpt(findCatById(newCat))}
              renderInput={(params) => (
                <Stack direction="row" justifyContent="right">
                  <TextField {...params} label="Category" />
                </Stack>
              )}
              onChange={(event, value) => (value ? setNewCat(value.id) : null)}
            />
            <Stack direction="row" justifyContent="space-evenly">
              <Button fullWidth onClick={resetCatSelect}>
                Cancel
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit((data) => {
                  console.log(data);
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
