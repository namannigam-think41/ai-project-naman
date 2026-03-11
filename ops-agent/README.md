# Ops Agent (MVP)

Standalone Google ADK service for OpsCopilot flow validation.

## Architecture

- `app/main.py`: FastAPI endpoints
- `app/service.py`: service entrypoints
- `app/investigation_entry.py`: shared external investigation entry
- `app/investigation_flow.py`: end-to-end investigation runtime
- `app/agents/`: 4-stage agent logic + ADK roots
- `app/contracts/`: stage and API contracts
- `app/tools/`: tool contracts, docs search, tool registry
- `adk_app/`: ADK web agent exports

## API

- `GET /health`
- `POST /v1/investigate`

Request:

```json
{
  "request_id": "req-123",
  "session_id": "11111111-1111-1111-1111-111111111111",
  "user_id": 42,
  "query": "Why did incident INC-2026-0001 happen?",
  "incident_key": "INC-2026-0001",
  "service_name": "payment-service"
}
```

Response:

```json
{
  "trace_id": "...",
  "status": "complete",
  "output": {
    "summary": "...",
    "hypotheses": [],
    "similar_incidents": [],
    "evidence": [],
    "owners": [],
    "escalation": [],
    "recommended_actions": [],
    "report": "...",
    "status": "complete"
  },
  "error": null
}
```

## Workflow

`User Query -> OpsCopilotOrchestratorAgent -> ContextBuilderAgent -> IncidentAnalysisAgent (loop) -> ResponseComposerAgent -> Structured JSON`

## Local Run

1. `cd ops-agent`
2. `uv sync`
3. `cp .env.example .env` and set `GOOGLE_API_KEY`
4. `uv run uvicorn app.main:app --reload --port 8010`

Execution note:
- API `/v1/investigate` executes the shared investigation runtime (`run_investigation_pipeline`).
- ADK Web uses the graph-visible `root_agent` export from `adk_app/agent.py`.
- Both paths use the same stage agents and tool contracts.

## ADK Web Run (Manual Testing)

`ops-agent` includes an ADK-web agents directory at `adk_app/` with one
top-level export: `agent.py`.

```bash
cd ops-agent
UV_CACHE_DIR=/tmp/uv-cache uv sync
UV_CACHE_DIR=/tmp/uv-cache uv run adk web adk_app
```

Notes:
- In the ADK selector, choose the single app exported from `adk_app`.
- This uses Gemini model `gemini-2.5-flash` from your `app/core/config.py`.
- Ensure `GOOGLE_API_KEY` is set in `ops-agent/.env` before launching.

## CLI Run

```bash
cd ops-agent
uv run python run_agent.py "Why did incident INC-2026-0001 happen?" --user-id 1 --incident-key INC-2026-0001
```
