import { Button, Stack, Typography } from "@mui/material";

interface ChatHeaderProps {
  onLogout: () => void;
}

export function ChatHeader({ onLogout }: ChatHeaderProps) {
  return (
    <Stack
      component="header"
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        px: { xs: 2, md: 2.5 },
        py: 1.1,
        borderBottom: "1px solid #1c2b46",
        bgcolor: "#09142f",
      }}
    >
      <Typography sx={{ color: "#d9e8ff", fontWeight: 700, fontSize: { xs: 16, md: 17 } }}>
        OpsCopilot
      </Typography>
      <Button
        size="small"
        variant="contained"
        onClick={onLogout}
        sx={{
          bgcolor: "#c62828",
          color: "#fff5f5",
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 1.5,
          boxShadow: "none",
          "&:hover": { bgcolor: "#b71c1c" },
        }}
      >
        Logout
      </Button>
    </Stack>
  );
}
