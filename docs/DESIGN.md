# BCM-GHCP: BCM/DR & FinOps Assessment Agent

## Overview

An AI-powered assessment tool that evaluates Azure subscription resources against BCM Pilot Light strategies and FinOps budgets. Users provide a subscription, the agent discovers resources, checks costs, pulls CMDB metadata, and suggests per-service Pilot Light DR options.

**Stack**: React · FastAPI · GitHub Copilot SDK · MCP  
**UI**: shadcn/ui · Tailwind CSS · Primer-inspired theme · Dark mode first  
**Design**: See [UI_DESIGN.md](UI_DESIGN.md) for full UI specification

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │  Chat UI  │  │  Assessment   │  │    Cost      │  │
│  │          │  │  Results View  │  │   Explorer   │  │
│  └────┬─────┘  └──────┬────────┘  └──────┬───────┘  │
│       └───────────┬────┴─────────────────┘           │
│                   │ REST / SSE                        │
└───────────────────┼──────────────────────────────────┘
                    │
┌───────────────────┼──────────────────────────────────┐
│              FastAPI Backend                          │
│                   │                                   │
│  ┌────────────────▼─────────────────┐                │
│  │  github-copilot-sdk (Python)     │                │
│  │  CopilotClient + @define_tool    │                │
│  │  Custom tools with Pydantic      │                │
│  └────────────────┬─────────────────┘                │
│                   │ JSON-RPC (stdio)                  │
│  ┌────────────────▼─────────────────┐                │
│  │   Copilot CLI (server mode)      │                │
│  │   Auto-managed by SDK            │                │
│  │   Planning, tool orchestration   │                │
│  └────────────────┬─────────────────┘                │
│                   │                                   │
│  ┌────────────────▼─────────────────┐                │
│  │     LLM (via GitHub Copilot)     │                │
│  │   gpt-4.1 / claude-sonnet-4.5 etc   │                │
│  └──────────────────────────────────┘                │
│                                                       │
│  ┌──────────────────────────────────┐                │
│  │  @define_tool Custom Tools       │                │
│  │  ┌─────────────────────────────┐ │                │
│  │  │ assess_azure_resources      │ │                │
│  │  │ get_budget_status           │ │                │
│  │  │ query_cmdb                  │ │                │
│  │  │ suggest_pilot_light_plan    │ │                │
│  │  └─────────────────────────────┘ │                │
│  └──────────────────────────────────┘                │
│                   │                                   │
│  ┌────────────────▼─────────────────┐                │
│  │          Services Layer          │                │
│  │  ┌────────────┐ ┌─────────────┐  │                │
│  │  │ Azure SDK  │ │ Mock Azure  │  │                │
│  │  │ Discovery  │ │ Discovery   │  │                │
│  │  └────────────┘ └─────────────┘  │                │
│  │  ┌────────────┐ ┌─────────────┐  │                │
│  │  │ Budget API │ │  CMDB API   │  │                │
│  │  │  (mock)    │ │  (mock)     │  │                │
│  │  └────────────┘ └─────────────┘  │                │
│  │  ┌─────────────────────────────┐ │                │
│  │  │   Pilot Light Engine        │ │                │
│  │  └─────────────────────────────┘ │                │
│  └──────────────────────────────────┘                │
└──────────────────────────────────────────────────────┘
```

### Key: GitHub Copilot SDK + CLI

The agent layer uses **`github-copilot-sdk`** (`pip install github-copilot-sdk`),
the official Python SDK for programmatic control of GitHub Copilot CLI.

- **CopilotClient** manages the Copilot CLI process lifecycle (spawn, JSON-RPC, shutdown)
- **`@define_tool`** decorator with Pydantic models auto-generates JSON schemas for each tool
- **Session** = one agent conversation with streaming events, custom tools, and system prompt
- **Copilot CLI** handles planning, tool orchestration, and LLM communication — we don't build our own agent loop
- **Hooks** (`on_pre_tool_use`, `on_post_tool_use`) provide transparency events for the UI timeline

**Prerequisites**: `copilot` CLI must be installed and authenticated (`copilot --version`)

---

## User Flow

```
1. User enters Azure subscription ID (or selects "demo" for mock data)
         │
2. Agent calls: assess_azure_resources(subscription_id)
   → Returns inventory: VMs, Postgres, Redis, App Service,
     Key Vault, Storage, NSG, VNet, Subnet
         │
