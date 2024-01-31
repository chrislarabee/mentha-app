import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  SxProps,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";

interface BasicAccordionProps {
  heading: string;
  children?: ReactNode;
  defaultExpanded?: boolean;
  noBackground?: boolean;
}

export default function BasicAccordion({
  heading,
  children,
  defaultExpanded,
  noBackground,
}: BasicAccordionProps) {
  const accordionSx: SxProps = noBackground
    ? { background: "transparent" }
    : {};
  const summarySx: SxProps = noBackground ? { color: "white" } : {};
  return (
    <Accordion
      disableGutters
      defaultExpanded={defaultExpanded}
      sx={accordionSx}
    >
      <AccordionSummary
        expandIcon={<ExpandMore sx={summarySx} />}
        sx={summarySx}
      >
        <Stack direction="row">
          <Typography variant="h5">{heading}</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}
