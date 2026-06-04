from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


# --- Enums ---


class ResourceType(str, Enum):
    VM = "vm"
    POSTGRES = "postgres"
    REDIS = "redis"
    APP_SERVICE = "app_service"
    KEY_VAULT = "key_vault"
    STORAGE = "storage"
    NSG = "nsg"
    VNET = "vnet"
    SUBNET = "subnet"


class PilotLightAction(str, Enum):
    PRE_PROVISION = "pre_provision"
    REBUILD_ON_DEMAND = "rebuild_on_demand"
    REPLICATE = "replicate"
    NATIVE_DR = "native_dr"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class BudgetStatus(str, Enum):
    UNDER = "under"
    AT_RISK = "at_risk"
    OVER = "over"


class Criticality(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# --- Resource Models ---


class AzureResource(BaseModel):
    resource_id: str
    type: ResourceType
    name: str
    region: str
    resource_group: str
    sku: str
    properties: dict = Field(default_factory=dict)
    estimated_monthly_cost: float = 0.0


class ResourceInventory(BaseModel):
    subscription_id: str
    resources: list[AzureResource]
    total_monthly_cost: float = 0.0
    resource_summary: dict[str, int] = Field(default_factory=dict)


# --- Budget Models ---


class BudgetInfo(BaseModel):
    subscription_id: str
    budget_allocated: float
    current_spend: float
    forecast_end_of_month: float
    budget_remaining: float
    status: BudgetStatus


# --- CMDB Models ---


class CMDBEntry(BaseModel):
    subscription_id: str
    application_name: str
    owner: str
    tier: int = Field(ge=1, le=3)
    rto_hours: float
    rpo_hours: float
    primary_region: str
    dr_region: str
    criticality: Criticality


# --- Pilot Light Recommendation Models ---


class PilotLightRecommendation(BaseModel):
    resource_name: str
    resource_type: ResourceType
    current_config: str
    pilot_light_action: PilotLightAction
    description: str
    dr_sku: str | None = None
    estimated_dr_monthly_cost: float = 0.0
    recovery_time_minutes: int = 0
    pipeline_ref: str | None = None
    risk_level: RiskLevel = RiskLevel.MEDIUM


class PilotLightPlan(BaseModel):
    strategy: str = "pilot_light"
    recommendations: list[PilotLightRecommendation]
    total_dr_monthly_cost: float = 0.0
    cost_savings_vs_active_active: float = 0.0
    meets_rto: bool = False
    estimated_total_recovery_minutes: int = 0


# --- Combined Assessment Result ---


class AssessmentResult(BaseModel):
    subscription_id: str
    resources: ResourceInventory
    budget: BudgetInfo
    cmdb: CMDBEntry
    plan: PilotLightPlan


# --- SSE Event Models ---


class AgentEventType(str, Enum):
    USER_MESSAGE = "user_message"
    THINKING_START = "thinking_start"
    THINKING_DELTA = "thinking_delta"
    THINKING_END = "thinking_end"
    TOOL_CALL_START = "tool_call_start"
    TOOL_CALL_END = "tool_call_end"
    TOOL_CALL_ERROR = "tool_call_error"
    TOOL_CALL_PROGRESS = "tool_call_progress"
    RESPONSE_START = "response_start"
    RESPONSE_DELTA = "response_delta"
    RESPONSE_END = "response_end"
    ASSESSMENT_COMPLETE = "assessment_complete"
    ERROR = "error"


class AgentEvent(BaseModel):
    type: AgentEventType
    content: str | None = None
    tool: str | None = None
    input: dict | None = None
    output: dict | None = None
    duration_ms: int | None = None
    error: str | None = None
    result: AssessmentResult | None = None


# --- API Request/Response Models ---


class AssessmentRequest(BaseModel):
    subscription_id: str
    use_mock: bool = True


class ChatMessage(BaseModel):
    role: str = "user"
    content: str
    session_id: str | None = None
