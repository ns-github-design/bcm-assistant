# UI Design — BCM-GHCP

## Design Philosophy

**Enterprise-grade, banking-ready, agent-transparent.**

- **shadcn/ui** as the component system (Radix primitives, Tailwind CSS)
- **GitHub Primer** as the design feel — clean, focused, monochrome with intentional color
- **Dark mode first** — matches the Primer dark palette, reduces fatigue for power users
- **Agent transparency** — inspired by VS Code Copilot Agent Mode: every tool call, reasoning step, and decision is visible, expandable, and auditable

---

## Design Tokens (Primer-aligned)

Tailwind CSS custom theme extending shadcn defaults with Primer-inspired tokens:

```
Background:       --background:       hsl(220, 13%, 10%)      # Primer gray.9 feel
Surface:          --card:             hsl(220, 13%, 13%)      # Elevated surface
Surface raised:   --card-foreground:  hsl(220, 13%, 16%)      # Cards, panels
Border:           --border:           hsl(220, 10%, 20%)      # Subtle borders
                  --border-emphasis:  hsl(220, 10%, 30%)      # Active borders

Text primary:     --foreground:       hsl(210, 17%, 90%)      # Off-white
Text secondary:   --muted-foreground: hsl(215, 12%, 55%)      # Gray.4 feel
Text muted:       --muted:            hsl(215, 12%, 40%)      # Gray.5 feel

Accent (Blue):    --primary:          hsl(212, 100%, 48%)     # Primer blue.4
Accent hover:     --primary-hover:    hsl(212, 100%, 42%)     # Primer blue.5

Success:          --success:          hsl(137, 55%, 40%)      # Primer green.4
Warning:          --warning:          hsl(40, 95%, 50%)       # Amber
Danger:           --destructive:      hsl(0, 72%, 51%)        # Primer red.4

Agent thinking:   --agent-thinking:   hsl(270, 60%, 60%)      # Purple — agent reasoning
Agent tool:       --agent-tool:       hsl(212, 100%, 48%)     # Blue — tool execution
Agent complete:   --agent-complete:   hsl(137, 55%, 40%)      # Green — completed step
Agent pending:    --agent-pending:    hsl(215, 12%, 40%)      # Gray — queued step
```

### Typography
- **Font**: `Inter` for body, `JetBrains Mono` for code/data
- **Headings**: Semi-bold, tight tracking (Primer Heading feel)
- **Data values**: Monospace, tabular nums for financial figures

---

