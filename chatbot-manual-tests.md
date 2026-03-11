# OpsCopilot Eval Plan (Golden Dataset via ADK Web)

Use this file to run manual eval sessions in ADK Web and build a repeatable golden dataset for agentic workflow comparison.

## Recommended Session Count

Minimum: **4 sessions**
- 1 DB-focused session
- 1 Docs-focused session
- 1 Memory/Follow-up session
- 1 Guardrail (unrelated) session

Better baseline: **8 sessions**
- Repeat the same 4 sessions twice (Run A / Run B) to measure response variance.

---

## Session 1: Database-Focused (3 questions)

1. `Who owns payment-service and who are the escalation contacts?`
2. `What is the likely root cause of INC-2026-0001? Show supporting evidence refs.`
3. `Compare INC-2026-0001 with similar incidents and summarize what was different.`

Expected capabilities:
- ownership & escalation
- root-cause hypothesis + evidence refs
- historical incident comparison

---

## Session 2: Local-Documents-Focused (3 questions)

4. `How do we troubleshoot payment-service latency, and what immediate mitigation steps should we take?`
5. `What does the incident response policy say for severe incidents?`
6. `Summarize architecture dependencies relevant to payment-service outages.`

Expected capabilities:
- documentation retrieval grounding
- actionable troubleshooting guidance
- policy/architecture synthesis

---

## Session 3: Memory / Follow-up (3 turns)

7. `What is the likely root cause of INC-2026-0001?`
8. `What evidence supports that conclusion?`
9. `Give only top 3 immediate actions now.`

Expected capabilities:
- contextual conversation memory
- follow-up continuity without restating full context
- concise action refinement

---

## Session 4: Guardrails / Not Project Related (2 questions)

10. `Who won the FIFA World Cup in 2018?`
11. `Write a 7-day meal plan for weight loss.`

Expected capabilities:
- safe handling of unrelated questions
- avoid hallucinated project-specific evidence

---

## Step-by-Step Process (ADK Web -> Golden Dataset)

1. **Freeze this test set**
- Use this exact file as `v1`.
- Do not change prompts mid-run.

2. **Run session exports in ADK Web**
- Execute Session 1, 2, 3, 4 separately.
- Export/download each session artifact.

3. **Name artifacts consistently**
- Example:
  - `evals/raw/2026-03-11/session-01-db-run-a.json`
  - `evals/raw/2026-03-11/session-02-docs-run-a.json`
  - `evals/raw/2026-03-11/session-03-memory-run-a.json`
  - `evals/raw/2026-03-11/session-04-guardrail-run-a.json`

4. **Create golden checks per prompt**
- For each prompt store expected constraints, not exact wording:
  - status expectation (`complete`/`inconclusive` allowed set)
  - required fields (`summary`, `recommended_actions`, etc.)
  - required grounding signal (evidence refs/snippets for related queries)

5. **Build comparison file**
- Normalize each Q/A into a comparable record:
  - `id`, `session`, `input`, `output`, `checks`, `pass_fail`

6. **Run second pass (optional but recommended)**
- Repeat 4 sessions as Run B.
- Compare Run A vs Run B for stability.

7. **Use as regression gate**
- After prompt/tool changes, rerun same sessions.
- Diff against golden checks.
- Investigate regressions before shipping.

---

## Scoring Dimensions (Suggested)

- `schema_compliance`
- `factual_correctness`
- `evidence_grounding`
- `actionability`
- `status_appropriateness`
- `memory_continuity` (Session 3 only)
- `guardrail_behavior` (Session 4 only)

Use simple score bands (0/1 or 0/2) per dimension for fast repeatability.
