# Vigil — Incident Response & Post-Mortem Agent

## Product Requirements Document (PRD)

**Track:** Incident Response & Post-Mortem Agent
**Hackathon:** HiDevs × Mastra Championship Arena — Round 1
**Stack:** TypeScript · Mastra · Qdrant · Enkrypt AI

---

## 1. Problem Statement

When production systems fail, on-call engineers face a compounding crisis: thousands of log lines, no clear signal, mounting pressure, and the constant risk of applying a fix that widens the blast radius. Today, incident response depends on tribal knowledge trapped in individual heads, runbooks that nobody reads at 2 AM, and post-mortems that are written too late and forgotten immediately.

The result is predictable — the same incidents repeat, mean-time-to-resolution (MTTR) stays high, and dangerous remediations get executed under pressure without adequate review.

**The core insight Vigil is built on:** A confidently wrong root cause during an outage is worse than no answer at all. Most AI copilots generate plausible-sounding explanations without grounding them in evidence, and suggest fixes without evaluating whether those fixes could make things worse. Vigil is structurally designed so that neither of these failure modes can reach the engineer.

---

## 2. Solution Overview

Vigil is a production-grade AI agent that assists on-call engineers during incidents. It ingests alerts and logs, identifies anomalies, retrieves similar past incidents from institutional memory, generates evidence-grounded root-cause hypotheses, proposes safe remediations with blast-radius estimates, and automatically produces structured post-mortem reports.

**What makes Vigil different from a generic AI chatbot bolted onto logs:**

- Every root-cause hypothesis must cite specific log evidence or past incident data. Hypotheses that fail Enkrypt AI's grounding validation are silently dropped — the engineer never sees an ungrounded guess.
- Every proposed remediation is checked against a destructive-action policy before it reaches the engineer. Dangerous actions (data deletion, disabling authentication, scaling critical services to zero) are blocked or escalated — never auto-executed.
- Every resolved incident is written back into Qdrant's vector memory, creating a compounding institutional knowledge base. The system gets measurably smarter with each outage it handles.

---

## 3. Why Each Tool Is Load-Bearing (Remove Any One and the Product Collapses)

### Mastra — Orchestration & Workflow Engine

Mastra powers the 8-step `incidentResponseWorkflow`, managing state transitions, branching logic at decision gates, and critically, the `suspend/resume` pattern for human-in-the-loop approval. Without Mastra, there is no structured workflow — just disconnected API calls with no state management, no branching, and no way to pause for human approval before executing a dangerous fix.

**Specific Mastra capabilities used:**
- Sequential workflow with conditional branching at decision nodes
- Workflow suspend/resume for human-in-the-loop gates
- Mastra Tools: `searchIncidents`, `searchRunbooks`, `searchLogs`, `estimateBlastRadius`, `createPostmortem`, `notifyOnCall`
- Model routing for LLM access (embeddings + reasoning)
- Memory integration with Qdrant via `@mastra/rag`

### Qdrant — Institutional Memory & Semantic Retrieval

Qdrant stores and retrieves the four categories of knowledge that make Vigil's recommendations grounded rather than hallucinated. Without Qdrant, Vigil has no memory of past incidents, no access to runbooks, and no ability to say "this looks like the database outage from three weeks ago." It becomes a stateless chatbot that treats every incident as if it's the first one ever.

**Four Qdrant collections (detailed schemas in Section 6):**
- `incidents` — historical resolved incidents with embedded summaries
- `log_chunks` — embedded windows of logs from the active incident (short TTL)
- `runbooks` — known remediation procedures with applicability metadata
- `postmortems` — generated post-mortem reports linked to incidents

**Search patterns used:**
- Hybrid search (dense vector + keyword) for incident similarity matching
- Semantic retrieval for runbook lookup based on symptom patterns
- Filtered search using payload metadata (severity, service, root_cause_category)

### Enkrypt AI — Safety Guardrails & Output Validation

Enkrypt AI enforces the two properties that make Vigil trustworthy during a real outage: no ungrounded reasoning reaches the engineer, and no dangerous action executes without human sign-off. Without Enkrypt, Vigil is an unguarded AI that could confidently present a hallucinated root cause or auto-recommend dropping a production database — exactly the failure mode that makes AI tools dangerous in incident response.

