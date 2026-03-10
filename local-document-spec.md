# OpsCopilot Local Documentation Build Specification

## 1. Objective
This document defines the build specification for how OpsCopilot local documentation must be structured, synchronized, and indexed for Agentic RAG.

The required workflow is:
1. Author and expand operational source documents in `download/` as `.txt` files.
2. Convert/sync those documents to markdown `.md` files in `ops-agent/resources/`.
3. Maintain JSON indexes in `ops-agent/resources/` so agents can route quickly to relevant documents.
4. Keep source docs and indexes updated in the same change set.

## 2. Canonical Structure

### Source Documents (authoritative content)
`download/`
- `runbooks/*.txt`
- `postmortems/*.txt`
- `architecture docs/*.txt`
- `policies/*.txt`

### Agent Retrieval Documents (RAG-readable markdown)
`ops-agent/resources/`
- `runbooks/*.md`
- `postmortems/*.md`
- `architecture docs/*.md`
- `policies/*.md`

### Agent Routing Indexes (JSON)
`ops-agent/resources/`
- `index.json` (global document index)
- `runbooks/index.json`
- `postmortems/index.json`
- `architecture docs/index.json`
- `policies/index.json`

## 3. Build Flow

### Step A: Update Source Docs
When documentation changes are needed, edit the `.txt` files in `download/` first.

Requirements for source docs:
- Runbooks must include: Service Description, Common Failure Modes, Important Metrics, Investigation Steps, Recovery Steps, Escalation Contacts.
- Postmortems must include: Incident Summary, Timeline, Root Cause, Impact, Mitigation, Lessons Learned.
- Architecture docs must include: Architecture Explanation, Service Relationships, Dependency Chains.
- Policy docs must include: Incident Severity Definitions, Response Process, Escalation Guidelines.

### Step B: Sync to Markdown Resources
Convert/sync each updated `.txt` source into its corresponding `.md` file in `ops-agent/resources/`.

Mapping rule:
- Category and filename intent must remain consistent between `download/` and `resources/`.

Examples:
- `download/runbooks/payment-service-runbook.txt` -> `ops-agent/resources/runbooks/payment-service-runbook.md`
- `download/postmortems/incident-search-outage.txt` -> `ops-agent/resources/postmortems/incident-search-outage.md`

### Step C: Update JSON Indexes
Update global and folder indexes so agents can route without scanning full content first.

Global index (`ops-agent/resources/index.json`) must store a flat `documents[]` list with metadata:
- `id`
- `category`
- `service` (if applicable)
- `file`
- `tags`

Folder indexes (`ops-agent/resources/<category>/index.json`) must store category-scoped document lists with the same metadata shape.

### Step D: Validation
Before finalizing any documentation update:
1. Confirm every expected markdown file exists under `ops-agent/resources/`.
2. Validate every JSON index parses correctly.
3. Confirm all `file` paths referenced in JSON indexes exist.
4. Confirm metadata quality:
   - `id` is stable and machine-friendly.
   - `category` matches folder.
   - `service` is set only when relevant.
   - `tags` are meaningful retrieval signals.

## 4. Agentic RAG Retrieval Contract
Agents must use the following retrieval path:
1. Read `ops-agent/resources/index.json`.
2. Filter/select candidate documents by `category`, `service`, and `tags`.
3. Load the referenced markdown files.
4. Reason over the markdown content for final response.

The baseline mode is single-file markdown documents per resource.

## 5. Future Extension Policy (Large Documents)
If a document becomes too large later, segmented structure may be introduced.

Future optional pattern:
- `resources/<category>/<doc_id>/index.json`
- `resources/<category>/<doc_id>/section_01_*.md`
- `resources/<category>/<doc_id>/section_02_*.md`

Default mode remains one markdown file per document unless segmentation is explicitly enabled.

## 6. Change Management Rules
- Treat `download/` source updates and `ops-agent/resources/` index updates as one atomic documentation change.
- Do not update markdown content without updating JSON indexes when metadata relevance changes.
- Do not update JSON indexes without ensuring referenced markdown files are present and current.

## 7. Completion Checklist
A documentation update is complete only when all checks pass:
- Source `.txt` files updated in `download/`.
- Corresponding `.md` files synced in `ops-agent/resources/`.
- Global `ops-agent/resources/index.json` updated.
- Folder `index.json` files updated.
- JSON parse + path existence validation passed.
