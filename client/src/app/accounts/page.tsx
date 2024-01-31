"use client";

import BasicAccordion from "@/components/BasicAccordion";
import { useAccountsByOwner } from "@/hooks/accountHooks";
import { AccountType } from "@/schemas/account";
import { SYSTEM_USER, convertArrayToRecordOfArrays } from "@/schemas/shared";
import { AccountBalance, CreditCard, Savings } from "@mui/icons-material";
import {
  CircularProgress,
  Container,
  Divider,
  List,
  Stack,
  Typography,
} from "@mui/material";

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccountsByOwner(SYSTEM_USER, {
    sorts: [],
    filters: [],
  });

  const accountIconMap: Record<AccountType, JSX.Element> = {
    Checking: <CreditCard />,
    Savings: <Savings />,
  };

  const institutionAccordions = accounts && (
    <List>
      {Object.entries(
        convertArrayToRecordOfArrays(
          accounts.results,
          (acct) => acct.institution.name
        )
      ).map(([instName, accts]) => (
        <BasicAccordion
          key={instName}
          heading={instName}
          leadingIcon={<AccountBalance />}
        >
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
        </BasicAccordion>
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
