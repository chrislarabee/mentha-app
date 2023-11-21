"use client";

import CenteredModal from "@/components/CenteredModal";
import Form from "@/components/Form";
import { SmallIconButton } from "@/components/buttons";
import {
  useCategoriesByOwner,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/categoryHooks";
import {
  Category,
  CategoryInput,
  CategoryInputLabels,
  categoryInputSchema,
} from "@/schemas/category";
import { yupResolver } from "@hookform/resolvers/yup";
import { AltRoute, Delete, Edit, ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Button,
  CircularProgress,
  Container,
  Divider,
  List,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function CategoriesPage() {
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [editParentCatOpen, setEditParentCatOpen] = useState(false);
  const [deletePromptOpen, setDeletePromptOpen] = useState(false);
  const [newParentCat, setNewParentCat] = useState<string>();
  const [toDelete, setToDelete] = useState<Category>();
  const [modalHeading, setModalHeading] = useState("Add New Category");

  const defaultValues = {
    name: "",
    owner: "9b4923d8-53aa-4f40-b602-9e4765420c07",
  };

  const { data: categories, isLoading } = useCategoriesByOwner(
    "9b4923d8-53aa-4f40-b602-9e4765420c07"
  );

  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const formReturn = useForm({
    resolver: yupResolver(categoryInputSchema),
  });
  const { reset, handleSubmit, getValues } = formReturn;

  const executeDelete = () => {
    if (toDelete) {
      deleteMutation.mutate(toDelete.id);
      setToDelete(undefined);
      setDeletePromptOpen(false);
    }
  };

  const EditButtons = ({
    data,
    editLoading,
    assignParentDisabled,
  }: {
    data: Category;
    editLoading?: boolean;
    assignParentDisabled?: boolean;
  }) => (
    <Stack direction="row" justifyContent="center">
      {editLoading && <CircularProgress />}
      <SmallIconButton
        tooltipText={
          assignParentDisabled
            ? "Cannot Convert Category with Subcategories to Subcategory"
            : (data.parentCategory ? "Reasign" : "Assign") + " Parent Category"
        }
        disabled={assignParentDisabled}
        onClick={() => {
          setEditParentCatOpen(true);
          reset(data);
        }}
      >
        <AltRoute />
      </SmallIconButton>
      <SmallIconButton
        tooltipText="Edit Category"
        onClick={() => {
          setModalHeading("Edit Category");
          setNewCatOpen(true);
          reset(data);
        }}
      >
        <Edit />
      </SmallIconButton>
      <SmallIconButton
        tooltipText="Delete Category"
        onClick={() => {
          setToDelete(data);
          setDeletePromptOpen(true);
        }}
      >
        <Delete />
      </SmallIconButton>
    </Stack>
  );

  const categoryAccordions = categories && (
    <List>
      {categories.map((cat) => (
        <Accordion key={cat.id} disableGutters>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">{cat.name}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              <Container>
                <Stack>
                  <Typography variant="subtitle2">Subcategories</Typography>
                  <Divider />
                  {cat.subcategories.length === 0 ? (
                    <Typography variant="caption" color="grey">
                      No subcategories found.
                    </Typography>
                  ) : (
                    cat.subcategories.map((subcat) => (
                      <Stack
                        key={subcat.id}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="caption">{subcat.name}</Typography>
                        <EditButtons data={subcat} />
                      </Stack>
                    ))
                  )}
                </Stack>
              </Container>
              <Divider />
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setModalHeading(`Add Subcategory to ${cat.name}`);
                    setNewCatOpen(true);
                    reset({
                      ...defaultValues,
                      parentCategory: cat.id,
                    });
                  }}
                >
                  Add Subcategory
                </Button>
                {/* TODO: Hide these buttons if the user's id doesn't match the owner id 
                (i.e. if the owner is the system user) */}
                <EditButtons
                  data={cat}
                  assignParentDisabled={cat.subcategories.length > 0}
                  editLoading={
                    deleteMutation.isPending || updateMutation.isPending
                  }
                />
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </List>
  );

  const parentCategoryReassignment = categories && (
    <Stack spacing={1}>
      <Autocomplete
        options={categories
          .filter((cat) => cat.id !== getValues().id)
          .map((cat) => ({
            id: cat.id,
            label: cat.name,
          }))}
        renderInput={(params) => (
          <TextField {...params} label="Parent Category" />
        )}
        onChange={(event, value) => setNewParentCat(value?.id)}
      />
      <Button
        variant="contained"
        onClick={handleSubmit((data) => {
          data.parentCategory = newParentCat;
          updateMutation.mutate(data);
          setEditParentCatOpen(false);
          setNewParentCat(undefined);
        })}
      >
        Submit
      </Button>
    </Stack>
  );

  const deletePrompt = (
    <Stack spacing={1}>
      <Typography variant="body2">
        {`Really delete Category "${toDelete?.name}"?`}
      </Typography>
      <Typography variant="body2">This cannot be undone.</Typography>
      <Stack direction="row" justifyContent="space-between">
        <Button
          onClick={() => {
            setToDelete(undefined);
            setDeletePromptOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button variant="contained" onClick={executeDelete}>
          Delete
        </Button>
      </Stack>
    </Stack>
  );

  const spinner = isLoading && <CircularProgress />;

  return (
    <Container>
      <CenteredModal
        heading={modalHeading}
        open={newCatOpen}
        onClose={() => setNewCatOpen(false)}
      >
        <Form
          mutation={updateMutation}
          formConfig={formReturn}
          labels={CategoryInputLabels}
          onSubmitSuccess={() => setNewCatOpen(false)}
          stringFields={["name"]}
        />
      </CenteredModal>
      <CenteredModal
        heading="Assign to Parent Category"
        open={editParentCatOpen}
        onClose={() => setEditParentCatOpen(false)}
      >
        {parentCategoryReassignment}
      </CenteredModal>
      <CenteredModal
        heading="Confirm Deletion"
        open={deletePromptOpen}
        onClose={() => setDeletePromptOpen(false)}
      >
        {deletePrompt}
      </CenteredModal>
      <Stack>
        {spinner || categoryAccordions}
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            reset(defaultValues);
            setModalHeading("Add New Category");
            setNewCatOpen(true);
          }}
        >
          Add Category
        </Button>
      </Stack>
    </Container>
  );
}
