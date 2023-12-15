import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  Modal,
  Stack,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";

interface CenteredModalProps {
  heading?: string;
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
}

export default function CenteredModal({
  heading,
  open,
  onClose,
  children,
}: CenteredModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <Container>
        <Box
          sx={{
            // TODO: Make at least width configurable with props.
            width: "40%",
            height: "30%",
            // These values center the modal:
            top: "50%",
            left: "50%",
            position: "absolute",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1}>
                {heading && <Typography>{heading}</Typography>}
                <Divider />
                {children}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Modal>
  );
}