**Three Enkrypt AI policies:**
1. **Grounding Gate (Step 4):** Validates that each root-cause hypothesis is backed by cited evidence from `log_chunks` and/or `incidents`. Ungrounded hypotheses are dropped. If zero hypotheses pass, the workflow escalates to the human engineer rather than presenting garbage.
2. **Destructive-Action Policy (Step 6):** Checks proposed remediations against a blocklist of dangerous operations (data deletion, dropping tables, scaling critical services to zero, disabling authentication, modifying access controls). Flagged actions require explicit human approval via workflow suspend/resume.
3. **Output Quality Evaluation:** Scores the quality and completeness of generated post-mortems and remediation plans before they reach the engineer, ensuring actionable and well-structured outputs.

---

## 4. Mastra Workflow — `incidentResponseWorkflow`

The workflow executes as a sequential pipeline with two conditional branches at the Enkrypt decision gates.

### Step 1: Ingest & Detect

- **Trigger:** Incoming alert from PagerDuty webhook or manual log paste
- **Input:** Raw alert payload + log stream (fetched via Splunk API / Mastra tool `searchLogs`)
- **Process:** Chunk logs into overlapping windows (512 tokens, 128-token overlap), generate embeddings, write to Qdrant `log_chunks` collection. Run anomaly detection to identify the incident signature (affected services, error patterns, timing).
- **Output:** `IncidentSignature` object containing `affected_services[]`, `primary_error_pattern`, `anomaly_start_timestamp`, `severity_estimate`
- **Qdrant interaction:** WRITE → `log_chunks`

### Step 2: Retrieve Similar

- **Input:** `IncidentSignature` from Step 1
- **Process:** Hybrid search across Qdrant `incidents` collection using the incident signature embedding + metadata filters (matching `services_affected`, `severity`). Parallel search across `runbooks` collection filtered by `applies_to_services` and `symptom_pattern`.
- **Output:** Top-K similar past incidents (with similarity scores) + matching runbooks
- **Qdrant interaction:** READ → `incidents`, READ → `runbooks`

### Step 3: Grounded Root Cause

- **Input:** `IncidentSignature` + `log_chunks` + similar past incidents
- **Process:** LLM generates ranked root-cause hypotheses. Each hypothesis MUST include: (a) a natural-language explanation, (b) specific cited evidence — log chunk IDs and/or past incident IDs that support it, (c) a confidence score, (d) the root_cause_category tag.
- **Output:** `RankedHypotheses[]` — each with citations, confidence, and category
- **Qdrant interaction:** READ → `log_chunks` (for citation retrieval)
- **Dashboard interaction:** PUSH → ranked causes with citations displayed to engineer

### Step 4: Enkrypt Grounding Gate (Decision Node)

- **Input:** `RankedHypotheses[]`
- **Process:** Each hypothesis is passed through Enkrypt AI's hallucination/grounding detection. Enkrypt validates that every cited evidence reference actually exists and supports the claim. Hypotheses that fail are dropped.
- **Branch A (grounded hypotheses exist):** Pass surviving hypotheses to Step 5.
- **Branch B (zero hypotheses pass):** Workflow SUSPENDS. Engineer is notified via Slack ("Vigil could not identify a grounded root cause — manual investigation required"). Workflow resumes when engineer provides manual input or new data arrives.
- **Enkrypt policy:** Grounding / hallucination detection

### Step 5: Propose Remediation

- **Input:** Grounded hypotheses + matching runbooks
- **Process:** Draft a remediation plan sourced from runbooks where available, synthesized from reasoning where not. Compute a blast-radius estimate using the `estimateBlastRadius` tool — which services are affected, what's the rollback path, is this reversible?
- **Output:** `RemediationPlan` containing `steps[]`, `blast_radius_score` (0-100), `affected_services[]`, `rollback_procedure`, `requires_approval: boolean`
- **Dashboard interaction:** PUSH → proposed fix with blast-radius visualization

### Step 6: Enkrypt Safety Gate (Decision Node)

- **Input:** `RemediationPlan`
- **Process:** Enkrypt AI checks the plan against the destructive-action policy. Scans for: data deletion commands, DROP TABLE/collection operations, scaling services to zero replicas, disabling authentication or access controls, modifying production secrets, and any action without a rollback path.
- **Branch A (safe — no destructive actions, blast_radius_score < 40):** Pass to Step 7 with `auto_approvable: true`.
- **Branch B (risky — destructive actions detected OR blast_radius_score ≥ 40):** Flag for mandatory human approval. Workflow SUSPENDS. Engineer receives the plan with highlighted risk factors.
- **Enkrypt policy:** Destructive-action policy + output safety scoring

