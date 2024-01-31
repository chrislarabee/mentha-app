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
  headingSize?: "sm" | "lg";
  children?: ReactNode;
  leadingIcon?: ReactNode;
  defaultExpanded?: boolean;
  noBackground?: boolean;
}

export default function BasicAccordion({
  heading,
  children,
  headingSize = "lg",
  leadingIcon,
  defaultExpanded,
  noBackground,
}: BasicAccordionProps) {
  const accordionSx: SxProps = noBackground
    ? { background: "transparent" }
    : {};
  const summarySx: SxProps = noBackground ? { color: "white" } : {};
  const hSize = headingSize === "lg" ? "h5" : "subtitle1";
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
        <Stack direction="row" spacing={1} alignItems="center">
          {leadingIcon}
          <Typography variant={hSize}>{heading}</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}
