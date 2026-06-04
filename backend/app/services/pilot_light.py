"""Pilot Light DR strategy engine — generates per-service recommendations."""

from __future__ import annotations

from app.models.schemas import (
    AzureResource,
    PilotLightAction,
    PilotLightPlan,
    PilotLightRecommendation,
    ResourceType,
    RiskLevel,
)
from app.services.azure_discovery import discover_resources
from app.services.cmdb import get_cmdb_entry

# Default strategy map per resource type
STRATEGY_MAP: dict[ResourceType, dict] = {
    ResourceType.VM: {
        "action": PilotLightAction.REBUILD_ON_DEMAND,
        "description": "Store VM images/snapshots in DR region. Spin up from snapshots via pipeline on failover.",
        "dr_cost_ratio": 0.08,  # ~8% of original (managed disk snapshots + storage in DR region)
        "recovery_minutes": 30,
        "risk": RiskLevel.MEDIUM,
        "pipeline_ref": "azure-vm-rebuild.yml",
    },
    ResourceType.POSTGRES: {
        "action": PilotLightAction.REPLICATE,
        "description": "Maintain async read replica in DR region with smaller SKU. Promote replica on failover.",
        "dr_cost_ratio": 0.60,  # 60% of original (smaller replica)
        "recovery_minutes": 15,
        "risk": RiskLevel.LOW,
        "pipeline_ref": "azure-pg-failover.yml",
    },
    ResourceType.REDIS: {
        "action": PilotLightAction.REBUILD_ON_DEMAND,
        "description": "Cache is ephemeral. Deploy new Redis instance on failover; application handles cold cache.",
        "dr_cost_ratio": 0.05,  # ~5% for IaC state + monitoring in DR
        "recovery_minutes": 12,
        "risk": RiskLevel.MEDIUM,
        "pipeline_ref": "azure-redis-deploy.yml",
    },
    ResourceType.APP_SERVICE: {
        "action": PilotLightAction.REBUILD_ON_DEMAND,
        "description": "App Service Plan defined in IaC. Pipeline creates plan and deploys application on failover.",
        "dr_cost_ratio": 0.06,  # ~6% for container registry replication + IaC state
        "recovery_minutes": 20,
        "risk": RiskLevel.MEDIUM,
        "pipeline_ref": "azure-appservice-deploy.yml",
    },
    ResourceType.KEY_VAULT: {
        "action": PilotLightAction.NATIVE_DR,
        "description": "Azure automatically replicates Key Vault to paired region. No action required.",
        "dr_cost_ratio": 0.0,
        "recovery_minutes": 0,
        "risk": RiskLevel.LOW,
        "pipeline_ref": None,
    },
    ResourceType.STORAGE: {
        "action": PilotLightAction.REPLICATE,
        "description": "Enable RA-GRS replication. Initiate storage failover or use secondary read endpoint.",
        "dr_cost_ratio": 0.50,  # GRS adds ~50% over LRS
        "recovery_minutes": 10,
        "risk": RiskLevel.LOW,
        "pipeline_ref": "azure-storage-failover.yml",
    },
    ResourceType.NSG: {
        "action": PilotLightAction.PRE_PROVISION,
        "description": "NSG rules defined in IaC templates. Applied during networking setup in DR region.",
        "dr_cost_ratio": 0.0,
        "recovery_minutes": 3,
        "risk": RiskLevel.LOW,
        "pipeline_ref": "azure-network-provision.yml",
    },
    ResourceType.VNET: {
        "action": PilotLightAction.PRE_PROVISION,
        "description": "VNet pre-created in DR region. Always active, zero cost.",
        "dr_cost_ratio": 0.0,
        "recovery_minutes": 0,
        "risk": RiskLevel.LOW,
        "pipeline_ref": "azure-network-provision.yml",
    },
    ResourceType.SUBNET: {
        "action": PilotLightAction.PRE_PROVISION,
        "description": "Subnet pre-created as part of DR VNet. Always active, zero cost.",
        "dr_cost_ratio": 0.0,
        "recovery_minutes": 0,
        "risk": RiskLevel.LOW,
        "pipeline_ref": "azure-network-provision.yml",
    },
}