### Step 7: Human Approval

- **Input:** `RemediationPlan` + safety status from Step 6
- **Process:** Workflow is in SUSPENDED state. Engineer reviews the plan on the Vigil Dashboard — sees the grounded root causes with citations, the proposed fix, blast-radius estimate, and Enkrypt safety status. Engineer clicks Approve or Reject.
- **On Approve:** Workflow RESUMES → Step 8. Remediation is logged as "engineer-approved."
- **On Reject:** Engineer provides rejection reason + optional alternative action. Workflow can loop back to Step 5 with the engineer's input as additional context, or terminate.
- **Notification:** Slack SDK `notifyOnCall` tool sends the approval request with a deep link to the dashboard.

### Step 8: Generate Post-Mortem

- **Input:** Full incident context — signature, root causes, remediation applied, approval log, resolution time
- **Process:** LLM generates a structured post-mortem document following a standard template: incident summary, timeline, root cause analysis, remediation actions taken, what worked / what didn't, follow-up action items, prevention recommendations.
- **Post-generation:** Enkrypt AI output evaluation scores the post-mortem for completeness and quality before it's finalized.
- **Output:** Structured `PostMortem` document
- **Qdrant interaction:** WRITE → `postmortems` (the report itself), UPSERT → `incidents` (update the incident record with actual resolution data, what remediation worked, final root cause)
- **Dashboard interaction:** PUSH → display completed post-mortem
- **Feedback loop:** This write-back is what makes the system self-improving. The next time Step 2 runs for a similar alert, it retrieves this resolved incident — including what actually worked — making future recommendations more accurate.

---

## 5. Mastra Tools

| Tool Name | Purpose | Used In Step(s) |
|---|---|---|
| `searchLogs` | Fetch raw logs from Splunk/external source | 1. Ingest & Detect |
| `searchIncidents` | Hybrid search Qdrant incidents collection | 2. Retrieve Similar |
| `searchRunbooks` | Semantic search Qdrant runbooks collection | 2. Retrieve Similar |
| `estimateBlastRadius` | Compute blast-radius score for a remediation plan | 5. Propose Remediation |
| `createPostmortem` | Generate and store structured post-mortem | 8. Generate Post-Mortem |
| `notifyOnCall` | Send Slack notification with dashboard deep link | 7. Human Approval |

---

## 6. Qdrant Collection Schemas

### `incidents`

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Unique incident identifier |
| `summary_embedding` | vector (1536d) | Embedded incident summary for similarity search |
| `summary` | string | Natural-language incident summary |
| `services_affected` | string[] | Services involved in the incident |
| `symptoms` | string[] | Observable symptoms (error types, metric anomalies) |
| `root_cause_category` | string | Categorized root cause (e.g., "connection_pool", "memory_leak", "config_drift") |
| `remediation_applied` | string | What fix was actually used |
| `remediation_worked` | boolean | Whether the applied fix resolved the issue |
| `mttr_minutes` | number | Time from detection to resolution |
| `severity` | enum (P1-P4) | Incident severity level |
| `created_at` | timestamp | When the incident occurred |
| `postmortem_id` | string | Reference to the linked post-mortem |

### `log_chunks`

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Chunk identifier |
| `chunk_embedding` | vector (1536d) | Embedded log window |
| `raw_text` | string | Raw log content |
| `incident_id` | string | Parent incident reference |
| `service` | string | Source service |
| `timestamp_start` | timestamp | Window start time |
| `timestamp_end` | timestamp | Window end time |
| `ttl` | number | Auto-expiry in hours (default: 72) |

### `runbooks`

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Runbook identifier |
| `content_embedding` | vector (1536d) | Embedded procedure content |
| `title` | string | Runbook title |
| `applies_to_services` | string[] | Services this runbook covers |
| `symptom_pattern` | string | What symptoms trigger this runbook |
| `steps` | string[] | Ordered remediation steps |
| `risk_level` | enum (low/medium/high/critical) | Risk assessment of this procedure |
| `requires_approval` | boolean | Whether this runbook mandates human sign-off |
| `last_used` | timestamp | Last time this runbook was applied |
| `success_rate` | number | Historical success percentage |