## Layout Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Top Bar (SubdomainNavBar feel)                                  │
│  [≡ BCM Assessment]         [Mock ◉ / Live ○]     [Settings ⚙] │
├────────────────────────────┬─────────────────────────────────────┤
│                            │                                     │
│   Agent Chat Panel         │   Results Panel                     │
│   (left, ~40%)             │   (right, ~60%)                     │
│                            │                                     │
│  ┌──────────────────────┐  │  ┌───────────────────────────────┐  │
│  │                      │  │  │  Tabs:                        │  │
│  │  Agent Activity Feed │  │  │  [Assessment] [Resources]     │  │
│  │  (Agentic Timeline)  │  │  │  [DR Plan] [Cost Explorer]   │  │
│  │                      │  │  │                               │  │
│  │  ┌─ 🔍 Discovering  │  │  │  ┌─────────────────────────┐  │  │
│  │  │  resources...     │  │  │  │                         │  │  │
│  │  │  ▸ 12 VMs found   │  │  │  │   Dynamic content       │  │  │
│  │  │  ▸ 3 PostgreSQL   │  │  │  │   based on active tab   │  │  │
│  │  │  ▸ ...            │  │  │  │                         │  │  │
│  │  └──────────────────  │  │  │  │                         │  │  │
│  │  ┌─ 💰 Checking      │  │  │  │                         │  │  │
│  │  │  budget...         │  │  │  │                         │  │  │
│  │  │  ▸ $12,400/mo      │  │  │  │                         │  │  │
│  │  └──────────────────  │  │  │  │                         │  │  │
│  │  ┌─ 🧠 Analyzing     │  │  │  └─────────────────────────┘  │  │
│  │  │  Tier 2, RTO=2h   │  │  │                               │  │
│  │  │  ▸ reasoning...   │  │  │                               │  │
│  │  └──────────────────  │  │  │                               │  │
│  │                      │  │  │                               │  │
│  ├──────────────────────┤  │  │                               │  │
│  │  [Message input...  ]│  │  │                               │  │
│  └──────────────────────┘  │  └───────────────────────────────┘  │
│                            │                                     │
└────────────────────────────┴─────────────────────────────────────┘
```

### Responsive Behavior
- **Desktop (>1280px)**: Side-by-side — chat left, results right
- **Tablet (768–1280px)**: Stacked — results panel slides over or tabs below
- **Mobile**: Not a priority for V1, but chat-only view with results in modal sheets

---

## Agent Activity Feed (The Core UX)

This is the VS Code Agent Mode-inspired transparency layer. Every action the agent takes is rendered as a **timeline entry** with expandable detail.

### Event Types & Visual Treatment

```
┌─────────────────────────────────────────────────────────┐
│  Agent Activity                                          │
│                                                          │
│  ● User message                                         │
│  │  "Assess subscription abc-123-def"                   │
│  │                                                      │
│  ◆ Tool Call: assess_azure_resources          2.3s  ✓  │
│  │  ▾ Input: { subscription_id: "abc-123-def" }        │
│  │  ▾ Output: 23 resources found                       │
│  │    ├─ 12 Virtual Machines                            │
│  │    ├─ 3 PostgreSQL Flexible Servers                  │
│  │    ├─ 2 Redis Cache instances                        │
│  │    ├─ 4 App Services                                 │
│  │    └─ 2 Storage Accounts                             │
│  │  [View full response ▸]                              │
│  │                                                      │
│  ◆ Tool Call: get_budget_status               0.8s  ✓  │
│  │  ▾ Budget: $15,000/mo | Spend: $12,400 | At Risk ⚠ │
│  │                                                      │
│  ◆ Tool Call: query_cmdb                      0.5s  ✓  │
│  │  ▾ App: "Trading Platform" | Tier 2 | RTO: 2h       │
│  │                                                      │
│  ◇ Thinking...                                          │
│  │  "Given Tier 2 with 2h RTO, standard Pilot Light     │
│  │   is appropriate. PostgreSQL needs a read replica,    │
│  │   VMs can rebuild from snapshots, networking should   │
│  │   be pre-provisioned..."                              │
│  │                                                      │
│  ◆ Tool Call: suggest_pilot_light_plan        1.2s  ✓  │
│  │  ▾ 8 recommendations generated                       │
│  │  ▾ DR cost: $3,200/mo (74% savings)                  │
│  │  ▾ Meets RTO: Yes (est. 95 min)                      │
│  │                                                      │
│  ● Agent response                                        │
│  │  "I've completed the assessment for subscription..."  │
│  │  [Rendered cards appear in Results Panel →]           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Event Components

| Event Type       | Icon  | Color             | Behavior                                          |
| ---------------- | ----- | ----------------- | ------------------------------------------------- |
| **User message** | ●     | `--foreground`    | Static, shows user input                          |
| **Tool call**    | ◆     | `--agent-tool`    | Expandable: shows input params + output summary   |
| **Thinking**     | ◇     | `--agent-thinking`| Streaming text, italic, collapsible when done     |
| **Agent reply**  | ●     | `--agent-complete`| Rendered markdown, may reference result cards     |
| **Error**        | ✕     | `--destructive`   | Red, shows error message, retry option            |
| **Pending**      | ○     | `--agent-pending` | Pulsing dot, shows "waiting..."                   |
| **In progress**  | ◆ ↻   | `--agent-tool`    | Spinning indicator, elapsed time counter          |

### Streaming Behavior
- SSE events from backend drive the activity feed in real-time
- Tool calls show a **spinner + elapsed time** while executing
- Thinking text **streams token-by-token** (like VS Code agent mode)
- When a tool completes, a **summary line** appears immediately; full detail is expandable
- The results panel updates as data arrives (resource table populates, budget gauge fills)

### SSE Event Protocol

