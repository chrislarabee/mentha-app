"use client";

import BasicAccordion from "@/components/BasicAccordion";
import CategoryAutocomplete from "@/components/CategoryAutocomplete";
import CenteredModal from "@/components/CenteredModal";
import FloatingActions from "@/components/FloatingActions";
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
  budgetInputSchema,
} from "@/schemas/budget";
import { INCOME, UNCATEGORIZED, findCatById } from "@/schemas/category";
import {
  round2,
  SYSTEM_USER,
  currencyFormatter,
  generateMonthArray,
} from "@/schemas/shared";
import { yupResolver } from "@hookform/resolvers/yup";
import { Add, AddCircle, Delete, Edit } from "@mui/icons-material";
import {
  Box,
  Button,
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
  onCreate,
}: {
  budget: AllocatedBudget;
  onEdit?: (bgt: AllocatedBudget) => void;
  onDelete?: (bgt: AllocatedBudget) => void;
  onCreate?: (bgt: AllocatedBudget) => void;
}) {
  let remainingPct = 0;
  let displayText = "";
  const formattedAmt = currencyFormatter.format(budget.amt);
  const formattedMonthAmt = currencyFormatter.format(budget.monthAmt);
  const formattedAccumulation = currencyFormatter.format(budget.accumulatedAmt);
  const formattedAllocation = currencyFormatter.format(budget.allocatedAmt);

  if (budget.accumulatedAmt === budget.amt) {
    remainingPct = Math.min(budget.allocatedAmt / budget.amt, 1);
    if (budget.monthAmt === 0) {
      displayText = formattedAllocation;
    } else {
      displayText = `${formattedAllocation} of ${formattedMonthAmt}`;
    }
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
          {budget.monthAmt !== 0 && (
            <Bar variant="determinate" value={remainingPct * 100} />
          )}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography>{displayText}</Typography>
            <Stack direction="row">
              {onDelete && (
                <SmallIconButton
                  tooltipText="Delete Budget"
                  onClick={() => onDelete(budget)}
                >
                  <Delete />
                </SmallIconButton>
              )}
              {onEdit && (
                <SmallIconButton
                  tooltipText="Edit Budget"
                  onClick={() => onEdit(budget)}
                >
                  <Edit />
                </SmallIconButton>
              )}
              {onCreate && (
                <SmallIconButton
                  tooltipText="Create Monthly Budget for this Category"
                  onClick={() => onCreate(budget)}
                >
                  <AddCircle />
                </SmallIconButton>
              )}
            </Stack>
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
  ): BudgetInput => ({
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

  const createBudget = (bgt: AllocatedBudget) => {
    const data = budgetInputFromAllocatedBudget(bgt);
    data.amt = bgt.allocatedAmt;
    data.id = null;
    updateMutation.mutate(data);
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

  const netIncome = budgets && {
    expected: round2(budgets.budgetedIncome - budgets.budgetedExpenses),
    actual: budgets && round2(budgets.actualIncome - budgets.actualExpenses),
  };

  const NetIncomeDisplay = ({ children }: { children: number }) => (
    <Box
      display="inline"
      sx={{
        color: children > 0 ? "green" : children < 0 ? "red" : undefined,
      }}
    >
      {currencyFormatter.format(children)}
    </Box>
  );

  return (
    <Box>
      <Container sx={{ mb: 7 }}>
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
              {categories && (
                <CategoryAutocomplete
                  categories={categories}
                  required
                  value={findCatById(resultCat, categories)}
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
                  <Stack>
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{
                        textTransform: "uppercase",
                      }}
                    >
                      Net income this month
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Typography>
                        Anticipated:{" "}
                        <NetIncomeDisplay>
                          {netIncome.expected}
                        </NetIncomeDisplay>
                      </Typography>
                      <Typography>
                        Actual:{" "}
                        <NetIncomeDisplay>{netIncome.actual}</NetIncomeDisplay>
                      </Typography>
                    </Stack>
                  </Stack>
                )}
                {budgetSelector}
              </Stack>
            </Box>
          </Card>
          <BasicAccordion defaultExpanded heading="Income" noBackground>
            <Stack>
              {budgets?.income.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onEdit={edit}
                  onDelete={deleteBudget}
                />
              ))}
            </Stack>
          </BasicAccordion>
          <BasicAccordion
            heading="Budgeted Expenses"
            defaultExpanded
            noBackground
          >
            <Stack spacing={1}>
              {budgets?.budgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onEdit={edit}
                  onDelete={deleteBudget}
                />
              ))}
            </Stack>
          </BasicAccordion>
          <BasicAccordion heading="Other Expenses" defaultExpanded noBackground>
            <Stack spacing={1}>
              {budgets?.other.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onCreate={createBudget}
                />
              ))}
            </Stack>
          </BasicAccordion>
        </Stack>
      </Container>
      {categories && (
        <FloatingActions
          buttons={[
            {
              color: "primary",
              onClick: () => {
                setModalHeading("Add Budget");
                setFormModalOpen(true);
              },
              children: <Add />,
            },
          ]}
        />
      )}
    </Box>
  );
}
