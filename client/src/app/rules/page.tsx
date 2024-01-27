"use client";

import CategoryAutocomplete from "@/components/CategoryAutocomplete";
import CenteredModal from "@/components/CenteredModal";
import DeletePrompt from "@/components/DeletePrompt";
import FilterManager from "@/components/FilterManager";
import FloatingActions from "@/components/FloatingActions";
import Form from "@/components/Form";
import MenthaTable from "@/components/MenthaTable";
import { useCategoriesByOwnerFlat } from "@/hooks/categoryHooks";
import {
  useDeleteRule,
  useRulesByOwner,
  useUpdateRule,
} from "@/hooks/ruleHooks";
import { useApplyRules } from "@/hooks/transactionHooks";
import { Category, UNCATEGORIZED, findCatById } from "@/schemas/category";
import {
  Rule,
  RuleInput,
  RuleInputLabels,
  RuleLabels,
  ruleInputSchema,
} from "@/schemas/rule";
import {
  MenthaQuery,
  QueryFilterParam,
  SYSTEM_USER,
  removeNullsFromArray,
} from "@/schemas/shared";
import { yupResolver } from "@hookform/resolvers/yup";
import { Add, Delete, Edit } from "@mui/icons-material";
import { Box, Container, Paper, Snackbar, Stack } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function RulesPage() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [resultCat, setResultCat] = useState<string>(UNCATEGORIZED);
  const [deletePromptOpen, setDeletePromptOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Rule>();
  const [modalHeading, setModalHeading] = useState("Add New Rule");
  const [toastOpen, setToastOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, QueryFilterParam>>({});
  const [query, setQuery] = useState<MenthaQuery>({
    sorts: [{ field: "priority", direction: "asc" }],
    filters: [],
  });
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });

  const updateMutation = useUpdateRule();
  const deleteMutation = useDeleteRule();
  const applyRulesMutation = useApplyRules(() => setToastOpen(true));

  const defaultInput: RuleInput = {
    priority: 1,
    resultCategory: UNCATEGORIZED,
    owner: SYSTEM_USER,
  };

  const formReturn = useForm({
    resolver: yupResolver(ruleInputSchema),
    defaultValues: defaultInput,
  });
  const { reset } = formReturn;

  const { data: rules, isLoading } = useRulesByOwner(
    SYSTEM_USER,
    query,
    paginationModel.page + 1,
    paginationModel.pageSize
  );
  const { data: categories } = useCategoriesByOwnerFlat(SYSTEM_USER);

  const executeDelete = () => {
    if (toDelete) {
      deleteMutation.mutate(toDelete.id);
      setToDelete(undefined);
      setDeletePromptOpen(false);
    }
  };

  const findRuleById = (id: string) => {
    if (rules) {
      return rules.results.find((rule) => rule.id === id);
    }
  };

  const ruleTable = rules && (
    <MenthaTable
      isLoading={isLoading}
      paginationModel={paginationModel}
      setPaginationModel={setPaginationModel}
      labels={RuleLabels}
      rows={rules.results}
      totalRows={rules.totalHitCount}
      columns={[
        {
          field: "resultCategory",
          widthPct: 0.1,
          getter: (value: Category) => value.name,
        },
        { field: "matchAmt" },
        { field: "matchName" },
        { field: "priority", type: "number" },
      ]}
      actions={[
        {
          label: "Edit Rule",
          icon: <Edit />,
          onClick: (ruleId) => {
            let rule = findRuleById(ruleId);
            if (rule) {
              reset({
                id: rule.id,
                priority: rule.priority,
                resultCategory: rule.resultCategory.id,
                owner: rule.owner,
                matchAmt: rule.matchAmt,
                matchName: rule.matchName,
              });
              setResultCat(rule.resultCategory.id);
              setModalHeading("Edit Rule");
              setFormModalOpen(true);
            }
          },
        },
        {
          label: "Delete Rule",
          icon: <Delete />,
          onClick: (ruleId) => {
            let rule = findRuleById(ruleId);
            if (rule) {
              setToDelete(rule);
              setDeletePromptOpen(true);
            }
          },
        },
      ]}
    >
      <FilterManager
        columnOptions={[
          {
            field: "resultCategory",
            type: "category",
            renderFilterTerm: (term) => {
              const result = categories?.find((cat) => cat.id === term);
              return result?.name || term;
            },
          },
        ]}
        optionLabels={RuleLabels}
        filters={filters}
        categories={categories}
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

  const submit = (ruleData: RuleInput) => {
    if (resultCat) {
      ruleData.resultCategory = resultCat;
    }
  };

  return (
    <Box>
      <CenteredModal
        heading={modalHeading}
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
      >
        <Stack spacing={1}>
          <Form
            mutation={updateMutation}
            formConfig={formReturn}
            labels={RuleInputLabels}
            textFields={[
              "matchAmt",
              "matchName",
              { field: "priority", type: "number", required: true },
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
      <DeletePrompt
        promptOpen={deletePromptOpen}
        setPromptOpen={setDeletePromptOpen}
        toDelete={toDelete}
        setToDelete={setToDelete}
        getPromptMsg={(toDelete) => {
          const clauses = removeNullsFromArray([
            toDelete?.matchAmt,
            toDelete?.matchName,
          ]);
          return `Rule "(${clauses.join(" & ")}) = ${
            toDelete?.resultCategory.name
          }"`;
        }}
        executeDelete={executeDelete}
      />
      <Snackbar
        message="Rules successfully applied!"
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        autoHideDuration={3000}
      />
      <Container component={Paper} sx={{ padding: "20px 0px", mb: 7 }}>
        {ruleTable}
      </Container>
      {categories && (
        <FloatingActions
          buttons={[
            {
              onClick: () => applyRulesMutation.mutate(SYSTEM_USER),
              disabled: applyRulesMutation.isPending,
              children: "Apply Rules",
              variant: "extended",
              color: "secondary",
            },
            {
              onClick: () => {
                setFormModalOpen(true);
                setModalHeading("Add Rule");
              },
              children: <Add />,
            },
          ]}
        />
      )}
    </Box>
  );
}
