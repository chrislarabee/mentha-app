"use client";

import CategoryAutocomplete from "@/components/CategoryAutocomplete";
import MenthaSelect from "@/components/MenthaSelect";
import { useCategoriesByOwnerFlat } from "@/hooks/categoryHooks";
import {
  useCategorySpendingByOwner,
  useNetIncomeByOwner,
} from "@/hooks/trendHooks";
import {
  SYSTEM_USER,
  currencyFormatter,
  dateToMonthSlashYear,
  generateMonthArray,
  round2,
  sum,
} from "@/schemas/shared";
import {
  Box,
  Card,
  Checkbox,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  BarPlot,
  ChartsTooltip,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  MarkPlot,
  ResponsiveChartContainer,
} from "@mui/x-charts";
import { useState } from "react";
import * as stat from "simple-statistics";

type Trend = { m: number; b: number };

const calculateTrendPoints = (x: number, trend?: Trend) => {
  const mb = trend || { m: 0, b: 0 };
  return mb.m * x + mb.b;
};

const green = "#00DA70";
const red = "#DA0004";
const grey = "#737373";

function TrendAggregateDetails({
  values,
  trend,
  showTrend,
}: {
  values: number[];
  trend?: Trend;
  showTrend?: boolean;
}) {
  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      spacing={1}
    >
      <Typography>Total = {currencyFormatter.format(sum(values))}</Typography>
      <Typography>
        Mean = {currencyFormatter.format(sum(values) / values.length)}
      </Typography>
      {trend && showTrend && <Typography>Trend = {round2(trend.m)}</Typography>}
    </Stack>
  );
}

interface TrendChartProps {
  chartHeight: number;
  startDt?: Date;
  endDt?: Date;
  showTrend?: boolean;
}

function NetIncomeChart({
  chartHeight,
  startDt,
  endDt,
  showTrend,
}: TrendChartProps) {
  const { data: netIncome } = useNetIncomeByOwner(SYSTEM_USER, startDt, endDt);

  const trend =
    netIncome &&
    stat.linearRegression(netIncome.map((netIn, idx) => [idx, netIn.net]));

  return (
    netIncome && (
      <Stack>
        <Container sx={{ width: "100%", height: chartHeight }}>
          <ResponsiveChartContainer
            colors={[green, red, grey]}
            series={[
              {
                type: "bar",
                data: netIncome.map((netIn) => netIn.income),
                label: "Income",
                id: "incomeId",
                stack: "stack1",
              },
              {
                type: "bar",
                data: netIncome.map((netIn) => netIn.expense),
                label: "Expenses",
                id: "expenseId",
                stack: "stack1",
              },
              {
                type: "line",
                data: showTrend
                  ? netIncome.map((_, idx) => calculateTrendPoints(idx, trend))
                  : netIncome.map((netIn) => netIn.net),
                label: showTrend ? "Trend" : "Net",
                id: "netId",
                curve: "linear",
              },
            ]}
            xAxis={[
              {
                data: netIncome.map((netIn) =>
                  dateToMonthSlashYear(netIn.date)
                ),
                scaleType: "band",
                id: "x-axis-id",
              },
            ]}
          >
            <BarPlot />
            <LinePlot />
            <MarkPlot />
            <ChartsYAxis label="Amt" position="left" />
            <ChartsXAxis label="Month" position="bottom" axisId="x-axis-id" />
            <ChartsTooltip />
          </ResponsiveChartContainer>
        </Container>
        <TrendAggregateDetails
          values={netIncome.map((netIn) => netIn.net)}
          trend={trend}
          showTrend={showTrend}
        />
      </Stack>
    )
  );
}

interface CategorySpendingChartProps extends TrendChartProps {
  category: string;
}

