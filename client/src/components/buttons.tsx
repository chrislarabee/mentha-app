import { IconButton, Tooltip } from "@mui/material";
import { ReactNode } from "react";

export function SmallIconButton({
  children,
  tooltipText,
  disabled,
  onClick,
}: {
  children: ReactNode;
  tooltipText?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip title={tooltipText}>
      <span>
        <IconButton
          onClick={onClick}
          disabled={disabled}
          sx={{ transform: "scale(0.7)" }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}
