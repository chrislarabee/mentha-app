import { Button, Stack, Typography } from "@mui/material";
import CenteredModal from "./CenteredModal";

interface DeletePromptProps<T> {
  toDelete: T | undefined;
  promptOpen: boolean;
  setPromptOpen: (value: boolean) => void;
  getPromptMsg: (toDelete: T | undefined) => string;
  executeDelete?: () => void;
  setToDelete?: (value: T | undefined) => void;
  heading?: string;
}

export default function DeletePrompt<T>({
  toDelete,
  promptOpen,
  setPromptOpen,
  getPromptMsg,
  executeDelete,
  setToDelete,
  heading,
}: DeletePromptProps<T>) {
  return (
    <CenteredModal
      heading={heading || "Confirm Deletion"}
      open={promptOpen}
      onClose={() => setPromptOpen(false)}
    >
      <Stack spacing={1}>
        <Typography variant="body2">
          {`Really delete ${getPromptMsg(toDelete)}?`}
        </Typography>
        <Typography variant="body2">This cannot be undone.</Typography>
        <Stack direction="row" justifyContent="space-between">
          <Button
            onClick={() => {
              setToDelete && setToDelete(undefined);
              setPromptOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={executeDelete}>
            Delete
          </Button>
        </Stack>
      </Stack>
    </CenteredModal>
  );
}
