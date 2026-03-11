import AddRoundedIcon from "@mui/icons-material/AddRounded";
import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { SessionList } from "@/components/chat/SessionList";
import type { SessionGroup } from "@/types/chat";

interface SidebarProps {
  groups: SessionGroup[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export function Sidebar({
  groups,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
}: SidebarProps) {
  return (
    <Stack
      component="aside"
      sx={{
        width: { xs: "min(90vw, 300px)", lg: 300 },
        flexShrink: 0,
        height: "100%",
        bgcolor: "#060f2a",
        borderRight: "1px solid #1d2a45",
      }}
    >
      <Stack spacing={1.8} sx={{ p: 2.2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: 1,
              bgcolor: "#215adb",
              border: "1px solid rgba(140, 170, 235, 0.3)",
            }}
          />
          <Typography sx={{ color: "#f2f7ff", fontWeight: 700, fontSize: 30 / 2 }}>OpsCopilot</Typography>
        </Stack>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onNewChat}
          sx={{
            bgcolor: "#2160f3",
            color: "#deebff",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "none",
            "&:hover": { bgcolor: "#1e56d8" },
          }}
        >
          New Chat
        </Button>

      </Stack>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2.2 }}>
        <SessionList
          groups={groups}
          activeSessionId={activeSessionId}
          onSelect={onSelectSession}
          onDelete={onDeleteSession}
        />
      </Box>
    </Stack>
  );
}
