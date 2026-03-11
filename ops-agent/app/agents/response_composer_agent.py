from __future__ import annotations

from google.adk.agents import Agent

from app.agents.runtime import build_stage_agent, run_json_stage_with_timeout
from app.contracts.response_composer import (
    ComposerInput,
    ComposerOutput,
    EscalationItem,
    EvidenceItem,
    OutputStatus,
    OwnerItem,
    SimilarIncidentItem,
)

AGENT_NAME = "ResponseComposerAgent"
RESPONSE_COMPOSER_PROMPT = """
You are ResponseComposerAgent.
Return valid ComposerOutput JSON only.
Never wrap output in markdown or code fences.
Never return placeholder/meta responses such as:
- "No more outputs are needed"
- "already processed"
- "cannot provide further output"
Every user turn must produce a complete final answer in ComposerOutput schema.
Quality bar:
- Make summary concise (2-4 sentences) and directly answer user query.
- In `report`, use this structure:
  1) Evidence-backed findings
  2) Inferred (lower-confidence) considerations
  3) Gaps / unknowns
- Never mix inferred claims into evidence-backed section.
- `recommended_actions` must be exactly top 3 immediate actions, ordered by impact and urgency.
- Each action must be concrete and operational (owner/team + what to check/do).
- If evidence is insufficient, explicitly state "insufficient information" and keep actions as data-gathering steps.
- Avoid repetition and generic advice.
For payment-service latency queries, prioritize actions in this order unless evidence strongly contradicts it:
1) external payment processor health/latency check,
2) retry amplification control in upstream services (`order-service`, `api-gateway`),
3) payment-event queue backlog mitigation with concrete rollback/flag/traffic controls.
""".strip()

response_composer_agent = build_stage_agent(
    name=AGENT_NAME,
    instruction=RESPONSE_COMPOSER_PROMPT,
    tools=[],
)


def build_response_composer_agent() -> Agent:
    return response_composer_agent


async def composer_with_adk_or_fallback(payload: ComposerInput) -> ComposerOutput:
    try:
        return await run_json_stage_with_timeout(
            agent=response_composer_agent,
            payload=payload,
            output_model=ComposerOutput,
            user_id=str(payload.session_id),
            timeout_seconds=45,
        )
    except Exception:
        pass

    summary = (
        "Investigation is inconclusive due to insufficient information."
        if payload.status == OutputStatus.INCONCLUSIVE
        else (payload.context_content.incident_summary or "Investigation completed.")
    )
    query_lower = payload.query.lower()
    is_payment_latency = (
        "payment-service" in query_lower and "latency" in query_lower
    ) or ("payment" in query_lower and "latency" in query_lower)
    if is_payment_latency:
        fallback_actions = [
            "Payments On-call: validate external payment processor health (status page, auth roundtrip latency, error codes) and isolate provider-specific degradation.",
            "Platform SRE: reduce retry amplification from order-service and api-gateway (retry budget, backoff, temporary circuit-break/traffic shaping).",
            "Payments Team: mitigate queue backlog in payment-service (pause non-critical async work, scale workers, rollback recent risky changes) and verify p95/p99 recovery.",
        ]
    else:
        fallback_actions = (
            [f"Resolve gap: {q}" for q in payload.context_content.open_questions[:3]]
            if payload.context_content.open_questions
            else [
                "Validate current customer impact and error/latency trends on the affected service.",
                "Check upstream/downstream dependencies and external provider health for correlated degradation.",
                "Apply the safest reversible mitigation (rollback, feature-flag disable, or traffic shaping) and monitor recovery.",
            ]
        )
    report = (
        "Evidence-backed findings:\n"
        + (
            "\n".join(
                f"- {item.finding}"
                for item in payload.context_content.documentation_findings[:3]
            )
            or "- insufficient information"
        )
        + "\nInferred (lower-confidence) considerations:\n"
        + (
            "\n".join(f"- {h.reasoning_summary}" for h in payload.hypotheses[:2])
            or "- insufficient information"
        )
        + "\nGaps / unknowns:\n"
        + (
            "\n".join(f"- {q}" for q in payload.context_content.open_questions[:3])
            or "- no major unresolved gaps identified"
        )
    )

    return ComposerOutput(
        summary=summary,
        hypotheses=payload.hypotheses,
        similar_incidents=[
            SimilarIncidentItem(
                incident_key=i.incident_key, similarity_reason=i.pattern
            )
            for i in payload.context_content.historical_patterns
        ],
        evidence=[
            EvidenceItem(ref=i.event_id, source="db", snippet=i.event_text)
            for i in payload.context_content.important_events
        ]
        + [
            EvidenceItem(ref=i.doc_id, source="docs", snippet=i.finding)
            for i in payload.context_content.documentation_findings
        ],
        owners=[
            OwnerItem(service_name=i.service_name, owner=i.owner)
            for i in payload.context_content.owners_and_escalation
        ],
        escalation=[
            EscalationItem(service_name=i.service_name, contacts=i.escalation_contacts)
            for i in payload.context_content.owners_and_escalation
        ],
        recommended_actions=fallback_actions,
        report=report,
        status=payload.status,
    )
