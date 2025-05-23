"use client";

import BasicAccordion from "@/components/BasicAccordion";
import CategoryAutocomplete from "@/components/CategoryAutocomplete";
import CenteredModal from "@/components/CenteredModal";
import FloatingActions from "@/components/FloatingActions";
import Form from "@/components/Form";
import { SmallIconButton } from "@/components/buttons";
import { useBudgetsByOwner, useUpdateBudget } from "@/hooks/budgetHooks";
import { useCategoriesByOwnerFlat } from "@/hooks/categoryHooks";
import {
  AllocatedBudget,
  BudgetInput,
  BudgetInputLabels,
  budgetInputSchema,
} from "@/schemas/budget";
import { INCOME, UNCATEGORIZED, findCatById } from "@/schemas/category";
import {
  SYSTEM_USER,
  currencyFormatter,
  dateToMonthSlashYear,
  round2,
} from "@/schemas/shared";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Add,
  AddCircle,
  Delete,
  Edit,
  VerticalAlignCenter,
} from "@mui/icons-material";
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
  onCreate,
  onResetAmt,
}: {
  budget: AllocatedBudget;
  onEdit?: (bgt: AllocatedBudget) => void;
  onDelete?: (bgt: AllocatedBudget) => void;
  onCreate?: (bgt: AllocatedBudget) => void;
  onResetAmt?: (bgt: AllocatedBudget) => void;
}) {
  let pctUsed = 0;
  let displayText = "";
  let exceededBudgetColor = budget.category.parentCategory === INCOME ? "green" : "red";
  const formattedAmt = currencyFormatter.format(budget.amt);
  const formattedMonthAmt = currencyFormatter.format(budget.monthAmt);
  const formattedAccumulation = currencyFormatter.format(budget.accumulatedAmt);
  const formattedAllocation = currencyFormatter.format(budget.allocatedAmt);

  if (budget.accumulatedAmt === budget.amt) {
    pctUsed = budget.allocatedAmt / budget.amt;
    if (budget.monthAmt === 0) {
      displayText = formattedAllocation;
    } else {
      displayText = `${formattedAllocation} of ${formattedMonthAmt}`;
    }
  } else {
    displayText =
      `${formattedMonthAmt} this month` +
      " \u25CF " +
      `${formattedAccumulation} to date of ${formattedAmt} total`;
  }

  const Bar = styled(LinearProgress)(() => ({
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: "lightgrey",
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor:
        pctUsed > 1 ? exceededBudgetColor : pctUsed >= 0.8 ? "#ffd900" : "green",
    },
  }));

  return (
    <Card>
      <Box sx={{ width: "100%", padding: "15px" }}>
        <Stack>
          <Typography variant="subtitle1">{budget.category.name}</Typography>
          {budget.monthAmt !== 0 && (
            <Bar variant="determinate" value={Math.min(pctUsed, 1) * 100} />
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
              {onResetAmt && budget.period === 1 && (
                <SmallIconButton
                  tooltipText="Set Amt to Current Allocation"
                  onClick={() => onResetAmt(budget)}
                >
                  <VerticalAlignCenter />
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
  const budgetDate = new Date();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [resultCat, setResultCat] = useState<string>(UNCATEGORIZED);
  const [modalHeading, setModalHeading] = useState("Add New Budget");

  const { data: budgets } = useBudgetsByOwner(
    SYSTEM_USER,
    budgetDate.getFullYear(),
    budgetDate.getMonth() + 1
  );
  const { data: categories } = useCategoriesByOwnerFlat(SYSTEM_USER);

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

  const resetFloor = (bgt: AllocatedBudget) => {
    const data = budgetInputFromAllocatedBudget(bgt);
    data.amt = bgt.allocatedAmt;
    updateMutation.mutate(data);
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
                {budgets && (
                  <Stack>
                    <Typography
                      variant="h6"
                      component="p"
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
                          {budgets.anticipatedNet}
                        </NetIncomeDisplay>
                      </Typography>
                    </Stack>
                  </Stack>
                )}
                <Typography variant="h6">
                  {dateToMonthSlashYear(budgetDate)}
                </Typography>
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
                  onResetAmt={resetFloor}
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
                  onResetAmt={resetFloor}
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
