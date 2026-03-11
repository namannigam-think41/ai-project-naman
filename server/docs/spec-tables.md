# OpsCopilot Server Presentation Spec

## Goal
Add a server-side presentation layer that converts `ops-agent` structured outputs into UI-friendly blocks (text, tables, lists, callouts) without changing investigation reasoning.

This improves readability in frontend while keeping facts grounded in agent output.

## Non-Goals
- No change to `ops-agent` retrieval/reasoning flow.
- No new LLM call for formatting in Phase 1.
- No frontend business logic for deciding table vs text.

## Current Flow
`Frontend -> Server chat API -> Ops-agent /v1/investigate -> Server persists + returns assistant_message`

Server currently passes `structured_json` mostly as-is from `ops-agent`.

## Proposed Flow
`Frontend -> Server chat API -> Ops-agent -> ResponsePresenter (server) -> persist + return enriched structured_json`

`ResponsePresenter` is deterministic and runs inside server service layer.

## Data Contract Additions
Keep existing `structured_json` fields (`summary`, `hypotheses`, `evidence`, etc.).
Add optional `presentation` object:

```json
{
  "presentation": {
    "status_badge": {"value": "complete", "tone": "success"},
    "status_reason": "Sufficient evidence was found across docs and incident data.",
    "highlights": ["..."],
    "blocks": [
      {"type": "markdown", "title": "Summary", "content": "..."},
      {
        "type": "table",
        "title": "Hypotheses",
        "columns": ["Cause", "Confidence", "Evidence Refs"],
        "rows": [["...", "0.7", "event_2, incident_payment_latency"]]
      },
      {
        "type": "table",
        "title": "Evidence",
        "columns": ["Ref", "Source", "Snippet"],
        "rows": [["event_1", "db", "..."]]
      },
      {
        "type": "list",
        "title": "Recommended Actions",
        "items": ["..."]
      }
    ]
  }
}
```

## Table/Text Decision Rules (Phase 1)
Deterministic rules:

1. Always show:
- `status_badge`
- `status_reason`
- `summary` block

2. Render as table when:
- dataset has >= 2 items
- each item has predictable keys

3. Render as list when:
- item shape is a simple string array (`recommended_actions`)

4. Render as markdown text when:
- narrative field (`report`)
- no tabular consistency

5. Status reason mapping:
- `complete`: evidence/hypotheses present and no fatal error
- `inconclusive`: missing evidence or agent returned inconclusive
- `error`: transport/tool/runtime failure
- `not_found`: requested incident/service not found

## Mapping Rules

### Hypotheses Table
- Source: `structured_json.hypotheses`
- Columns: `Cause`, `Confidence`, `Evidence Refs`

### Evidence Table
- Source: `structured_json.evidence`
- Columns: `Ref`, `Source`, `Snippet`

### Owners & Escalation Tables
- Source: `structured_json.owners`, `structured_json.escalation`

### Recommended Actions
- Source: `structured_json.recommended_actions`
- Type: ordered list (or table in future if action schema becomes objects)

### Report
- Source: `structured_json.report`
- Type: markdown block

## Server Changes

1. New module:
- `server/app/services/presentation.py`
- Function:
  - `build_presentation(structured: dict[str, object]) -> dict[str, object]`

2. Integrate in chat flow:
- In `create_chat_turn(...)`, after `assistant_structured` is returned from ops-agent:
  - enrich with `presentation`
  - persist enriched payload in `messages.structured_json`

3. API schema:
- No breaking change needed (`structured_json` already accepts dict)

## Frontend Rendering Plan
Frontend reads `assistant_message.structured_json.presentation.blocks` if present.
Fallback to current rendering when `presentation` is absent.

## Backward Compatibility
- Existing clients remain compatible.
- New `presentation` field is additive and optional.

## Error Handling
- If presenter fails, log warning and return original `structured_json`.
- Never fail chat turn due to presentation logic.

## Security and Trust
- Presenter must not invent new facts.
- Presenter can only reshape existing fields.
- Keep raw `structured_json` from ops-agent intact for auditability.

## Testing Plan

### Unit Tests
- `build_presentation` for:
  - complete response
  - inconclusive response
  - error payload response
  - missing optional fields

### Integration Tests
- POST chat message returns `assistant_message.structured_json.presentation`.
- Existing behavior still works when `presentation` disabled/fails.

## Rollout

### Phase 1
- Deterministic presenter, no LLM.
- Enable by default for chat API.

### Phase 2 (optional)
- Add optional LLM polish step for wording only (no factual mutation).

## Acceptance Criteria
1. Chat responses include `presentation.status_reason` and `presentation.blocks`.
2. Hypotheses and evidence are shown in table blocks when possible.
3. Existing summary/report/recommended_actions remain unchanged semantically.
4. No regression in chat turn success rate.
5. No additional external dependency required for Phase 1.
