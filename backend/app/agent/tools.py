"""
Tools for the BCM Assessment Agent, defined using the GitHub Copilot SDK.

Each tool uses @define_tool with Pydantic parameter models so the SDK
auto-generates JSON schemas and handles the tool-call lifecycle via JSON-RPC
through the Copilot CLI.

Tools emit progress sub-steps via a shared asyncio.Queue so the SSE stream
can show what's happening inside each tool call (like VS Code agent mode).
"""

from __future__ import annotations

import asyncio
import random
from typing import Any

from pydantic import BaseModel, Field

from copilot import define_tool

from app.services.azure_discovery import discover_resources
from app.services.budget import get_budget
from app.services.cmdb import get_cmdb_entry
from app.services.pilot_light import generate_pilot_light_plan


# --- Progress sub-step system ---

# Shared queue for tool progress events. The client subscribes before
# starting a session and drains progress into the SSE stream.
_progress_queue: asyncio.Queue | None = None


def set_progress_queue(queue: asyncio.Queue) -> None:
    global _progress_queue
    _progress_queue = queue


def clear_progress_queue() -> None:
    global _progress_queue
    _progress_queue = None


async def _emit_progress(tool: str, message: str) -> None:
    """Emit a sub-step progress message for a tool."""
    if _progress_queue is not None:
        _progress_queue.put_nowait({"tool": tool, "message": message})
    await asyncio.sleep(random.uniform(0.3, 0.7))  # Small delay between sub-steps


# --- Parameter models ---


class AssessAzureResourcesParams(BaseModel):
    subscription_id: str = Field(description="The Azure subscription ID to assess.")
    use_mock: bool = Field(
        default=True, description="Use mock data instead of live Azure APIs."
    )


class GetBudgetStatusParams(BaseModel):
    subscription_id: str = Field(description="The Azure subscription ID.")


class QueryCMDBParams(BaseModel):
    subscription_id: str = Field(description="The Azure subscription ID.")


class SuggestPilotLightPlanParams(BaseModel):
    subscription_id: str = Field(
        description="The subscription ID (uses cached assessment data)."
    )
    target_rto_hours: float | None = Field(
        default=None, description="Override CMDB RTO with a custom target."
    )
    budget_cap_monthly: float | None = Field(
        default=None, description="Maximum monthly DR budget constraint."
    )


# --- Tool definitions ---


@define_tool(
    description=(
        "Discover and inventory all target Azure resources in a subscription. "
        "Returns VMs, PostgreSQL, Redis, App Service, Key Vault, Storage, NSG, VNet, and Subnet "
        "with their SKUs, regions, configurations, and estimated monthly costs."
    ),
    skip_permission=True,
)
async def assess_azure_resources(params: AssessAzureResourcesParams) -> str:
    tool = "assess_azure_resources"
    await _emit_progress(tool, "Connecting to Azure Resource Manager...")
    await _emit_progress(tool, f"Querying subscription {params.subscription_id}")
    await _emit_progress(tool, "Scanning Microsoft.Compute/virtualMachines...")
    await _emit_progress(tool, "Scanning Microsoft.DBforPostgreSQL/flexibleServers...")
    await _emit_progress(tool, "Scanning Microsoft.Cache/redis...")
    await _emit_progress(tool, "Scanning Microsoft.Web/sites...")
    await _emit_progress(tool, "Scanning Microsoft.KeyVault/vaults...")
    await _emit_progress(tool, "Scanning Microsoft.Storage/storageAccounts...")
    await _emit_progress(tool, "Scanning Microsoft.Network (VNets, Subnets, NSGs)...")
    await _emit_progress(tool, "Calculating cost estimates...")
    inventory = await discover_resources(
        subscription_id=params.subscription_id,
        use_mock=params.use_mock,
    )
    result = inventory.model_dump()
    summary_parts = [
        f"{count} {rtype}" for rtype, count in result["resource_summary"].items()
    ]
    await _emit_progress(
        tool,
        f"Found {len(result['resources'])} resources across {len(result['resource_summary'])} types",
    )
    return (
        f"Found {len(result['resources'])} resources ({', '.join(summary_parts)}). "
        f"Total estimated monthly cost: ${result['total_monthly_cost']:,.2f}."
    )