```typescript
// Events streamed from backend to frontend
type AgentEvent =
  | { type: "user_message"; content: string }
  | { type: "thinking_start" }
  | { type: "thinking_delta"; content: string }
  | { type: "thinking_end" }
  | { type: "tool_call_start"; tool: string; input: Record<string, unknown> }
  | { type: "tool_call_end"; tool: string; output: Record<string, unknown>; duration_ms: number }
  | { type: "tool_call_error"; tool: string; error: string }
  | { type: "response_start" }
  | { type: "response_delta"; content: string }
  | { type: "response_end" }
  | { type: "assessment_complete"; result: AssessmentResult }
  | { type: "error"; message: string }
```

---

## Results Panel — Tab Views

### Tab 1: Assessment Overview

A dashboard summary card grid:

```
┌─────────────────────────────────────────────────────┐
│  Assessment Overview                                 │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  23           │  │  Tier 2      │  │  $12,400   │ │
│  │  Resources    │  │  Trading App │  │  /mo spend │ │
│  │  discovered   │  │  RTO: 2h     │  │  ⚠ At Risk │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                      │
│  DR READINESS                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  ████████████████████░░░░░░  74% cost savings  │  │
│  │  Pilot Light DR: $3,200/mo                     │  │
│  │  Est. Recovery: 95 min (within 2h RTO ✓)       │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  RESOURCE BREAKDOWN                                  │
│  ┌───────┬───────┬──────┬────────┬──────────────┐   │
│  │ Type  │ Count │ Cost │  DR    │ DR Cost      │   │
│  ├───────┼───────┼──────┼────────┼──────────────┤   │
│  │ VM    │  12   │$6.2k │Rebuild │ $0 (on-demand)│  │
│  │ PgSQL │   3   │$3.1k │Replica │ $1.8k        │  │
│  │ Redis │   2   │$1.2k │Rebuild │ $0           │  │
│  │ ...   │  ...  │ ...  │  ...   │ ...          │  │
│  └───────┴───────┴──────┴────────┴──────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Tab 2: Resources

Detailed resource inventory table with:
- Filterable by type, region, SKU
- Sortable columns
- Row expansion showing full resource properties
- Resource type icons (VM, database, cache, etc.)

```
┌─────────────────────────────────────────────────────┐
│  Resources  [Filter ▾]  [Region ▾]  [Search...]     │
│                                                      │
│  ☐  Name              Type       SKU        Region   │
│  ──────────────────────────────────────────────────   │
│  ☐  web-app-prod-01   VM         D4s_v3     westeu   │
│  ☐  web-app-prod-02   VM         D4s_v3     westeu   │
│  ☐  api-server-01     VM         D8s_v5     westeu   │
│  ☐  ▾ trading-db-01   PostgreSQL GP_D4s_v3  westeu   │
│     │ Storage: 512 GB                                │
│     │ HA: Zone-redundant                             │
│     │ Backup: 7-day retention                        │
│     │ Connections: 200 max                           │
│  ☐  cache-prod-01     Redis      C3 Premium westeu   │
│  ...                                                 │
└─────────────────────────────────────────────────────┘
```

### Tab 3: DR Plan

Per-service recommendation cards — the core output:

```
┌─────────────────────────────────────────────────────┐
│  Pilot Light DR Plan     Meets RTO ✓  │ $3,200/mo   │
│                                                      │
│  ┌─ PostgreSQL (3 instances) ──────────────────────┐ │
│  │  Strategy: REPLICATE                            │ │
│  │  ┌─────────┐     ┌─────────────┐               │ │
│  │  │ Primary │ ──▶ │  DR Replica │               │ │
│  │  │ GP_D4s  │     │  GP_D2s     │               │ │
│  │  │ West EU │     │  North EU   │               │ │
│  │  └─────────┘     └─────────────┘               │ │
│  │  Recovery: ~15 min (promote replica)            │ │
│  │  DR Cost: $1,800/mo   Risk: Low ●              │ │
│  │  Pipeline: azure-pg-failover.yml                │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ Virtual Machines (12 instances) ───────────────┐ │
│  │  Strategy: REBUILD ON DEMAND                    │ │
│  │  ┌─────────┐     ┌─────────────┐               │ │
│  │  │ Active  │     │  Snapshots  │               │ │
│  │  │ D4s_v3  │ ──▶ │  stored in  │               │ │
│  │  │ West EU │     │  North EU   │               │ │
│  │  └─────────┘     └─────────────┘               │ │
│  │  Recovery: ~30 min (spin up from snapshot)      │ │
│  │  DR Cost: $180/mo (storage only)  Risk: Med ●  │ │
│  │  Pipeline: azure-vm-rebuild.yml                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ Key Vault (2 instances) ──────────────────────┐  │
│  │  Strategy: NATIVE DR                            │ │
│  │  Azure handles replication automatically.       │ │
│  │  Recovery: ~0 min   DR Cost: $0   Risk: Low ●  │ │
│  └─────────────────────────────────────────────────┘ │
│  ...                                                 │
└─────────────────────────────────────────────────────┘
```

### Tab 4: Cost Explorer

Interactive cost comparison with parameter tweaking:

```
┌─────────────────────────────────────────────────────┐
│  Cost Explorer                                       │
│                                                      │
│  SCENARIO COMPARISON                                 │
│  ┌──────────┬───────────┬──────────┬──────────────┐  │
│  │          │ Current   │ Pilot    │ Active-      │  │
│  │          │           │ Light    │ Active       │  │
│  ├──────────┼───────────┼──────────┼──────────────┤  │
│  │ Monthly  │ $12,400   │ $3,200   │ $11,800      │  │
│  │ Annual   │ $148,800  │ $38,400  │ $141,600     │  │
│  │ Savings  │    —      │ 74%      │ 5%           │  │
│  │ RTO      │   N/A     │ ~95 min  │ ~5 min       │  │
│  └──────────┴───────────┴──────────┴──────────────┘  │
│                                                      │
│  ADJUST PARAMETERS                                   │
│  ┌────────────────────────────────────────────────┐   │
│  │ Target RTO:  [====●===========]  2 hours       │  │
│  │ Budget cap:  [===========●====]  $5,000/mo     │  │
│  │ DR Region:   [North Europe       ▾]            │  │
│  └────────────────────────────────────────────────┘   │
│                                                      │
│  PER-SERVICE COST DELTA                              │
│  ┌────────────────────────────────────────────────┐   │
│  │  ██████████████████ PostgreSQL  $1,800         │   │
│  │  ██████████         VMs          $180          │   │
│  │  ██████████         Storage      $640          │   │
│  │  ██████             Redis        $0            │   │
│  │  ████               App Service  $580          │   │
│  │  █                  Key Vault    $0            │   │
│  └────────────────────────────────────────────────┘   │
│                                                      │
│  [Recalculate with new parameters]                   │
└─────────────────────────────────────────────────────┘
```

---

## Key UI Components

### 1. AgentTimeline

The primary chat/activity component. A vertical timeline where each entry is a step.

```tsx
<AgentTimeline>
  <AgentTimelineEntry type="user" content="Assess subscription..." />
  <AgentTimelineEntry type="tool_call" tool="assess_azure_resources" status="complete" duration="2.3s">
    <ToolCallSummary>23 resources found across 5 types</ToolCallSummary>
    <ToolCallDetail>{/* Expandable full input/output */}</ToolCallDetail>
  </AgentTimelineEntry>
  <AgentTimelineEntry type="thinking" status="streaming">
    <ThinkingContent>Given Tier 2 with 2h RTO...</ThinkingContent>
  </AgentTimelineEntry>
  <AgentTimelineEntry type="response">
    <AgentResponse>{/* Markdown rendered response */}</AgentResponse>
  </AgentTimelineEntry>
