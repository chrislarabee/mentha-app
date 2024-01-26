"use client";

import CategoryAutocomplete from "@/components/CategoryAutocomplete";
import CenteredModal from "@/components/CenteredModal";
import FloatingAction from "@/components/FloatingAction";
import Form from "@/components/Form";
import MenthaSelect from "@/components/MenthaSelect";
import { SmallIconButton } from "@/components/buttons";
import { useBudgetsByOwner, useUpdateBudget } from "@/hooks/budgetHooks";
import { useCategoriesByOwnerFlat } from "@/hooks/categoryHooks";
import { useOldestTransaction } from "@/hooks/transactionHooks";
import {
  AllocatedBudget,
  BudgetInput,
  BudgetInputLabels,
  UNALLOCATED,
  UNALLOCATED_CATEGORY,
  budgetInputSchema,
} from "@/schemas/budget";
import { INCOME, UNCATEGORIZED, findCatById } from "@/schemas/category";
import {
  SYSTEM_USER,
  currencyFormatter,
  generateMonthArray,
} from "@/schemas/shared";
import { yupResolver } from "@hookform/resolvers/yup";
import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Box,
  Card,
  Container,
  LinearProgress,
  Stack,
  Typography,
  linearProgressClasses,
  styled,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";

function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: AllocatedBudget;
  onEdit?: (bgt: AllocatedBudget) => void;
  onDelete?: (bgt: AllocatedBudget) => void;
}) {
  let remainingPct = 0;
  let displayText = "";
  const formattedAmt = currencyFormatter.format(budget.amt);
  const formattedMonthAmt = currencyFormatter.format(budget.monthAmt);
  const formattedAccumulation = currencyFormatter.format(budget.accumulatedAmt);
  const formattedAllocation = currencyFormatter.format(budget.allocatedAmt);

  if (budget.accumulatedAmt === budget.amt) {
    remainingPct = budget.allocatedAmt / budget.amt;
    displayText = `${formattedAllocation} of ${formattedMonthAmt}`;
  } else {
    displayText =
      `${formattedMonthAmt} set aside this month` +
      " \u25CF " +
      `${formattedAccumulation} set aside to date of ${formattedAmt} total`;
  }

  const Bar = styled(LinearProgress)(() => ({
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: "lightgrey",
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor: remainingPct > 0.2 ? "green" : "yellow",
    },
  }));

  return (
    <Card>
      <Box sx={{ width: "100%", padding: "15px" }}>
        <Stack>
          <Typography variant="subtitle1">{budget.category.name}</Typography>
          {budget.id !== UNALLOCATED && (
            <Bar variant="determinate" value={remainingPct * 100} />
          )}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography>{displayText}</Typography>
            {budget.id !== UNALLOCATED && (
              <Stack direction="row">
                <SmallIconButton
                  tooltipText="Delete Budget"
                  onClick={onDelete ? () => onDelete(budget) : undefined}
                >
                  <Delete />
                </SmallIconButton>
                <SmallIconButton
                  tooltipText="Edit Budget"
                  onClick={onEdit ? () => onEdit(budget) : undefined}
                >
                  <Edit />
                </SmallIconButton>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Box>
    </Card>
  );
}

export default function BudgetsPage() {
  // Will show up to a year of budget history:
  const monthArray = generateMonthArray(new Date(), -12, "desc");

  const [budgetDate, setBudgetDate] = useState(monthArray[0]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [resultCat, setResultCat] = useState<string>(UNCATEGORIZED);
  const [modalHeading, setModalHeading] = useState("Add New Budget");

  const { data: budgets } = useBudgetsByOwner(
    SYSTEM_USER,
    budgetDate.getFullYear(),
    budgetDate.getMonth() + 1
  );
  const { data: categories } = useCategoriesByOwnerFlat(SYSTEM_USER);
  const { data: oldestTransaction } = useOldestTransaction(SYSTEM_USER);

  const updateMutation = useUpdateBudget();

  const defaultInput: BudgetInput = {
    category: UNCATEGORIZED,
    amt: 0,
    period: 1,
    createDate: new Date(),
    owner: SYSTEM_USER,
  };

  const formReturn = useForm({
    resolver: yupResolver(budgetInputSchema),
    defaultValues: defaultInput,
  });
  const { reset } = formReturn;

  const submit = (budgetData: BudgetInput) => {
    if (resultCat) {
      budgetData.category = resultCat;
    }
  };

  const budgetInputFromAllocatedBudget = (
    bgt: AllocatedBudget,
    inactiveDate?: Date
  ) => ({
    id: bgt.id,
    category: bgt.category.id,
    amt: bgt.amt,
    period: bgt.period,
    createDate: bgt.createDate,
    inactiveDate: inactiveDate,
    owner: bgt.owner,
  });

  const edit = (bgt: AllocatedBudget) => {
    reset(budgetInputFromAllocatedBudget(bgt));
    setResultCat(bgt.category.id);
    setFormModalOpen(true);
    setModalHeading("Edit Budget");
  };

  const deleteBudget = (bgt: AllocatedBudget) => {
    const bgtInput = budgetInputFromAllocatedBudget(bgt, new Date());
    updateMutation.mutate(bgtInput);
  };

  const budgetSelector = oldestTransaction && (
    <MenthaSelect
      // Budget months from before transactions were logged for this user are
      // not available in the select:
      options={monthArray.filter(
        (value) =>
          value >=
          new Date(
            oldestTransaction.date.getFullYear(),
            oldestTransaction.date.getMonth(),
            1
          )
      )}
      optConverter={(opt) => `${opt.getFullYear()}-${opt.getMonth() + 1}`}
      label="Budget Month-Year"
      value={budgetDate}
      comparator={(a: Date, b?: Date) => a.toISOString() === b?.toISOString()}
      onChange={setBudgetDate}
    />
  );

  const incomeBudgets =
    budgets &&
    budgets.filter(
      (bgt) =>
        bgt.category.id === INCOME || bgt.category.parentCategory === INCOME
    );

  const otherBudgets =
    budgets &&
    budgets.filter(
      (bgt) =>
        ![INCOME, UNALLOCATED_CATEGORY].includes(bgt.category.id) &&
        bgt.category.parentCategory !== INCOME
    );

  const unallocatedBudgetCard =
    budgets &&
    budgets
      .filter((bgt) => bgt.id === UNALLOCATED)
      .map((budget) => <BudgetCard key={budget.id} budget={budget} />);

  const netIncome =
    budgets &&
    budgets.reduce((prev, bgt) => {
      if (
        bgt.category.id === INCOME ||
        bgt.category.parentCategory === INCOME
      ) {
        return prev + bgt.allocatedAmt;
      } else {
        return prev - bgt.allocatedAmt;
      }
    }, 0);

  return (
    <Container>
      <CenteredModal
        heading={modalHeading}
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
      >
        <Stack spacing={1}>
          <Form
            mutation={updateMutation}
            formConfig={formReturn}
            labels={BudgetInputLabels}
            textFields={[
              {
                field: "amt",
                type: "number",
                required: true,
                inputAdornment: { pos: "start", adornment: "$" },
              },
              {
                field: "period",
                type: "number",
                required: true,
                inputAdornment: { pos: "end", adornment: "month(s)" },
              },
              { field: "createDate", type: "date", required: true },
            ]}
            onSubmit={submit}
            onSubmitSuccess={() => {
              reset(defaultInput);
              setResultCat(UNCATEGORIZED);
              setFormModalOpen(false);
            }}
          >
            <Typography>
              You can backdate the creation date if desired, just be aware that
              it will affect budget history retroactively.
            </Typography>
            {categories && (
              <CategoryAutocomplete
                categories={categories.results}
                required
                value={findCatById(resultCat, categories.results)}
                onChange={(id) => (id ? setResultCat(id) : UNCATEGORIZED)}
              />
            )}
          </Form>
        </Stack>
      </CenteredModal>
      <Stack spacing={1}>
        <Card>
          <Box sx={{ width: "100%", padding: "15px" }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              {netIncome !== undefined && (
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    textTransform: "uppercase",
                  }}
                >
                  Net income this month:{" "}
                  <Box
                    display="inline"
                    sx={{
                      color:
                        netIncome > 0
                          ? "green"
                          : netIncome < 0
                          ? "red"
                          : undefined,
                    }}
                  >
                    {currencyFormatter.format(netIncome)}
                  </Box>
                </Typography>
              )}
              {budgetSelector}
            </Stack>
          </Box>
        </Card>
        <Typography variant="h5">Income</Typography>
        {incomeBudgets?.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onEdit={edit}
            onDelete={deleteBudget}
          />
        ))}
        <Typography variant="h5">Budgets</Typography>
        {otherBudgets?.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onEdit={edit}
            onDelete={deleteBudget}
          />
        ))}
        <Typography variant="h5">Unallocated Transactions</Typography>
        {unallocatedBudgetCard}
      </Stack>
      {categories && (
        <FloatingAction
          variant="primary"
          onClick={() => {
            setModalHeading("Add Budget");
            setFormModalOpen(true);
          }}
        >
          <Add />
        </FloatingAction>
      )}
    </Container>
  );
}
