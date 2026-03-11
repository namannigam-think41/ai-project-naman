import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useState } from "react";
import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isUser = message.role === "user";
  const structured = !isUser && message.structuredJson ? message.structuredJson : null;

  const hypotheses = Array.isArray(structured?.hypotheses) ? structured.hypotheses : [];
  const actions = Array.isArray(structured?.recommended_actions)
    ? structured.recommended_actions
    : [];
  const evidence = Array.isArray(structured?.evidence) ? structured.evidence : [];
  const presentation = getPresentation(structured);
  const presentationBlocks = Array.isArray(presentation?.blocks) ? presentation.blocks : [];
  const hasPresentationBlocks = presentationBlocks.length > 0;
  const hasFallbackDetails = !hasPresentationBlocks && (hypotheses.length > 0 || evidence.length > 0);
  const shouldShowDetailsToggle = hasPresentationBlocks
    ? presentationBlocks.some((block) => isHiddenByDefault(block))
    : hasFallbackDetails;
  const visiblePresentationBlocks = hasPresentationBlocks
    ? showDetails
      ? presentationBlocks
      : presentationBlocks.filter((block) => !isHiddenByDefault(block))
    : [];

  return (
    <Stack alignItems={isUser ? "flex-end" : "flex-start"} sx={{ width: "100%", mb: 2.25 }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: isUser ? { xs: "92%", md: 700 } : 700,
          width: "100%",
          px: 2,
          py: 1.5,
          borderRadius: 2.2,
          bgcolor: isUser ? "#2160f3" : "#112449",
          color: isUser ? "#ecf4ff" : "#d7e8ff",
          border: "1px solid",
          borderColor: isUser ? "#3d73e7" : "#29406a",
        }}
      >
        {isUser || !hasPresentationBlocks ? (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {message.content}
          </Typography>
        ) : null}

        {structured ? (
          <Stack spacing={1.2} sx={{ mt: 1.4 }}>
            {hasPresentationBlocks ? (
              <Stack spacing={1}>
                {visiblePresentationBlocks.map((block, idx) => (
                  <PresentationBlock key={`blk-${idx}`} block={block} />
                ))}
              </Stack>
            ) : null}

            {!hasPresentationBlocks && showDetails && hypotheses.length > 0 ? (
              <Stack spacing={0.35}>
                <Typography variant="caption" sx={{ color: "#9fc0f7", fontWeight: 700 }}>
                  Hypotheses
                </Typography>
                {hypotheses.slice(0, 3).map((item, idx) => {
                  const cause =
                    item && typeof item === "object" && "cause" in item
                      ? String(item.cause ?? "")
                      : "";
                  if (!cause) {
                    return null;
                  }
                  return (
                    <Typography key={`hyp-${idx}`} variant="caption" sx={{ color: "#cfe2ff" }}>
                      {idx + 1}. {cause}
                    </Typography>
                  );
                })}
              </Stack>
            ) : null}

            {!hasPresentationBlocks && actions.length > 0 ? (
              <Stack spacing={0.35}>
                <Typography variant="caption" sx={{ color: "#9fc0f7", fontWeight: 700 }}>
                  Recommended Actions
                </Typography>
                {actions.slice(0, 5).map((item, idx) => (
                  <Typography key={`act-${idx}`} variant="caption" sx={{ color: "#cfe2ff" }}>
                    {idx + 1}. {String(item)}
                  </Typography>
                ))}
              </Stack>
            ) : null}

            {!hasPresentationBlocks && showDetails && evidence.length > 0 ? (
              <Stack spacing={0.35}>
                <Typography variant="caption" sx={{ color: "#9fc0f7", fontWeight: 700 }}>
                  Evidence
                </Typography>
                {evidence.slice(0, 4).map((item, idx) => {
                  const snippet =
                    item && typeof item === "object" && "snippet" in item
                      ? String(item.snippet ?? "")
                      : "";
                  if (!snippet) {
                    return null;
                  }
                  return (
                    <Typography key={`ev-${idx}`} variant="caption" sx={{ color: "#cfe2ff" }}>
                      {idx + 1}. {snippet}
                    </Typography>
                  );
                })}
              </Stack>
            ) : null}

            {shouldShowDetailsToggle ? (
              <Button
                size="small"
                variant="text"
                onClick={() => setShowDetails((prev) => !prev)}
                sx={{
                  width: "fit-content",
                  px: 0,
                  minWidth: "auto",
                  color: "#9fc0f7",
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "transparent", color: "#c9dcff" },
                }}
              >
                {showDetails ? "Hide details" : "Show details"}
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Paper>
    </Stack>
  );
}

function getPresentation(structured: Record<string, unknown> | null) {
  if (!structured) {
    return null;
  }
  const value = structured.presentation;
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function PresentationBlock({ block }: { block: unknown }) {
  if (!block || typeof block !== "object") {
    return null;
  }
  const typed = block as Record<string, unknown>;
  const title = typeof typed.title === "string" ? typed.title : "";
  const type = typeof typed.type === "string" ? typed.type : "";

  if (type === "markdown") {
    const content = typeof typed.content === "string" ? typed.content : "";
    if (!content) {
      return null;
    }
    return (
      <Stack spacing={0.35}>
        {title ? (
          <Typography variant="caption" sx={{ color: "#9fc0f7", fontWeight: 700 }}>
            {title}
          </Typography>
        ) : null}
        <Typography variant="caption" sx={{ color: "#cfe2ff", whiteSpace: "pre-wrap" }}>
          {formatDisplayText(content)}
        </Typography>
      </Stack>
    );
  }

  if (type === "list") {
    const items = Array.isArray(typed.items) ? typed.items : [];
    if (items.length === 0) {
      return null;
    }
    return (
      <Stack spacing={0.35}>
        {title ? (
          <Typography variant="caption" sx={{ color: "#9fc0f7", fontWeight: 700 }}>
            {title}
          </Typography>
        ) : null}
        {items.slice(0, 8).map((item, idx) => (
          <Typography key={`lst-${idx}`} variant="caption" sx={{ color: "#cfe2ff" }}>
            {idx + 1}. {formatDisplayText(String(item))}
          </Typography>
        ))}
      </Stack>
    );
  }

  if (type === "table") {
    const columns = Array.isArray(typed.columns) ? typed.columns : [];
    const rows = Array.isArray(typed.rows) ? typed.rows : [];
    if (columns.length === 0 || rows.length === 0) {
      return null;
    }
    return (
      <Stack spacing={0.45}>
        {title ? (
          <Typography variant="caption" sx={{ color: "#9fc0f7", fontWeight: 700 }}>
            {title}
          </Typography>
        ) : null}
        <TableContainer
          sx={{
            border: "1px solid #2b436e",
            borderRadius: 1.2,
            overflowX: "auto",
            bgcolor: "#0e213f",
          }}
        >
          <Table size="small" sx={{ minWidth: 360 }}>
            <TableHead>
              <TableRow>
                {columns.map((col, idx) => (
                  <TableCell
                    key={`col-${idx}`}
                    sx={{
                      color: "#9fc0f7",
                      borderColor: "#29406a",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      py: 0.65,
                    }}
                  >
                    {String(col)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(0, 8).map((row, ridx) => {
                const cells = Array.isArray(row) ? row : [];
                return (
                  <TableRow key={`row-${ridx}`}>
                    {columns.map((_c, cidx) => (
                      <TableCell
                        key={`cell-${ridx}-${cidx}`}
                        sx={{
                          color: "#cfe2ff",
                          borderColor: "#29406a",
                          fontSize: "0.72rem",
                          py: 0.55,
                          verticalAlign: "top",
                        }}
                        >
                        {cells[cidx] !== undefined && cells[cidx] !== null
                          ? formatDisplayText(String(cells[cidx]))
                          : ""}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  }

  return null;
}

function formatDisplayText(value: string): string {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\r\n/g, "\n")
    .trim();
}

function isHiddenByDefault(block: unknown): boolean {
  if (!block || typeof block !== "object") {
    return false;
  }
  const typed = block as Record<string, unknown>;
  const title = typeof typed.title === "string" ? typed.title.toLowerCase() : "";
  return title === "hypotheses" || title === "evidence" || title === "report";
}
