"use client";

import MenthaSelect from "@/components/MenthaSelect";
import { useNetIncomeByOwner } from "@/hooks/trendHooks";
import {
  SYSTEM_USER,
  dateToMonthSlashYear,
  generateMonthArray,
} from "@/schemas/shared";
import {
  Box,
  Card,
  Checkbox,
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

interface NetIncomeChartProps {
  startDt?: Date;
  endDt?: Date;
  showTrend?: boolean;
}

function NetIncomeChart({ startDt, endDt, showTrend }: NetIncomeChartProps) {
  const { data: netIncome } = useNetIncomeByOwner(SYSTEM_USER, startDt, endDt);

  const trend =
    netIncome &&
    stat.linearRegression(netIncome.map((netIn, idx) => [idx, netIn.net]));

  const calculateTrendPoints = (x: number) => {
    const mb = trend || { m: 0, b: 0 };
    return mb.m * x + mb.b;
  };

  return (
    netIncome && (
      <ResponsiveChartContainer
        colors={["#00DA70", "#DA0004", "#737373"]}
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
              ? netIncome.map((_, idx) => calculateTrendPoints(idx))
              : netIncome.map((netIn) => netIn.net),
            label: showTrend ? "Trend" : "Net",
            id: "netId",
            curve: "linear",
          },
        ]}
        xAxis={[
          {
            data: netIncome.map((netIn) => dateToMonthSlashYear(netIn.date)),
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
    )
  );
}

type PeriodOpt = { key: string; months: number };

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

  return (
    <Stack spacing={1}>
      <Container component={Paper}>
        <Box sx={{ padding: 2 }}>
          <Stack direction="row">
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
        <Stack>
          <Container sx={{ width: "100%", height: 450 }}>
            <NetIncomeChart
              startDt={startDt}
              endDt={endDt}
              showTrend={showTrend}
            />
          </Container>
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