def _sku_for_dr(resource: AzureResource) -> str | None:
    """Suggest a DR SKU (may be smaller than primary)."""
    if resource.type == ResourceType.POSTGRES:
        sku = resource.sku
        # Downsize: D4 -> D2, D8 -> D4, etc.
        if "D8" in sku:
            return sku.replace("D8", "D4")
        if "D4" in sku:
            return sku.replace("D4", "D2")
        return sku
    return None


def _generate_recommendations(
    resources: list[AzureResource],
    tier: int,
    target_rto_hours: float,
) -> list[PilotLightRecommendation]:
    """Generate per-resource Pilot Light recommendations."""
    recommendations: list[PilotLightRecommendation] = []

    for resource in resources:
        strategy = STRATEGY_MAP.get(resource.type)
        if not strategy:
            continue

        dr_cost = resource.estimated_monthly_cost * strategy["dr_cost_ratio"]
        recovery_min = strategy["recovery_minutes"]

        # Tier adjustments
        if tier == 1 and resource.type in (ResourceType.VM, ResourceType.APP_SERVICE):
            # Tier 1: keep warm standby for compute
            dr_cost = resource.estimated_monthly_cost * 0.30
            recovery_min = max(5, recovery_min // 3)

        if tier == 3 and resource.type == ResourceType.POSTGRES:
            # Tier 3: restore from backup instead of replica
            dr_cost = 0.0
            recovery_min = 60  # backup restore takes longer

        recommendations.append(
            PilotLightRecommendation(
                resource_name=resource.name,
                resource_type=resource.type,
                current_config=f"{resource.sku} in {resource.region}",
                pilot_light_action=strategy["action"],
                description=strategy["description"],
                dr_sku=_sku_for_dr(resource),
                estimated_dr_monthly_cost=round(dr_cost, 2),
                recovery_time_minutes=recovery_min,
                pipeline_ref=strategy["pipeline_ref"],
                risk_level=strategy["risk"],
            )
        )

    return recommendations


async def generate_pilot_light_plan(
    subscription_id: str,
    target_rto_hours: float | None = None,
    budget_cap_monthly: float | None = None,
) -> PilotLightPlan:
    """Generate a full Pilot Light DR plan for a subscription."""
    # Fetch data (uses cached or re-fetches)
    inventory = await discover_resources(subscription_id)
    cmdb = await get_cmdb_entry(subscription_id)

    rto = target_rto_hours if target_rto_hours is not None else cmdb.rto_hours

    recommendations = _generate_recommendations(inventory.resources, cmdb.tier, rto)

    total_dr_cost = sum(r.estimated_dr_monthly_cost for r in recommendations)
    # Active-active cost ≈ current cost (full duplication)
    active_active_cost = inventory.total_monthly_cost * 0.95
    savings = (
        round(((active_active_cost - total_dr_cost) / active_active_cost) * 100, 1)
        if active_active_cost > 0
        else 0
    )

    # Recovery time = max of sequential critical path (network first, then compute, then data promotion)
    # Simplified: take max across compute + add DB promotion time
    compute_max = max(
        (
            r.recovery_time_minutes
            for r in recommendations
            if r.resource_type in (ResourceType.VM, ResourceType.APP_SERVICE)
        ),
        default=0,
    )
    db_max = max(
        (
            r.recovery_time_minutes
            for r in recommendations
            if r.resource_type == ResourceType.POSTGRES
        ),
        default=0,
    )
    total_recovery = (
        compute_max + db_max
    )  # parallel within group, sequential across groups

    meets_rto = (total_recovery / 60.0) <= rto

    return PilotLightPlan(
        strategy="pilot_light",
        recommendations=recommendations,
        total_dr_monthly_cost=round(total_dr_cost, 2),
        cost_savings_vs_active_active=savings,
        meets_rto=meets_rto,
        estimated_total_recovery_minutes=total_recovery,
    )
