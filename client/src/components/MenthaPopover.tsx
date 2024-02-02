import { Popover } from "@mui/material";
import { ReactNode, useState } from "react";

interface MenthaPopoverProps {
  id: string;
  anchor: HTMLButtonElement | null;
  onClose?: () => void;
  children?: ReactNode;
  horizontalOffset?: "left" | "center" | "right";
}

export default function MenthaPopover({
  id,
  anchor,
  onClose,
  children,
  horizontalOffset = "left",
}: MenthaPopoverProps) {
  const popoverOpen = Boolean(anchor);
  const popoverId = popoverOpen ? id : undefined;

  return (
    <Popover
      id={popoverId}
      open={popoverOpen}
      onClose={onClose}
      anchorEl={anchor}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: horizontalOffset }}
    >
      {children}
    </Popover>
  );
}

export function useMenthaPopoverAnchor() {
  return useState<HTMLButtonElement | null>(null);
}
