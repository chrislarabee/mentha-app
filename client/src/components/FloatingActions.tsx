import { Fab, Stack } from "@mui/material";
import { ReactNode } from "react";
import { v4 as uuid4 } from "uuid";

interface FloatingActionProps {
  onClick?: () => void;
  color?: "primary" | "secondary";
  variant?: "extended" | "circular";
  children?: ReactNode;
  disabled?: boolean;
}

interface FloatingActionsProps {
  buttons: FloatingActionProps[];
}

export default function FloatingActions({ buttons }: FloatingActionsProps) {
  const FloatingAction = ({
    onClick,
    color,
    children,
    variant,
    disabled,
  }: FloatingActionProps) => (
    <Fab
      onClick={onClick}
      variant={variant}
      color={color || "primary"}
      disabled={disabled}
    >
      {children}
    </Fab>
  );
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{
        margin: 0,
        top: "auto",
        right: 20,
        bottom: 20,
        left: "auto",
        position: "fixed",
      }}
    >
      {buttons.map((btnProps) => (
        <FloatingAction
          key={uuid4()}
          onClick={btnProps.onClick}
          color={btnProps.color}
          variant={btnProps.variant}
          disabled={btnProps.disabled}
        >
          {btnProps.children}
        </FloatingAction>
      ))}
    </Stack>
  );
}
