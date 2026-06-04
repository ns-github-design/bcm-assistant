/**
 * Type definitions matching the backend Pydantic models.
 */

export type ResourceType =
  | "vm"
  | "postgres"
  | "redis"
  | "app_service"
  | "key_vault"
  | "storage"
  | "nsg"
  | "vnet"
  | "subnet";

export type PilotLightAction =
  | "pre_provision"
  | "rebuild_on_demand"
  | "replicate"
  | "native_dr";

export type RiskLevel = "low" | "medium" | "high";
export type BudgetStatusType = "under" | "at_risk" | "over";
export type Criticality = "high" | "medium" | "low";

export interface AzureResource {
  resource_id: string;
  type: ResourceType;
  name: string;
  region: string;
  resource_group: string;
  sku: string;
  properties: Record<string, unknown>;
  estimated_monthly_cost: number;
}

export interface ResourceInventory {
  subscription_id: string;
  resources: AzureResource[];
  total_monthly_cost: number;
  resource_summary: Record<string, number>;
}

export interface BudgetInfo {
  subscription_id: string;
  budget_allocated: number;
  current_spend: number;
  forecast_end_of_month: number;
  budget_remaining: number;
  status: BudgetStatusType;
}

export interface CMDBEntry {
  subscription_id: string;
  application_name: string;
  owner: string;
  tier: 1 | 2 | 3;
  rto_hours: number;
  rpo_hours: number;
  primary_region: string;
  dr_region: string;
  criticality: Criticality;
}

export interface PilotLightRecommendation {
  resource_name: string;
  resource_type: ResourceType;
  current_config: string;
  pilot_light_action: PilotLightAction;
  description: string;
  dr_sku: string | null;
  estimated_dr_monthly_cost: number;
  recovery_time_minutes: number;
  pipeline_ref: string | null;
  risk_level: RiskLevel;
}

export interface PilotLightPlan {
  strategy: string;
  recommendations: PilotLightRecommendation[];
  total_dr_monthly_cost: number;
  cost_savings_vs_active_active: number;
  meets_rto: boolean;
  estimated_total_recovery_minutes: number;
}

export interface AssessmentResult {
  subscription_id: string;
  resources: ResourceInventory;
  budget: BudgetInfo;
  cmdb: CMDBEntry;
  plan: PilotLightPlan;
}

// --- Agent event types (SSE protocol) ---

export type AgentEventType =
  | "user_message"
  | "thinking_start"
  | "thinking_delta"
  | "thinking_end"
  | "tool_call_start"
  | "tool_call_end"
  | "tool_call_error"
  | "tool_call_progress"
  | "response_start"
  | "response_delta"
  | "response_end"
  | "assessment_complete"
  | "error";

export interface AgentEvent {
  type: AgentEventType;
  content?: string;
  tool?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  duration_ms?: number;
  error?: string;
  result?: AssessmentResult;
}

// --- Timeline entry (UI state) ---

export type TimelineEntryStatus =
  | "pending"
  | "in_progress"
  | "complete"
  | "error";

export interface TimelineEntry {
  id: string;
  type: "user" | "tool_call" | "thinking" | "response" | "error";
  status: TimelineEntryStatus;
  timestamp: number;
  // Tool call fields
  tool?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  durationMs?: number;
  // Content fields
  content?: string;
  // Error fields
  error?: string;
  // Sub-step progress messages
  progressMessages?: string[];
}
