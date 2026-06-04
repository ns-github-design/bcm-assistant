# BCM-GHCP — PoC Backlog

> 3-month PoC to demonstrate AI-powered BCM/DR assessment using GitHub Copilot SDK.

---

## Epic 1: Foundation
> Project setup, architecture, and design decisions.

| Story | Description | Status |
|-------|-------------|--------|
| 1.1 | Define scope, target resource types, and Pilot Light strategy | Done |
| 1.2 | Design architecture (React + FastAPI + Copilot SDK + CLI) | Done |
| 1.3 | Design UI — agent transparency feed, dark enterprise theme | Done |
| 1.4 | Scaffold backend and frontend projects | Done |

---

## Epic 2: Agent & Tools
> Copilot SDK agent with custom BCM tools and mock data services.

| Story | Description | Status |
|-------|-------------|--------|
| 2.1 | Build 4 custom tools with `@define_tool` (Azure discovery, budget, CMDB, DR plan) | Done |
| 2.2 | Create mock data — Trading Platform subscription (23 resources) | Done |
| 2.3 | Wire agent with system prompt embedding Pilot Light DR knowledge | Done |
| 2.4 | Stream agent events (tool calls, thinking, responses) via SSE | Done |
| 2.5 | Add live Azure resource discovery via SDK + service principal | To Do |

---

## Epic 3: Frontend
> Chat UI with agent transparency and interactive assessment results.

| Story | Description | Status |
|-------|-------------|--------|
| 3.1 | Build subscription input screen and split-panel layout | Done |
| 3.2 | Build Agent Activity Feed — real-time timeline with expand/collapse | In Progress |
| 3.3 | Build Assessment Overview tab — stats, tier badge, DR readiness | To Do |
| 3.4 | Build DR Plan tab — per-service recommendation cards | To Do |
| 3.5 | Build Cost Explorer tab — scenario comparison, parameter sliders | To Do |
| 3.6 | Connect chat input for follow-up questions after assessment | To Do |

---

## Epic 4: Pilot Light Knowledge
> Encode real BCM strategies and validate agent recommendations.

| Story | Description | Status |
|-------|-------------|--------|
| 4.1 | Build rule-based strategy engine (per-service, tier-adjusted) | Done |
| 4.2 | Ingest Pilot Light pipeline docs into agent prompt | To Do |
| 4.3 | Validate agent output against real DR procedures | To Do |

---

## Epic 5: Demo & Validation
> End-to-end demo flow and stakeholder presentation.

| Story | Description | Status |
|-------|-------------|--------|
| 5.1 | End-to-end demo flow — mock subscription → full assessment | To Do |
| 5.2 | Add second mock subscription for comparison demo | To Do |
| 5.3 | Prepare demo walkthrough and talking points | To Do |

---

## Timeline (3 months)

| Month | Focus | Epics |
|-------|-------|-------|
| **Month 1** | Foundation + Agent + Mock data | Epic 1, Epic 2 |
| **Month 2** | Frontend views + Pilot Light refinement | Epic 3, Epic 4 |
| **Month 3** | Live Azure integration + Demo readiness | Epic 2.5, Epic 5 |