3. Agent calls: get_budget_status(subscription_id)
   → Returns: allocated budget, current spend, forecast
         │
4. Agent calls: query_cmdb(subscription_id)
   → Returns: app tier (1/2/3), RTO, owner, regions
         │
5. Agent calls: suggest_pilot_light_plan(resources, tier, rto, budget)
   → Returns: per-service Pilot Light recommendations
         │
6. Agent renders results → Chat + dynamic cards/tables
         │
7. User explores: asks follow-up questions, tweaks parameters,
   compares cost scenarios
```

---

## Target Azure Resource Types

| Resource Type     | Azure Provider                           | Key Properties for Assessment          |
| ----------------- | ---------------------------------------- | -------------------------------------- |
| Virtual Machines  | Microsoft.Compute/virtualMachines        | SKU, OS, region, availability set/zone |
| PostgreSQL DB     | Microsoft.DBforPostgreSQL/flexibleServers | SKU, storage, HA config, backup        |
| Redis Cache       | Microsoft.Cache/redis                    | SKU, clustering, geo-replication       |
| App Service       | Microsoft.Web/sites                      | SKU/plan, slots, region                |
| Key Vault         | Microsoft.KeyVault/vaults                | SKU, soft-delete, purge protection     |
| Storage Account   | Microsoft.Storage/storageAccounts        | SKU, replication (LRS/GRS), kind       |
| NSG               | Microsoft.Network/networkSecurityGroups  | Rules count, associated subnets        |
| VNet              | Microsoft.Network/virtualNetworks        | Address space, peerings, region        |
| Subnet            | (child of VNet)                          | Address prefix, delegations, NSG       |

---

## MCP Tools

### 1. `assess_azure_resources`
**Purpose**: Discover and inventory all target resources in a subscription.

```
Input:  { subscription_id: string, use_mock: boolean }
Output: {
  subscription_id: string,
  resources: [
    {
      resource_id: string,
      type: "vm" | "postgres" | "redis" | "app_service" | "key_vault" | "storage" | "nsg" | "vnet" | "subnet",
      name: string,
      region: string,
      sku: string,
      properties: { ... },        # type-specific config
      estimated_monthly_cost: float
    }
  ],
  total_monthly_cost: float,
  resource_summary: { type: count }
}
```

### 2. `get_budget_status`
**Purpose**: Fetch budget allocation and current spend for the subscription.

```
Input:  { subscription_id: string }
Output: {
  subscription_id: string,
  budget_allocated: float,
  current_spend: float,
  forecast_end_of_month: float,
  budget_remaining: float,
  status: "under" | "at_risk" | "over"
}
```

### 3. `query_cmdb`
**Purpose**: Retrieve application metadata from the CMDB.

```
Input:  { subscription_id: string }
Output: {
  subscription_id: string,
  application_name: string,
  owner: string,
  tier: 1 | 2 | 3,
  rto_hours: float,
  rpo_hours: float,
  primary_region: string,
  dr_region: string,
  criticality: "high" | "medium" | "low"
}
```

### 4. `suggest_pilot_light_plan`
**Purpose**: Generate per-service Pilot Light DR recommendations.

```
Input: {
  resources: [...],           # from assess_azure_resources
  tier: int,
  rto_hours: float,
  rpo_hours: float,
  budget_remaining: float
}
Output: {
  strategy: "pilot_light",
  recommendations: [
    {
      resource_name: string,
      resource_type: string,
      current_config: string,
      pilot_light_action: "pre_provision" | "rebuild_on_demand" | "replicate" | "native_dr",
      description: string,
      dr_sku: string | null,              # Suggested SKU in DR region (may be smaller)
      estimated_dr_monthly_cost: float,
      recovery_time_minutes: int,
      pipeline_ref: string | null,        # ADO/GitLab pipeline reference
      risk_level: "low" | "medium" | "high"
    }
  ],
  total_dr_monthly_cost: float,
  cost_savings_vs_active_active: float,
  meets_rto: boolean,
  estimated_total_recovery_minutes: int
}
```

---

## Pilot Light Strategy Matrix

Per-service default strategies (refined by tier/RTO):

| Resource        | Pilot Light Action     | What Stays Active in DR              | What Rebuilds on Failover           |
| --------------- | ---------------------- | ------------------------------------ | ----------------------------------- |
| **VMs**         | Rebuild on demand      | VM images/snapshots stored           | VMs spun up from images via pipeline|
| **PostgreSQL**  | Replicate              | Read replica (async) in DR region    | Promote replica to primary          |
| **Redis**       | Rebuild on demand      | Nothing (cache is ephemeral)         | New Redis instance, cold cache      |
| **App Service** | Rebuild on demand      | App Service Plan definition in IaC   | Deploy from pipeline                |
| **Key Vault**   | Native DR              | Azure-managed replication            | Automatic (Azure handles it)        |
| **Storage**     | Replicate              | RA-GRS or GZRS enabled              | Failover storage account            |
| **NSG**         | Pre-provision via IaC  | NSG rules in Terraform/ARM          | Applied during VNet rebuild         |
| **VNet/Subnet** | Pre-provision via IaC  | VNet/Subnet pre-created in DR       | Already exists, ready               |

### Tier Adjustments
- **Tier 1 (RTO < 1h)**: Pilot Light may not be sufficient → warn user, suggest Warm Standby
- **Tier 2 (RTO 1-4h)**: Standard Pilot Light, pre-provision networking + DB replica
- **Tier 3 (RTO 4-24h)**: Lean Pilot Light, rebuild everything on demand

---

## Data Models (Python/Pydantic)

See `backend/app/models/` for full definitions:
- `ResourceInventory` — discovered Azure resources
- `BudgetStatus` — FinOps budget state
- `CMDBEntry` — application metadata
- `PilotLightPlan` — DR recommendations
- `AssessmentResult` — combined assessment output

---

## API Endpoints

### Assessment
- `POST /api/assess` — Run full assessment (triggers agent)
- `GET /api/assess/{session_id}/stream` — SSE stream for agent progress

### Chat
- `POST /api/chat` — Send message to agent (after assessment, for exploration)
- `GET /api/chat/{session_id}/stream` — SSE stream for agent responses

### Mock Data Management
- `GET /api/mock/subscriptions` — List available mock subscriptions
- `GET /api/mock/subscription/{id}` — Get mock subscription details

### Direct Service Endpoints (for UI components)
- `GET /api/resources/{subscription_id}` — Get cached resource inventory
- `GET /api/budget/{subscription_id}` — Get budget status
- `GET /api/cmdb/{subscription_id}` — Get CMDB entry

---

## Frontend

> Full UI specification in [UI_DESIGN.md](UI_DESIGN.md)

**Design System**: shadcn/ui + Tailwind CSS with Primer-inspired dark theme  
**Key UX Pattern**: Agent Activity Feed — VS Code Copilot Agent Mode-style transparency

### Layout
- **Split view**: Agent Activity Feed (left 40%) + Results Panel (right 60%)
- **Agent Activity Feed**: Real-time timeline showing every tool call, thinking step, and response
- **Results Panel**: Tabbed view — Assessment Overview, Resources, DR Plan, Cost Explorer
- Tool calls are expandable (collapsed summary → full input/output)
- Thinking/reasoning streams token-by-token and collapses when done

### Frontend Stack
- React 18+ / TypeScript / Vite
- shadcn/ui (Radix + Tailwind)
- Zustand (state), Recharts (charts), SSE streaming
- Primer-aligned tokens: dark-first, monochrome + intentional color, Inter + JetBrains Mono

---

## Configuration

```env
# .env
MODE=mock                              # "mock" or "live"
AZURE_TENANT_ID=                       # For live mode
AZURE_CLIENT_ID=                       # Service principal
AZURE_CLIENT_SECRET=                   # Service principal
GITHUB_COPILOT_API_KEY=               # Copilot SDK
```

---

## V1 Scope

### In Scope
- [x] Mock Azure resource discovery (1 predefined subscription)
- [x] Real Azure discovery via SDK + service principal
- [x] Mock Budget API
- [x] Mock CMDB API
- [x] Single Copilot SDK agent with 4 MCP tools
- [x] Pilot Light strategy engine (rule-based, per-service)
- [x] Chat UI with streaming responses
- [x] Assessment result cards (resource table, budget gauge, DR plan)
- [x] Basic cost comparison (current vs Pilot Light)

### Out of Scope (V2+)
- [ ] Pipeline triggering (ADO/GitLab)
- [ ] Multi-subscription assessment
- [ ] Real CMDB integration
- [ ] Real cost management API integration
- [ ] RAG over Pilot Light documentation
- [ ] Warm Standby / Active-Active strategy suggestions
- [ ] Historical assessment tracking
- [ ] Multi-tenancy / auth
