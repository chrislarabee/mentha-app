"use client";

import {
  AccountBalance,
  AccountTreeRounded,
  Assignment,
  AttachMoney,
  InsertChart,
  Sell,
  SpeedOutlined,
} from "@mui/icons-material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuIcon from "@mui/icons-material/Menu";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import { styled, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import * as React from "react";

const drawerWidth = 240;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

interface NavItem {
  icon: JSX.Element;
  label: string;
  url: string;
  subnavs?: NavItem[];
}

export default function Navigation({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);
  const [openNavAccordions, setOpenNavAccordions] = React.useState<
    Record<string, boolean>
  >({
    categories: false,
  });

  const router = useRouter();
  const theme = useTheme();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const navItems: NavItem[] = [
    {
      icon: <SpeedOutlined />,
      label: "Dashboard",
      url: "/",
    },
    {
      icon: <AttachMoney />,
      label: "Transactions",
      url: "/transactions",
    },
    {
      icon: <Assignment />,
      label: "Budget",
      url: "/budgets",
    },
    {
      icon: <Sell />,
      label: "Categories",
      url: "/categories",
      subnavs: [
        {
          icon: <AccountTreeRounded />,
          label: "Rules",
          url: "/rules",
        },
      ],
    },
    {
      icon: <InsertChart />,
      label: "Trends",
      url: "/trends",
    },
    {
      icon: <AccountBalance />,
      label: "Accounts",
      url: "/accounts",
    },
  ];

  const navigate = (item: NavItem) => {
    router.push(item.url);
  };

  const ListBlock = ({ items }: { items: NavItem[] }) => (
    <List>
      {items.map((item) => (
        <Accordion
          key={item.label}
          disableGutters
          elevation={0}
          sx={{
            // Gets rid of the borders between Accordions
            "&:before": {
              display: "none",
            },
            "&.Mui-expanded": {
              maxHeight: 150,
            },
          }}
        >
          <AccordionSummary>
            <ListItemButton onClick={() => navigate(item)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </AccordionSummary>
          {item.subnavs && (
            <AccordionDetails sx={{}}>
              <Divider />
              <ListBlock items={item.subnavs} />
            </AccordionDetails>
          )}
        </Accordion>
      ))}
    </List>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: "none" }) }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "ltr" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <ListBlock items={navItems} />
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        {children}
      </Main>
    </Box>
  );
}