function CategorySpendingChart({
  chartHeight,
  startDt,
  endDt,
  showTrend,
  category,
}: CategorySpendingChartProps) {
  const { data: categorySpending } = useCategorySpendingByOwner(
    SYSTEM_USER,
    category,
    startDt,
    endDt
  );

  const trend =
    categorySpending &&
    stat.linearRegression(
      categorySpending.map((catSp, idx) => [idx, catSp.amt])
    );

  const chart = categorySpending && (
    <Stack>
      <Container sx={{ width: "100%", height: chartHeight }}>
        <ResponsiveChartContainer
          colors={[green, grey]}
          series={[
            {
              type: "bar",
              data: categorySpending.map((catSp) => catSp.amt),
              label: "Spending",
              id: "spendId",
            },
            {
              type: "line",
              data: categorySpending.map((_, idx) =>
                calculateTrendPoints(idx, trend)
              ),
              label: "Trend",
              id: "trendId",
              curve: "linear",
            },
          ]}
          xAxis={[
            {
              data: categorySpending.map((catSp) =>
                dateToMonthSlashYear(catSp.date)
              ),
              scaleType: "band",
              id: "x-axis-id",
            },
          ]}
        >
          <BarPlot />
          {showTrend && <LinePlot />}
          {showTrend && <MarkPlot />}
          <ChartsYAxis label="Amt" position="left" />
          <ChartsXAxis label="Month" position="bottom" axisId="x-axis-id" />
          <ChartsTooltip />
        </ResponsiveChartContainer>
      </Container>
      <TrendAggregateDetails
        values={categorySpending.map((catSp) => catSp.amt)}
        trend={trend}
        showTrend={showTrend}
      />
    </Stack>
  );

  return <>{chart || <CircularProgress />}</>;
}

type PeriodOpt = { key: string; months: number };
const trendModes = ["category-spending", "net-income"] as const;
type TrendMode = (typeof trendModes)[number];

export default function TrendsPage() {
  const currentDate = new Date();
  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const prevMonthEnd = new Date(monthStart.setMilliseconds(-1));
  const prevMonthEndTimeless = new Date(
    prevMonthEnd.getFullYear(),
    prevMonthEnd.getMonth(),
    prevMonthEnd.getDate()
  );
  const defaultPeriod = { key: "6 months", months: -6 };
  const [period, setPeriod] = useState(defaultPeriod);
  const defaultMonthArray = generateMonthArray(
    prevMonthEndTimeless,
    period.months
  );
  const [endDt, setEndDt] = useState(prevMonthEndTimeless);
  const [startDt, setStartDt] = useState(defaultMonthArray[0]);
  const [mode, setMode] = useState<TrendMode>("net-income");
  const [category, setCategory] = useState<string>("");
  const [showTrend, setShowTrend] = useState(false);

  const periodMap: Record<string, number> = {
    "6 months": -6,
    "1 year": -12,
  };

  const handlePeriodSelect = (periodOpt: PeriodOpt) => {
    setPeriod(periodOpt);
    const monthArray = generateMonthArray(endDt, periodOpt.months);
    setStartDt(monthArray[0]);
  };

  const modeMap: Record<TrendMode, string> = {
    "net-income": "Net Income",
    "category-spending": "Spending By Category",
  };

  const { data: categories } = useCategoriesByOwnerFlat(SYSTEM_USER);

  return (
    <Stack spacing={1}>
      <Container component={Paper}>
        <Box sx={{ padding: 2 }}>
          <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <MenthaSelect
                options={trendModes}
                optConverter={(opt) => modeMap[opt]}
                label="Mode"
                value={mode}
                onChange={setMode}
              />
              {mode === "category-spending" && categories && (
                <CategoryAutocomplete
                  categories={categories}
                  value={category}
                  onChange={(id) => setCategory(id || "")}
                  size="small"
                />
              )}
            </Stack>
            <MenthaSelect
              options={Object.entries(periodMap).map(
                ([key, months]) =>
                  ({
                    key,
                    months,
                  } as PeriodOpt)
              )}
              optConverter={(opt) => opt.key}
              label="Period"
              value={period}
              onChange={handlePeriodSelect}
              comparator={(a, b) => a.key === b?.key}
            />
          </Stack>
        </Box>
      </Container>
      <Card component={Paper}>
        <Stack spacing={1}>
          {mode === "net-income" && (
            <NetIncomeChart
              chartHeight={450}
              startDt={startDt}
              endDt={endDt}
              showTrend={showTrend}
            />
          )}
          {mode === "category-spending" &&
            (category ? (
              <CategorySpendingChart
                chartHeight={450}
                startDt={startDt}
                endDt={endDt}
                showTrend={showTrend}
                category={category}
              />
            ) : (
              <Box sx={{ paddingTop: 5 }}>
                <Stack justifyContent="center" alignItems="center">
                  <Typography variant="subtitle2">
                    Please select a category
                  </Typography>
                </Stack>
              </Box>
            ))}
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            sx={{ padding: 2 }}
          >
            <Typography>Show Trend</Typography>
            <Checkbox
              checked={showTrend}
              onChange={(event) => setShowTrend(event.target.checked)}
            />
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}