</AgentTimeline>
```

Inspired by:
- VS Code Copilot's agent timeline (step-by-step tool calls with expand/collapse)
- Primer Timeline component (vertical connected items)
- shadcn Collapsible for expand/collapse sections

### 2. ResourceCard

Compact card showing a single resource with its DR status:

```tsx
<ResourceCard
  type="postgresql"
  name="trading-db-01"
  sku="GP_D4s_v3"
  region="West Europe"
  monthlyCost={1033}
  drStrategy="replicate"
  drCost={600}
  recoveryMinutes={15}
  riskLevel="low"
/>
```

### 3. BudgetGauge

Circular or bar gauge showing budget utilization:

```tsx
<BudgetGauge
  allocated={15000}
  spent={12400}
  forecast={14800}
  status="at_risk"  // colors: under=green, at_risk=amber, over=red
/>
```

### 4. TierBadge

Application tier indicator with color coding:

```tsx
<TierBadge tier={2} rto="2h" criticality="medium" />
// Renders: [Tier 2] with amber border, "RTO: 2h" subtitle
```

### 5. CostComparison

Interactive comparison table with adjustable parameters:

```tsx
<CostComparison
  scenarios={[
    { name: "Current", monthlyCost: 12400, rto: null },
    { name: "Pilot Light", monthlyCost: 3200, rto: 95 },
    { name: "Active-Active", monthlyCost: 11800, rto: 5 },
  ]}
  onParameterChange={(params) => recalculate(params)}