### `postmortems`

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Post-mortem identifier |
| `content_embedding` | vector (1536d) | Embedded post-mortem for search |
| `incident_id` | string | Linked incident |
| `full_text` | string | Complete post-mortem document |
| `action_items` | string[] | Follow-up tasks extracted |
| `prevention_recommendations` | string[] | How to prevent recurrence |
| `created_at` | timestamp | Generation timestamp |
| `quality_score` | number | Enkrypt output evaluation score |

---

## 7. Edge Cases & Failure Handling

### Cold Start (No Similar Incidents)

When the `incidents` collection is empty or no similar incident scores above the similarity threshold (cosine similarity < 0.65), Vigil does not fabricate history. Step 2 returns an empty result set, and Step 3 generates hypotheses grounded solely in the current `log_chunks`. The system explicitly communicates to the engineer: "No similar past incidents found — analysis is based on current logs only." This is honest and safe.

**Mitigation:** Pre-seed the `incidents` and `runbooks` collections with synthetic incident data and standard operating procedures during onboarding.

### Conflicting Evidence

When log data contains contradictory signals (e.g., service A reports upstream timeout while service B shows healthy responses), Vigil generates multiple hypotheses with separate citation chains. The Grounding Gate validates each independently. The engineer sees competing explanations with their evidence, rather than a single forced conclusion.

### Poisoned or Adversarial Logs

If malicious or corrupted log data is ingested (e.g., injected false error patterns), the Grounding Gate serves as a defense layer — hypotheses based on evidence that contradicts the broader pattern will score lower on grounding validation. Additionally, the destructive-action policy in Step 6 prevents any log-injection attack from triggering a dangerous automated response.

### All Hypotheses Fail Grounding

If the Grounding Gate drops every hypothesis, the workflow does not proceed with an empty analysis. It suspends and explicitly escalates: "Unable to identify a grounded root cause. Manual investigation required." This is the correct failure mode — silence over confabulation.

### Tool/External Service Failure

If Splunk, PagerDuty, or the LLM provider is unreachable, the workflow fails gracefully with a clear error state and Slack notification. Vigil never falls back to "best-effort" reasoning without data — an ungrounded guess during an outage is dangerous.

### Engineer Rejects Remediation

The workflow supports a reject-and-revise loop. The engineer's rejection reason is fed back as additional context, and Step 5 can re-run with the engineer's input. The system learns from rejections: if a runbook-based fix is consistently rejected, its `success_rate` degrades over time.

---

## 8. Success Metrics

| Metric | Definition | Target |
|---|---|---|
| **MTTR Reduction** | Mean-time-to-resolution with Vigil vs. baseline | ≥ 40% reduction |
| **Grounding Rate** | % of presented root-cause hypotheses that pass Enkrypt grounding validation | ≥ 95% |
| **Safety Catch Rate** | % of destructive/unsafe remediations blocked or escalated by Safety Gate | 100% (zero unsafe auto-executions) |
| **Retrieval Precision@5** | Relevance of top-5 similar incidents returned by Qdrant | ≥ 0.80 |
| **Post-Mortem Completeness** | Enkrypt output evaluation score for generated post-mortems | ≥ 85/100 |
| **Feedback Loop Impact** | Improvement in Retrieval Precision@5 after N resolved incidents | Measurable improvement after 20+ incidents |
| **Engineer Trust Score** | % of proposed remediations approved (vs. rejected) by engineers | ≥ 75% approval rate |

---

## 9. Evaluation Plan

### Synthetic Incident Dataset

Create a dataset of 50–100 labeled synthetic incidents spanning common categories: database connection exhaustion, memory leaks, configuration drift, certificate expiry, DNS resolution failures, upstream service degradation, and deployment rollback scenarios. Each incident includes: synthetic log data, known root cause, expected similar incidents, and correct remediation from runbooks.

**Purpose:** Measure Retrieval Precision@5, root-cause accuracy, and end-to-end MTTR on reproducible scenarios.

### Red-Team Safety Test Suite

Create 20–30 adversarial test cases designed to trigger unsafe behavior:
- Remediations that involve data deletion or table drops
- Fixes that disable authentication or modify access controls
- Scaling operations that reduce critical services to zero replicas
- Rollback procedures with no rollback path
- Injected log patterns designed to mislead root-cause analysis

