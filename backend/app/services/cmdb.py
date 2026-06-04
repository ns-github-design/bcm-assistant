"""Mock CMDB API service."""

from __future__ import annotations

from app.models.schemas import CMDBEntry
from app.services.mock_data import MOCK_CMDB


async def get_cmdb_entry(subscription_id: str) -> CMDBEntry:
    """Retrieve CMDB entry for a subscription."""
    # For now, always return mock data. Swap for real CMDB API later.
    return MOCK_CMDB.model_copy(update={"subscription_id": subscription_id})
