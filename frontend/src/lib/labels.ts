import type { ResourceType } from "../types";

/** Human-readable labels for resource types */
export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  vm: "Virtual Machines",
  postgres: "PostgreSQL",
  redis: "Redis Cache",
  app_service: "App Service",
  key_vault: "Key Vault",
  storage: "Storage Account",
  nsg: "NSG",
  vnet: "VNet",
  subnet: "Subnet",
};

/** Short labels for tables */
export const RESOURCE_TYPE_SHORT: Record<ResourceType, string> = {
  vm: "VM",
  postgres: "PostgreSQL",
  redis: "Redis",
  app_service: "App Svc",
  key_vault: "Key Vault",
  storage: "Storage",
  nsg: "NSG",
  vnet: "VNet",
  subnet: "Subnet",
};

export const PILOT_LIGHT_ACTION_LABELS: Record<string, string> = {
  pre_provision: "Pre-provision",
  rebuild_on_demand: "Rebuild on demand",
  replicate: "Replicate",
  native_dr: "Native DR",
};

export const RISK_COLORS: Record<string, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
};

export const RISK_BG: Record<string, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/15 text-destructive",
};

export const TIER_COLORS: Record<number, string> = {
  1: "bg-destructive/15 text-destructive border-destructive/30",
  2: "bg-warning/15 text-warning border-warning/30",
  3: "bg-primary/15 text-primary border-primary/30",
};

export const BUDGET_STATUS_COLORS: Record<string, string> = {
  under: "text-success",
  at_risk: "text-warning",
  over: "text-destructive",
};

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatRegion(region: string): string {
  const map: Record<string, string> = {
    westeurope: "West Europe",
    northeurope: "North Europe",
    eastus: "East US",
    westus: "West US",
  };
  return map[region] ?? region;
}