**Purpose:** Validate that the Safety Gate catches 100% of destructive actions and that the Grounding Gate rejects hypotheses based on adversarial inputs.

### Baseline Comparison

Compare Vigil-assisted incident resolution against a control group (manual resolution without AI assistance) on the synthetic dataset. Measure MTTR, accuracy of root cause identification, and whether the applied fix actually resolved the issue.

---

## 10. User Interface — Vigil Dashboard

The Vigil Dashboard is a React-based web application (TypeScript, React, Tailwind CSS) served through the API Gateway. It provides the on-call engineer with a single-pane view of the active incident.

### Dashboard Sections

- **Incident Summary:** Detected anomaly, affected services, severity, timeline
- **Root Cause Analysis:** Ranked hypotheses with confidence scores and expandable citation panels (clicking a citation shows the exact log chunk or past incident it references)
- **Proposed Remediation:** Step-by-step fix, blast-radius score with visual indicator (green/yellow/red), affected services, rollback procedure
- **Safety Status:** Enkrypt validation badge — "Grounded ✓" / "Safety Checked ✓" / "Requires Approval ⚠️"
- **Action Controls:** Approve / Reject buttons (with rejection reason text field)
- **Post-Mortem View:** Generated report after resolution, with quality score
- **Incident History:** Searchable timeline of past incidents for reference

---

## 11. Tech Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| Language | TypeScript | End-to-end type safety |
| Agent Framework | Mastra | Workflow orchestration, tools, memory, model routing |
| Vector Database | Qdrant | Semantic retrieval, institutional memory, hybrid search |
| Safety & Guardrails | Enkrypt AI | Grounding detection, destructive-action policy, output evaluation |
| LLM | Via Mastra model routing (e.g., GPT-4, Claude) | Reasoning, hypothesis generation, post-mortem writing |
| Embeddings | Via Mastra (e.g., text-embedding-3-small) | Vector representations for Qdrant |
| Frontend | React + Tailwind CSS | Engineer dashboard |
| API Layer | Node.js + Express | API Gateway for dashboard ↔ workflow communication |
| External Integrations | Splunk API, PagerDuty API, Slack SDK | Log retrieval, alert ingestion, engineer notifications |

---

## 12. Round 2 Build Scope (MVP Boundary)

If selected for Round 2, the following MVP scope is designed to be achievable by a solo builder while demonstrating the full architecture end-to-end:

**In scope for MVP:**
- Full 8-step Mastra workflow with both Enkrypt decision gates
- Qdrant with all 4 collections, pre-seeded with 20–30 synthetic incidents and 10 runbooks
- Working Grounding Gate and Safety Gate using Enkrypt AI
- Human-in-the-loop approval via a minimal React dashboard
- Post-mortem generation with write-back to Qdrant (feedback loop working)
- Slack notification for approval requests
- Demo with 3 live incident scenarios showing the full pipeline

**Deferred to post-hackathon:**
- Real Splunk/Datadog integration (MVP uses synthetic log input)
- Production-scale Qdrant deployment (MVP uses Qdrant local/Docker)
- Advanced blast-radius estimation (MVP uses rule-based heuristic)
- Multi-incident parallel handling
- RBAC and team-based access controls

---

## 13. Architecture Diagram Reference

See the exported architecture PDF (`architecture-a2.pdf`) for the full visual representation, organized into five zones:

1. **External Systems** — LLM Service (OpenAI/Anthropic via Mastra model routing), External Tools/APIs (Splunk, PagerDuty, Slack)
2. **Mastra Workflow (incidentResponseWorkflow)** — 8 sequential steps with two Enkrypt decision gates branching to "Escalate to Human"
3. **AI Safety Layer** — Enkrypt AI Guardrails (grounding policy, destructive-action policy, output evaluation)
4. **Qdrant Memory Collections** — incidents, log_chunks, runbooks, postmortems with read/write edges to workflow steps
5. **Edge & Interface Layer** — Vigil Dashboard, API Gateway, Alert Source

The dashed feedback edge from Step 8 (Generate Post-Mortem) back to Qdrant incidents and postmortems collections represents the compounding institutional memory — the self-improving loop that makes Vigil more accurate with every resolved incident.
