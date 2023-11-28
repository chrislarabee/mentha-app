"use client";

import { useAccountsByOwner } from "@/hooks/accountHooks";
import { AccountType } from "@/schemas/account";
import { SYSTEM_USER, convertArrayToRecordOfArrays } from "@/schemas/shared";
import {
  AccountBalance,
  CreditCard,
  ExpandMore,
  Savings,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  CircularProgress,
  Container,
  Divider,
  List,
  Stack,
  Typography,
} from "@mui/material";

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccountsByOwner(SYSTEM_USER);

  const accountIconMap: Record<AccountType, JSX.Element> = {
    Checking: <CreditCard />,
    Savings: <Savings />,
  };

  const institutionAccordions = accounts && (
    <List>
      {Object.entries(
        convertArrayToRecordOfArrays(accounts, (acct) => acct.institution.name)
      ).map(([instName, accts]) => (
        <Accordion key={instName} disableGutters>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" spacing={1}>
              <AccountBalance />
              <Typography variant="subtitle1">{instName}</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              <Container>
                <Stack>
                  <Typography variant="subtitle2">Accounts</Typography>
                  <Divider />
                  {accts.map((acct) => (
                    <Stack
                      key={acct.id}
                      direction="row"
                      spacing={2}
                      alignItems="center"
                    >
                      {accountIconMap[acct.accountType]}
                      <Typography variant="caption">{acct.name}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Container>
              <Divider />
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </List>
  );

  const spinner = isLoading && <CircularProgress />;

  return (
    <Container>
      <Stack>{spinner || institutionAccordions}</Stack>
    </Container>
  );
}
