"""Mock Budget API service."""

from __future__ import annotations

from app.models.schemas import BudgetInfo, BudgetStatus
from app.services.mock_data import MOCK_BUDGET


async def get_budget(subscription_id: str) -> BudgetInfo:
    """Fetch budget status for a subscription."""
    # For now, always return mock data. Swap for real FinOps API later.
    return MOCK_BUDGET.model_copy(update={"subscription_id": subscription_id})
