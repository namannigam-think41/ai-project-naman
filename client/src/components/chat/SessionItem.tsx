import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { ButtonBase, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type { ChatSession } from "@/types/chat";

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

const formatLastUpdated = (iso: string): string => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMins = Math.max(0, Math.floor((now - then) / 60000));
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export function SessionItem({ session, isActive, onClick, onDelete }: SessionItemProps) {
  return (
    <ButtonBase
      onClick={() => onClick(session.id)}
      sx={{
        width: "100%",
        py: "10px",
        px: "12px",
        borderRadius: 1.6,
        textAlign: "left",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        border: "1px solid",
        borderColor: isActive ? "rgba(56, 122, 255, 0.38)" : "transparent",
        bgcolor: isActive ? "rgba(33, 90, 219, 0.26)" : "transparent",
        transition: "all 160ms ease",
        "&:hover": {
          bgcolor: "rgba(33, 90, 219, 0.22)",
          borderColor: "rgba(56, 122, 255, 0.34)",
        },
      }}
    >
      <Stack direction="row" spacing={1.2} width="100%" alignItems="flex-start">
        <ChatBubbleOutlineRoundedIcon sx={{ color: "#8ca7d4", fontSize: 18, mt: 0.2 }} />
        <Stack spacing={0.2} minWidth={0} sx={{ flex: 1, pr: 0.6 }}>
          <Tooltip title={session.title} placement="top" arrow>
            <Typography
              variant="body2"
              sx={{
                color: "#c7d6f2",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session.title}
            </Typography>
          </Tooltip>
          <Typography variant="caption" sx={{ color: "#6781b0" }}>
            {formatLastUpdated(session.lastActivityAt)}
          </Typography>
        </Stack>
        <IconButton
          size="small"
          aria-label={`Delete ${session.title}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(session.id);
          }}
          sx={{
            color: "#c9dcff",
            mt: -0.2,
            "&:hover": { color: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" },
          }}
        >
          <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Stack>
    </ButtonBase>
  );
}
