"""Azure resource discovery — mock and live implementations."""

from __future__ import annotations

from app.config import settings
from app.models.schemas import ResourceInventory, ResourceType
from app.services.mock_data import MOCK_RESOURCES


async def discover_resources(
    subscription_id: str, use_mock: bool | None = None
) -> ResourceInventory:
    """Discover Azure resources in a subscription."""
    if use_mock is None:
        use_mock = settings.mode == "mock"

    if use_mock:
        return _mock_discover(subscription_id)
    else:
        return await _live_discover(subscription_id)


def _mock_discover(subscription_id: str) -> ResourceInventory:
    resources = MOCK_RESOURCES
    total_cost = sum(r.estimated_monthly_cost for r in resources)
    summary: dict[str, int] = {}
    for r in resources:
        summary[r.type.value] = summary.get(r.type.value, 0) + 1

    return ResourceInventory(
        subscription_id=subscription_id,
        resources=resources,
        total_monthly_cost=total_cost,
        resource_summary=summary,
    )


async def _live_discover(subscription_id: str) -> ResourceInventory:
    """Discover resources via Azure SDK. Requires service principal credentials."""
    # TODO: Implement live Azure discovery using:
    # - azure.mgmt.resource.ResourceManagementClient (list all resources)
    # - azure.mgmt.compute (VM details)
    # - azure.mgmt.rdbms (PostgreSQL details)
    # - azure.mgmt.redis (Redis details)
    # - azure.mgmt.web (App Service details)
    # - azure.mgmt.keyvault (Key Vault details)
    # - azure.mgmt.storage (Storage details)
    # - azure.mgmt.network (NSG, VNet, Subnet details)
    raise NotImplementedError(
        "Live Azure discovery not yet implemented. Set MODE=mock to use mock data."
    )