/>
```

### 6. SubscriptionInput

Initial input component — either enter a subscription ID or pick a demo:

```tsx
<SubscriptionInput
  onSubmit={(subscriptionId, useMock) => startAssessment(...)}
  mockSubscriptions={["demo-trading-platform", "demo-payment-gateway"]}
/>
```

---

## Interaction Patterns

### Starting an Assessment
1. User lands on clean screen with SubscriptionInput centered
2. Types subscription ID or clicks "Demo: Trading Platform"
3. Layout transitions: input shrinks to top, side-by-side panels appear
4. Agent Activity Feed begins streaming events
5. Results Panel tabs populate as data arrives

### Exploring Results (Post-Assessment)
- Chat input at bottom of Agent Panel becomes active
- User can ask: "What if we reduce RTO to 1 hour?"
- Agent re-runs `suggest_pilot_light_plan` with new parameters
- New timeline entries appear, results panel updates
- Cost Explorer sliders provide instant client-side recalculation for simple changes

### Expanding Agent Steps
- Each tool call entry is **collapsed by default** showing only the summary line
- Click to expand: shows full input parameters and output JSON
- Thinking blocks are **fully collapsed** after completion (click to see reasoning)
- This mirrors VS Code's "Used tool: ..." collapsible sections

---

## Frontend Tech Stack

```
React 18+            — UI framework
TypeScript           — Type safety
Vite                 — Build tool
shadcn/ui            — Component primitives (Button, Card, Table, Tabs, Collapsible, etc.)
Tailwind CSS 4       — Styling with Primer-inspired custom theme
Lucide React         — Icons (consistent with shadcn)
Recharts             — Cost charts and gauges
React Markdown       — Render agent markdown responses
EventSource / SSE    — Real-time agent event streaming
Zustand              — State management (lightweight, stores assessment state)
```

### Why shadcn + Primer-inspired theme (not Primer React directly)?
- **Primer Brand** is designed for GitHub's marketing/brand pages — not ideal for dense data apps
- **Primer React** (`@primer/react`) is GitHub's internal app kit — great but opinionated and GitHub-specific
- **shadcn/ui** gives us maximum control with Radix primitives + Tailwind — we apply Primer's *feel* (color, typography, spacing, motion) via custom theme tokens
- Result: Primer's clean, enterprise aesthetic with shadcn's flexibility for data-heavy components

---

## Motion & Animation Principles (Primer-aligned)

- **Purposeful**: Animations indicate state changes, not decoration
- **Fast**: 150-200ms transitions (snappy, enterprise feel)
- **Streaming feel**: Thinking text fades in token-by-token, tool call entries slide in from left
- **Progress**: Pulsing dot on active steps, smooth width transitions on progress bars
- **No bounce, no overshoot**: Linear or ease-out only — banking UX = stability

---

## Color Usage Discipline

| Context                  | Color              | Rationale                       |
| ------------------------ | ------------------ | ------------------------------- |
| Default UI               | Grays only         | Clean, professional             |
| Agent thinking           | Purple accent      | Distinct from data, "AI" signal |
| Tool execution           | Blue accent        | Action, process                 |
| Success / within budget  | Green              | Financial positive              |
| Warning / at risk        | Amber              | Attention without alarm         |
| Error / over budget      | Red                | Critical, needs action          |
| Tier 1 (Critical)        | Red badge          | Highest criticality             |
| Tier 2 (Important)       | Amber badge        | Medium criticality              |
| Tier 3 (Standard)        | Blue badge         | Normal operations               |
| Interactive elements     | Blue primary       | Clickable, actionable           |

Colors are used sparingly — most of the UI is monochrome with color only for status and intent.