@define_tool(
    description=(
        "Fetch the FinOps budget allocation, current spend, and forecast for a subscription. "
        "Returns budget status (under/at_risk/over) and remaining budget."
    ),
    skip_permission=True,
)
async def get_budget_status(params: GetBudgetStatusParams) -> str:
    tool = "get_budget_status"
    await _emit_progress(tool, "Connecting to FinOps Cost Management API...")
    await _emit_progress(tool, "Fetching budget allocation and current spend...")
    await _emit_progress(tool, "Calculating end-of-month forecast...")
    budget = await get_budget(subscription_id=params.subscription_id)
    await _emit_progress(
        tool,
        f"Budget status: {budget.status.value} (${budget.current_spend:,.0f} of ${budget.budget_allocated:,.0f})",
    )
    return (
        f"Budget: ${budget.budget_allocated:,.0f}/mo allocated. "
        f"Current spend: ${budget.current_spend:,.0f}. "
        f"Forecast: ${budget.forecast_end_of_month:,.0f}. "
        f"Remaining: ${budget.budget_remaining:,.0f}. "
        f"Status: {budget.status.value}."
    )


@define_tool(
    description=(
        "Retrieve application metadata from the CMDB for a subscription. "
        "Returns the application tier (1/2/3), RTO, RPO, owner, regions, and criticality."
    ),
    skip_permission=True,
)
async def query_cmdb(params: QueryCMDBParams) -> str:
    tool = "query_cmdb"
    await _emit_progress(tool, "Querying CMDB for subscription metadata...")
    await _emit_progress(tool, "Resolving application tier and RTO/RPO...")
    entry = await get_cmdb_entry(subscription_id=params.subscription_id)
    await _emit_progress(
        tool,
        f"Found: {entry.application_name} (Tier {entry.tier}, RTO {entry.rto_hours}h)",
    )
    return (
        f"Application: {entry.application_name}. "
        f"Owner: {entry.owner}. "
        f"Tier: {entry.tier} ({entry.criticality.value} criticality). "
        f"RTO: {entry.rto_hours}h, RPO: {entry.rpo_hours}h. "
        f"Primary region: {entry.primary_region}, DR region: {entry.dr_region}."
    )


@define_tool(
    description=(
        "Generate per-service Pilot Light DR recommendations based on discovered resources, "
        "application tier, RTO requirements, and budget. Returns a strategy for each resource: "
        "pre-provision, rebuild on demand, replicate, or native DR — with cost estimates "
        "and recovery time projections."
    ),
    skip_permission=True,
)
async def suggest_pilot_light_plan(params: SuggestPilotLightPlanParams) -> str:
    tool = "suggest_pilot_light_plan"
    await _emit_progress(tool, "Loading Pilot Light strategy matrix...")
    await _emit_progress(tool, "Analyzing VM resources — rebuild on demand strategy...")
    await _emit_progress(tool, "Analyzing PostgreSQL — async replica strategy...")
    await _emit_progress(tool, "Analyzing Redis — ephemeral rebuild strategy...")
    await _emit_progress(tool, "Analyzing App Service — IaC rebuild strategy...")
    await _emit_progress(tool, "Evaluating Key Vault native DR capabilities...")
    await _emit_progress(tool, "Evaluating Storage replication options (GRS/RA-GRS)...")
    await _emit_progress(tool, "Pre-provisioning network topology (VNet/Subnet/NSG)...")
    await _emit_progress(tool, "Applying tier-based adjustments...")
    await _emit_progress(tool, "Calculating total DR cost and recovery timeline...")
    plan = await generate_pilot_light_plan(
        subscription_id=params.subscription_id,
        target_rto_hours=params.target_rto_hours,
        budget_cap_monthly=params.budget_cap_monthly,
    )
    await _emit_progress(
        tool,
        f"Generated {len(plan.recommendations)} recommendations — DR cost ${plan.total_dr_monthly_cost:,.0f}/mo",
    )
    lines = [
        f"Pilot Light DR Plan: {len(plan.recommendations)} recommendations.",
        f"Total DR cost: ${plan.total_dr_monthly_cost:,.2f}/mo.",
        f"Savings vs Active-Active: {plan.cost_savings_vs_active_active}%.",
        f"Estimated recovery: {plan.estimated_total_recovery_minutes} minutes.",
        f"Meets RTO: {'Yes' if plan.meets_rto else 'No'}.",
        "",
        "Per-service recommendations:",
    ]
    for rec in plan.recommendations:
        lines.append(
            f"  - {rec.resource_name} ({rec.resource_type.value}): "
            f"{rec.pilot_light_action.value} | "
            f"DR cost: ${rec.estimated_dr_monthly_cost:,.2f}/mo | "
            f"Recovery: {rec.recovery_time_minutes} min | "
            f"Risk: {rec.risk_level.value}"
        )
    return "\n".join(lines)


# All tools for session registration
ALL_TOOLS = [
    assess_azure_resources,
    get_budget_status,
    query_cmdb,
    suggest_pilot_light_plan,
]
