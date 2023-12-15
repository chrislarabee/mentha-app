import { Fab } from "@mui/material";
import { ReactNode } from "react";

interface FloatingActionProps {
  onClick?: () => void;
  variant?: "primary" | "secondary";
  children?: ReactNode;
}

export default function FloatingAction({
  variant = "secondary",
  onClick,
  children,
}: FloatingActionProps) {
  return (
    <Fab
      onClick={onClick}
      color={variant === "secondary" ? "default" : "primary"}
      sx={{
        margin: 0,
        top: "auto",
        right: 20,
        bottom: 20,
        left: "auto",
        position: "fixed",
      }}
    >
      {children}
    </Fab>
  );
}
