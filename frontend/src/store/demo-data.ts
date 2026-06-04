import type { ChatMessage, SummaryRow, ServiceContext, ThinkingStep } from "./chat";
import type { SuggestedPrompt } from "./chat";
import type { ChatWidget } from "./chat";

// --- Demo flow for Stage 1: Analyse my service ---
//
// Flow:
// 1. Agent greets, asks for app name + subscription
// 2. One prefill suggestion appears ABOVE the input ("IB Investment Research API · UBS-IB-PROD-WEU")
// 3. User clicks it → it sends as their message
// 4. Agent thinks for a while, then delivers a full proactive analysis report:
//    - Azure login + subscriptions found
//    - Full resource inventory + cost breakdown
//    - FinOps budget comparison + Pilot Light savings
//    - Follow-up questions the agent couldn't answer on its own
// 5. Follow-up suggestions appear for the user to explore further

export interface DemoStep {
  /** Agent message shown after the user triggers this step */
  agentMessage: ChatMessage;
  /** Single suggestion shown above the input (user clicks to advance) */
  inputSuggestion?: SuggestedPrompt;
  /** Suggestions shown inline after the agent message (for follow-ups) */
  inlineSuggestions?: SuggestedPrompt[];
  /** Service context update */
  serviceContext?: ServiceContext;
  /** Context summary update */
  contextSummary?: SummaryRow[];
  /** Which stage the contextSummary belongs to (defaults to current activeStage) */
  contextStageId?: number;
  /** Thinking steps shown while the agent is processing */
  thinkingSteps?: ThinkingStep[];
  /** If set, transitions to this stage when this step plays */
  stageTransition?: { stageId: number; completeStage?: number };
}

const t = new Date();

export const DEMO_STEPS: DemoStep[] = [
  // Step 0: Greeting - agent asks for app + subscription
  {
    agentMessage: {
      id: "demo-agent-0",
      role: "agent",
      content:
        "Welcome to Pilot Light BCM Copilot.\n\n" +
        "I'll analyse your Azure service end-to-end: subscriptions, resources, costs, and how it compares to your FinOps budget. Then I'll show you what Pilot Light can save.\n\n" +
        "To start, I just need your **application name** and **Azure subscription**.",
      timestamp: t,
    },
    // One prefill above the input - mimics what the user would type
    inputSuggestion: {
      label: "IB Investment Research API · UBS-IB-PROD-WEU",
      message: "Analyse IB Investment Research API on subscription UBS-IB-PROD-WEU",
    },
  },

  // Step 1: Acknowledgment - agent confirms and announces the analysis
  {
    agentMessage: {
      id: "demo-agent-ack",
      role: "agent",
      content:
        "Thank you! I'll now run a full Stage 1 analysis on **IB Investment Research API** across subscription **UBS-IB-PROD-WEU**.\n\n" +
        "Let me get started.",
      timestamp: t,
    },
    // No inputSuggestion or inlineSuggestions = auto-plays into next step
  },

  // Step 2: Full proactive analysis - the agent does everything at once
  {
    thinkingSteps: [
      {
        id: "t1", label: "Authenticating via Entra ID (MSAL)", status: "active" as const,
        detail: "UBS tenant confirmed",
        subSteps: ["Requesting token from MSAL endpoint", "Validating tenant ID: 3f8a2b1c-...", "Token acquired, scope: Azure Resource Manager"],
      },
      {
        id: "t2", label: "Scanning Azure subscriptions", status: "active" as const,
        detail: "3 subscriptions found",
        subSteps: ["GET /subscriptions?api-version=2022-12-01", "Filtering by tag: app=ResearchAPI", "Matched: UBS-IB-PROD-WEU, UBS-IB-DR-NEU, UBS-IB-DEV"],
        // After this step completes, replace the "discover" placeholder with 3 specific steps
        replacesId: "t-discover",
        expandsInto: [
          {
            id: "t3", label: "Discovering resources in UBS-IB-PROD-WEU", status: "pending" as const,
            detail: "14 resources", parallelGroup: "discover",
            subSteps: ["GET /subscriptions/.../resources", "Found: 2x App Service, 2x SQL DB, 3x Storage, 2x Key Vault, 1x Traffic Manager, 2x VNet, 2x NSG"],
          },
          {
            id: "t4", label: "Discovering resources in UBS-IB-DR-NEU", status: "pending" as const,
            detail: "12 resources", parallelGroup: "discover",
            subSteps: ["GET /subscriptions/.../resources", "Found: 2x App Service, 2x SQL DB (replica), 3x Storage GRS, 1x Key Vault, 2x VNet, 2x NSG"],
          },
          {
            id: "t5", label: "Discovering resources in UBS-IB-DEV", status: "pending" as const,
            detail: "6 resources", parallelGroup: "discover",
            subSteps: ["GET /subscriptions/.../resources", "Found: 1x App Service, 1x SQL DB, 2x Storage, 1x Key Vault, 1x VNet"],
          },
        ],
      },
      {
        // Placeholder - will be replaced by 3 specific discovery steps after subscription scan
        id: "t-discover", label: "Discover resources", status: "pending" as const,
      },
      {
        id: "t6", label: "Pulling cost data from Azure Cost Management", status: "active" as const,
        detail: "Last 3 months analysed",
        subSteps: ["POST /providers/Microsoft.CostManagement/query", "Aggregating daily costs for 90-day window", "Top cost: Azure SQL Business Critical = EUR 5,800/mo", "Total monthly across all subs: EUR 11,570"],
      },
      {
        id: "t7", label: "Comparing against FinOps budget", status: "active" as const,
        detail: "108% utilisation detected",
        subSteps: ["Fetching approved budget from FinOps API", "Budget: $1,200,000/year", "Actual: $1,300,000/year", "Variance: +$100,000 OVER budget"],
      },
      {
        id: "t8", label: "Evaluating Pilot Light savings model", status: "active" as const,
        detail: "42% DR cost reduction",
        subSteps: ["Mapping resources to Pilot Light patterns", "DR standby NEU: can downscale 12 resources to minimal SKU", "Estimated DR cost with PL: $755k/year", "Saving vs current: $545k/year"],
      },
      {
        id: "t9", label: "Generating analysis report", status: "active" as const,
        detail: "Report ready",
        subSteps: ["Compiling subscription overview", "Building cost breakdown tables", "Formatting FinOps comparison", "Report generation complete"],
      },
    ],
    agentMessage: {
      id: "demo-agent-1",
      role: "agent",
      content:
        "**Stage 1 Analysis - IB Investment Research API**\n\n" +
        "I've connected to Azure, scanned your subscriptions, mapped all resources, and compared costs against your FinOps budget. Here's the full picture.\n\n" +
        "---\n\n" +
        "**1. Azure connectivity & subscriptions**\n\n" +
        "✓ Authenticated via Entra ID (MSAL) · UBS tenant confirmed\n" +
        "✓ Found 3 subscriptions associated with 'Research API'",
      timestamp: t,
      badges: [
        { label: "Azure login", variant: "success" },
        { label: "Entra ID verified", variant: "success" },
        { label: "3 subscriptions", variant: "info" },
        { label: "32 resources", variant: "info" },
      ],
      tables: [
        {
          title: "Subscriptions - Research API",
          rows: [
            { label: "UBS-IB-PROD-WEU (primary)", value: "14 resources", variant: "success" },
            { label: "UBS-IB-DR-NEU (DR standby)", value: "12 resources", variant: "warning" },
            { label: "UBS-IB-DEV (dev/test)", value: "6 resources", variant: "neutral" },
          ],
        },
        {
          title: "Monthly cost breakdown - all environments",
          rows: [
            { label: "App Service Plan P3v3 (WEU + NEU always-on)", value: "€ 4,200 / mo", variant: "error" },
            { label: "Azure SQL Business Critical (WEU + NEU)", value: "€ 5,800 / mo", variant: "error" },
            { label: "Storage GRS + ADLS", value: "€ 1,100 / mo", variant: "warning" },
            { label: "Traffic Manager + DNS zones", value: "€ 280 / mo", variant: "neutral" },
            { label: "Key Vault + Entra ID (always-on, low cost)", value: "€ 190 / mo", variant: "neutral" },
            { label: "TOTAL monthly → annually", value: "€ 11,570 / mo ≈ $108k/year", variant: "error" },
          ],
        },
        {
          title: "FinOps budget comparison - annual",
          variant: "default",
          rows: [
            { label: "Approved FinOps budget", value: "$ 1,200,000 / year", variant: "neutral" },
            { label: "Current actual spend", value: "$ 1,300,000 / year", variant: "error" },
            { label: "Budget variance", value: "OVER by $100,000 (108%)", variant: "error" },
            { label: "Pilot Light target cost", value: "$ 755,000 / year", variant: "success" },
            { label: "Projected annual saving", value: "↓ $545,000 / year", variant: "success" },
          ],
        },
      ],
    },
    serviceContext: {
      name: "Research API",
      subscriptions: [
        { name: "UBS-IB-PROD-WEU", type: "primary", resourceCount: 14 },
        { name: "UBS-IB-DR-NEU", type: "DR standby", resourceCount: 12 },
        { name: "UBS-IB-DEV", type: "dev/test", resourceCount: 6 },
      ],
      budget: "$1.2M",
      actualSpend: "$1.3M",
      budgetUtilisation: 108,
      pilotLightTarget: "$755k / year",
      annualSaving: "↓ $545k",
    },
    contextSummary: [
      { label: "Approved budget", value: "$1.2M / year", variant: "neutral" },
      { label: "Current spend", value: "$1.3M / year", variant: "error" },
      { label: "Over budget", value: "+ $100k", variant: "error" },
      { label: "Daily remaining", value: "$3k / day", variant: "warning" },
      { label: "Annual capacity", value: "~$900k / year", variant: "neutral" },
      { label: "Pilot Light target", value: "$755k / year", variant: "success" },
      { label: "Annual saving", value: "↓ $545k", variant: "success" },
    ],
    contextStageId: 1,
  },

  // Step 2: Transition - agent says it will now analyse the findings
  {
    agentMessage: {
      id: "demo-agent-2",
      role: "agent",
      content:
        "Good, the data collection is complete. Now let me cross-reference these numbers against BCM policies, check your DR standby utilisation patterns, and identify any gaps or concerns that need your attention.",
      timestamp: t,
    },
  },

  // Step 3: Key findings with its own thinking process
  {
    thinkingSteps: [
      {
        id: "f1", label: "Analysing DR standby utilisation in NEU", status: "active" as const,
        detail: "99% idle", parallelGroup: "analysis",
        subSteps: ["Querying Azure Monitor metrics for UBS-IB-DR-NEU", "Avg CPU utilisation: 0.8% over 90 days", "Peak utilisation: 2.1% (scheduled health check)", "Standby is effectively idle 99% of the time"],
      },
      {
        id: "f2", label: "Checking budget compliance", status: "active" as const,
        detail: "$100k over", parallelGroup: "analysis",
        subSteps: ["Comparing actual $1.3M vs approved $1.2M", "Variance: +$100,000 (108% utilisation)", "BCM policy threshold: 95% warning, 100% breach", "Status: BUDGET BREACH"],
      },
      {
        id: "f3", label: "Evaluating resource DR compatibility", status: "active" as const,
        detail: "28/32 compatible",
        subSteps: ["Key Vault: always-on, low cost, no DR action needed", "Storage GRS: geo-redundancy built-in, PL compatible", "App Service: can downscale to B1 in DR", "SQL Business Critical: flagged for review"],
      },
      {
        id: "f4", label: "Scanning for out-of-catalogue components", status: "active" as const,
        detail: "1 flagged",
        subSteps: ["Checking all resources against Pilot Light catalogue", "Match: 28 of 32 resources covered", "Azure Data Factory in NEU not in standard catalogue", "Flagged for user input: production or analytics?"],
      },
      {
        id: "f5", label: "Identifying open questions for user", status: "active" as const,
        detail: "3 questions",
        subSteps: ["DEV subscription DR scope: not defined in BCM policy", "Custom pipeline: needs classification", "SQL tier in DR: Business Critical may be overkill for standby"],
      },
    ],
    agentMessage: {
      id: "demo-agent-3",
      role: "agent",
      content:
        "**Key findings & concerns**\n\n" +
        "⚠ **DR standby (NEU) runs 24/7** but it's idle 99% of the time. It costs the same as production. Pilot Light eliminates this by scaling DR to near-zero and only spinning up on failover.\n\n" +
        "⚠ **You're $100k over budget** with current spend at 108% of the approved $1.2M. Pilot Light brings you back inside budget with $545k annual savings.\n\n" +
        "✓ **Key Vault + Entra ID** are always-on, low cost, no action needed.\n\n" +
        "✓ **Storage GRS** has geo-redundancy built-in, fully Pilot Light compatible.\n\n" +
        "---\n\n" +
        "**Questions I need your input on:**\n\n" +
        "- The DEV subscription has 6 resources. Should I **include or exclude DEV** from the DR scope?\n" +
        "- I see a **custom data pipeline** (Azure Data Factory) in NEU that isn't in the standard Pilot Light catalogue. Is this used for production or only for analytics?\n" +
        "- Your SQL databases are **Business Critical** tier in both regions. Have you considered **General Purpose** for the DR standby to reduce costs?",
      timestamp: t,
    },
    inlineSuggestions: [
      { label: "Exclude DEV from DR", message: "Exclude the DEV subscription from DR scope, it's not production." },
      { label: "Pipeline is for analytics", message: "The data pipeline in NEU is analytics only, not production critical." },
      { label: "Open to GP tier for DR", message: "Yes, General Purpose tier for DR SQL would be fine, we only need it during failover." },
      { label: "Proceed to Stage 2", message: "This looks good, proceed to Stage 2 to set RTO & RPO." },
    ],
  },

  // ============================================================
  // STAGE 2: Set RTO & RPO
  // ============================================================

  // Step S2-0: Stage transition - agent announces Stage 2
  {
    stageTransition: { stageId: 2, completeStage: 1 },
    agentMessage: {
      id: "demo-s2-transition",
      role: "agent",
      content:
        "**Stage 1 complete.** Research API: actual $1.3M vs budget $1.2M, $100k over. Pilot Light can save $545k/year.\n\n" +
        "Now moving to **Stage 2: Set RTO & RPO**.\n\n" +
        "I'll pull your SMDB report to check the BCM-defined Tier and RTO, then we'll set RPO. Which service? Confirm the name or type a new one to begin.",
      timestamp: t,
    },
    inputSuggestion: {
      label: "Research API - pull SMDB report",
      message: "Research API - pull the SMDB report and show me the BCM figures.",
    },
  },

  // Step S2-1: Acknowledgment before SMDB analysis
  {
    agentMessage: {
      id: "demo-s2-ack",
      role: "agent",
      content:
        "Got it. I'll pull the SMDB record for **Research API**, check the BCM-defined Tier and RTO, validate against policy requirements, and identify any gaps. Let me look this up.",
      timestamp: t,
    },
  },

  // Step S2-2: SMDB report + BCM requirements analysis
  {
    thinkingSteps: [
      {
        id: "s2-t1", label: "Querying SMDB for Research API", status: "active" as const,
        detail: "Record found",
        subSteps: ["GET /api/smdb/services?name=Research+API", "Match: Research API, IB division", "Last updated: 14 Jan 2026", "BCM Crew approved: Yes"],
      },
      {
        id: "s2-t2", label: "Reading Tier classification", status: "active" as const,
        detail: "Tier 1",
        subSteps: ["SMDB Tier: Tier 1 (revenue-generating, IB critical path)", "Classification basis: real-time trading dependency", "Review date: 14 Jan 2026"],
      },
      {
        id: "s2-t3", label: "Checking RTO definition", status: "active" as const,
        detail: "RTO 1h",
        subSteps: ["SMDB RTO: 1 hour", "BCM Crew approved: Yes", "Compliant with Tier 1 policy (max 1h)"],
      },
      {
        id: "s2-t4", label: "Checking RPO definition", status: "active" as const,
        detail: "NOT DEFINED",
        subSteps: ["RPO field in SMDB: empty", "No RPO target set for this service", "BCM policy requires RPO for all Tier 1/2 services", "Status: NON-COMPLIANT"],
      },
      {
        id: "s2-t5", label: "Loading BCM policy requirements for Tier 1", status: "active" as const,
        detail: "Policy loaded",
        subSteps: ["GET /api/bcm/policies/tier-1", "Max RTO: 1 hour", "RPO: mandatory, must be defined", "DR test frequency: every 6 months", "Snapshot schedule: required"],
      },
      {
        id: "s2-t6", label: "Comparing requirements vs actual architecture", status: "active" as const,
        detail: "3 gaps found",
        subSteps: ["RTO 1h: architecture can meet this with Pilot Light", "RPO: not defined, no snapshot schedule present", "DR snapshot schedule: NOT PRESENT in NEU", "Last BCM test: 8 months ago (overdue by 2 months)"],
      },
    ],
    agentMessage: {
      id: "demo-s2-smdb",
      role: "agent",
      content:
        "**SMDB report retrieved - BCM figures confirmed**\n\n" +
        "✓ SMDB found: Research API, IB division, last updated 14 Jan 2026\n" +
        "→ SMDB Tier: Tier 1 (revenue-generating, IB critical path)\n" +
        "→ SMDB RTO: 1 hour, BCM Crew approved ✓\n" +
        "⚠ RPO: NOT defined in SMDB, must be set before Pilot Light\n\n" +
        "Tier 1 + RTO 1h is a valid Pilot Light profile. Let me now check BCM requirements and compare against your actual architecture.",
      timestamp: t,
      badges: [
        { label: "SMDB ✓", variant: "success" },
        { label: "Tier 1", variant: "warning" },
        { label: "RTO: 1h", variant: "success" },
        { label: "RPO: not set", variant: "error" },
      ],
    },
    serviceContext: {
      name: "Research API",
      subscriptions: [
        { name: "UBS-IB-PROD-WEU", type: "primary", resourceCount: 14 },
        { name: "UBS-IB-DR-NEU", type: "DR standby", resourceCount: 12 },
        { name: "UBS-IB-DEV", type: "dev/test", resourceCount: 6 },
      ],
      tier: "Tier 1",
      rto: "1 hour",
      rpo: "Not set",
      budget: "$1.2M",
      actualSpend: "$1.3M",
      budgetUtilisation: 108,
      pilotLightTarget: "$755k / year",
      annualSaving: "↓ $545k",
    },
    contextSummary: [
      { label: "Tier (SMDB)", value: "Tier 1", variant: "neutral" },
      { label: "RTO", value: "1 hour (approved)", variant: "success" },
      { label: "RPO", value: "Not defined", variant: "error" },
    ],
    contextStageId: 2,
  },

  // Step S2-3: BCM requirements delta (auto-plays as continuation)
  {
    agentMessage: {
      id: "demo-s2-delta",
      role: "agent",
      content:
        "**BCM requirements vs actual architecture**\n\n" +
        "✓ Tier 1, RTO 1h confirmed. Architecture can meet this with Pilot Light.\n\n" +
        "⚠ **Delta: RPO not defined.** No snapshot schedule present. Data loss risk is unknown.\n\n" +
        "I noticed something while reviewing the workload pattern: Research API appears to be a **batch processing service** (daily client-long batch jobs), not a real-time trading system. The current Tier 1 classification assumes real-time trading dependency.\n\n" +
        "If this is batch-only, **Tier 3** would be more appropriate. That means lower cost, simpler BCM requirements, and an RPO of 30 min would be acceptable. Could you confirm the workload type?",
      timestamp: t,
      tables: [
        {
          title: "Requirements delta - what's defined vs what's needed",
          variant: "danger",
          rows: [
            { label: "Tier (SMDB)", value: "Tier 1 ✓", variant: "success" },
            { label: "RTO (SMDB)", value: "1 hour ✓", variant: "success" },
            { label: "RPO (SMDB)", value: "NOT DEFINED ⚠", variant: "error" },
            { label: "DR snapshot schedule", value: "Not present ⚠", variant: "error" },
            { label: "BCM test evidence", value: "8 months ago ⚠", variant: "warning" },
            { label: "Pilot Light readiness", value: "75% - RPO gap to close", variant: "warning" },
          ],
        },
      ],
    },
    inlineSuggestions: [
      { label: "It's batch, reclassify to Tier 3", message: "Research API is client-long batch, not real-time. I'm probably Tier 3. Set RPO to 15 min." },
      { label: "Keep Tier 1, set RPO", message: "Keep it as Tier 1 but set RPO to 5 minutes." },
      { label: "I need to check with the team", message: "I need to check with the team whether this is truly real-time or batch." },
    ],
    contextSummary: [
      { label: "Tier (SMDB)", value: "Tier 1", variant: "neutral" },
      { label: "RTO", value: "1 hour (approved)", variant: "success" },
      { label: "RPO", value: "Not defined", variant: "error" },
      { label: "DR snapshots", value: "Not present", variant: "error" },
      { label: "Last BCM test", value: "8 months ago", variant: "warning" },
      { label: "PL readiness", value: "75%", variant: "warning" },
    ],
    contextStageId: 2,
  },

  // Step S2-4: Tier reclassification + RPO slider widget
  {
    thinkingSteps: [
      {
        id: "s2-r1", label: "Re-evaluating Tier classification", status: "active" as const,
        detail: "Tier 3 confirmed",
        subSteps: ["Workload pattern: batch processing", "No real-time trading dependency", "Client-long batch job schedule: daily 02:00-06:00", "Tier 3 criteria met: non-critical batch workload"],
      },
      {
        id: "s2-r2", label: "Loading RPO options for Tier 3", status: "active" as const,
        detail: "Range: 5 min - 4h",
        subSteps: ["BCM policy Tier 3: RPO minimum 5 min, maximum 4 hours", "Recommended for batch: 15-30 min", "Cost curve loaded from FinOps model"],
      },
    ],
    agentMessage: {
      id: "demo-s2-slider",
      role: "agent",
      content:
        "**Tier reclassified to Tier 3** - batch workload confirmed, no real-time dependency.\n\n" +
        "Now let's set your RPO. Use the slider below to choose how much data loss your service can tolerate. " +
        "The cost adjusts in real time based on snapshot frequency and DR footprint.",
      timestamp: t,
      badges: [
        { label: "Tier 3 confirmed", variant: "success" },
        { label: "RTO: 1h", variant: "success" },
      ],
      widget: {
        type: "rpo-slider",
        config: {
          min: 15,
          max: 240,
          initial: 30,
          step: 15,
          ticks: [
            { value: 15, label: "15m" },
            { value: 30, label: "30m" },
            { value: 60, label: "1h" },
            { value: 120, label: "2h" },
            { value: 240, label: "4h" },
          ],
          costCurve: [
            { rpoMinutes: 15, annualCost: "$480k", saving: "-$820k" },
            { rpoMinutes: 30, annualCost: "$440k", saving: "-$860k" },
            { rpoMinutes: 45, annualCost: "$425k", saving: "-$875k" },
            { rpoMinutes: 60, annualCost: "$410k", saving: "-$890k" },
            { rpoMinutes: 90, annualCost: "$400k", saving: "-$900k" },
            { rpoMinutes: 120, annualCost: "$390k", saving: "-$910k" },
            { rpoMinutes: 180, annualCost: "$380k", saving: "-$920k" },
            { rpoMinutes: 240, annualCost: "$370k", saving: "-$930k" },
          ],
        },
      } as ChatWidget,
    },
    serviceContext: {
      name: "Research API",
      subscriptions: [
        { name: "UBS-IB-PROD-WEU", type: "primary", resourceCount: 14 },
        { name: "UBS-IB-DR-NEU", type: "DR standby", resourceCount: 12 },
        { name: "UBS-IB-DEV", type: "dev/test", resourceCount: 6 },
      ],
      tier: "Tier 3 (revised)",
      rto: "1 hour",
      rpo: "Not set",
      budget: "$1.2M",
      actualSpend: "$1.3M",
      budgetUtilisation: 108,
      pilotLightTarget: "Depends on RPO",
      annualSaving: "TBD",
    },
    contextSummary: [
      { label: "Tier", value: "Tier 3 (revised)", variant: "warning" },
      { label: "RTO", value: "1 hour (SMDB)", variant: "success" },
      { label: "RPO", value: "Setting via slider...", variant: "warning" },
    ],
    contextStageId: 2,
    // No inlineSuggestions - user interacts with the slider widget instead
  },

  // Step S2-5: RPO confirmed via slider - final outcome
  {
    thinkingSteps: [
      {
        id: "s2-r3", label: "Recalculating Pilot Light costs for Tier 3", status: "active" as const,
        detail: "63% savings",
        subSteps: ["Tier 3 DR requirements: simpler BCM controls", "Reduced DR footprint vs Tier 1", "Pilot Light Tier 3 cost: ~$480k/year", "Saving vs current $1.3M: $820k/year"],
      },
    ],
    agentMessage: {
      id: "demo-s2-aha",
      role: "agent",
      content:
        "**RPO confirmed - Stage 2 complete**\n\n" +
        "Your RPO has been set and the SMDB record updated.\n\n" +
        "✓ Tier 3 confirmed: RTO 1h, RPO set, simpler BCM, lower cost.\n\n" +
        "✓ Pilot Light Tier 3: ~$480k/year, saving **$820k/year** vs current $1.3M spend.\n\n" +
        "**Stage 2 complete.** RTO & RPO are now defined. You can proceed to Stage 3 to adopt Pilot Light and see which deliverables are available for your service.",
      timestamp: t,
      tables: [
        {
          title: "Stage 2 outcome - RTO & RPO confirmed",
          rows: [
            { label: "Final Tier", value: "Tier 3 (revised)", variant: "warning" },
            { label: "RTO confirmed", value: "1 hour (SMDB)", variant: "success" },
            { label: "RPO set", value: "15 minutes (set)", variant: "success" },
            { label: "Pilot Light cost (T3)", value: "~$480,000 / year - 63%", variant: "success" },
            { label: "Saving vs current", value: "- $820,000 / year", variant: "success" },
            { label: "Next step", value: "Stage 3 - Adopt Pilot Light", variant: "neutral" },
          ],
        },
      ],
    },
    serviceContext: {
      name: "Research API",
      subscriptions: [
        { name: "UBS-IB-PROD-WEU", type: "primary", resourceCount: 14 },
        { name: "UBS-IB-DR-NEU", type: "DR standby", resourceCount: 12 },
        { name: "UBS-IB-DEV", type: "dev/test", resourceCount: 6 },
      ],
      tier: "Tier 3 (revised)",
      rto: "1 hour",
      rpo: "15 min",
      budget: "$1.2M",
      actualSpend: "$1.3M",
      budgetUtilisation: 108,
      pilotLightTarget: "$480k / year",
      annualSaving: "- $820k",
    },
    contextSummary: [
      { label: "Tier", value: "Tier 3 (revised)", variant: "warning" },
      { label: "RTO", value: "1 hour (SMDB)", variant: "success" },
      { label: "RPO", value: "15 min (set)", variant: "success" },
      { label: "Target PL cost", value: "~$480k / year", variant: "success" },
      { label: "Saving", value: "- $820k / year", variant: "success" },
    ],
    contextStageId: 2,
    inlineSuggestions: [
      { label: "Proceed to Stage 3", message: "Adopt Pilot Light for Research API Tier 3, proceed to Stage 3." },
      { label: "Why Tier 3 over Tier 2?", message: "Explain the difference between Tier 2 and Tier 3 for my use case." },
      { label: "Export RTO/RPO report", message: "Export the Stage 2 RTO & RPO analysis as a report." },
    ],
  },

  // ============================================================
  // STAGE 3: Adopt Pilot Light
  // ============================================================

  // Step S3-0: Stage transition + intro with two scenarios
  {
    stageTransition: { stageId: 3, completeStage: 2 },
    agentMessage: {
      id: "demo-s3-transition",
      role: "agent",
      content:
        "**Stage 2 complete.** Tier 3, RTO 1h, RPO 15 min confirmed. Budget: $1.3M actual vs $1.2M approved. Pilot Light can save $820k/year.\n\n" +
        "Now moving to **Stage 3: Adopt Pilot Light**.\n\n" +
        "Looking at your situation, I see two possible scenarios:\n\n" +
        "**A) Budget-constrained** - Your current spend is $100k over budget. RTO/RPO must improve but there's no extra money. Pilot Light solves this by cutting DR costs while maintaining recovery targets.\n\n" +
        "**B) Budget available** - You have capacity to re-architecture via CAF blueprints. Tier 3 to Tier 1 upgrade path available if the business later needs it.\n\n" +
        "I'll start by running an **SMDB + CMDB fit-gap** to match your service components against Pilot Light capabilities and identify anything that needs Azure-native blueprints (CAF).",
      timestamp: t,
    },
    inputSuggestion: {
      label: "Run the SMDB + CMDB fit-gap",
      message: "Run the SMDB + CMDB fit-gap. Show what Pilot Light covers and what is out of scope.",
    },
    contextSummary: [
      { label: "Scenario", value: "A: Budget-constrained", variant: "neutral" },
      { label: "Current spend", value: "$1.3M (over budget)", variant: "error" },
      { label: "PL target", value: "$480k / year", variant: "success" },
    ],
    contextStageId: 3,
  },

  // Step S3-1: Acknowledgment before fit-gap analysis
  {
    agentMessage: {
      id: "demo-s3-ack",
      role: "agent",
      content:
        "Running the fit-gap now. I'll scan SMDB + CMDB for all **Research API** assets, match each component against the Pilot Light catalogue, and flag anything that needs CAF blueprints or is out of scope.",
      timestamp: t,
    },
  },

  // Step S3-2: SMDB + CMDB fit-gap results
  {
    thinkingSteps: [
      {
        id: "s3-t1", label: "Scanning SMDB for Research API assets", status: "active" as const,
        detail: "32 assets found",
        subSteps: ["GET /api/smdb/services/research-api/assets", "3 subscriptions: PROD-WEU, DR-NEU, DEV", "Total assets: 32 across all subscriptions", "Last SMDB sync: 14 Jan 2026"],
      },
      {
        id: "s3-t2", label: "Cross-referencing CMDB inventory", status: "active" as const,
        detail: "CMDB matched", parallelGroup: "scan",
        subSteps: ["GET /api/cmdb/services/research-api/components", "CMDB components: 32 registered", "Ownership: IB Product team (Thomas Meyer)", "All assets have valid CMDB entries"],
      },
      {
        id: "s3-t3", label: "Matching against Pilot Light catalogue", status: "active" as const,
        detail: "28/32 covered", parallelGroup: "scan",
        subSteps: ["Checking each component against PL catalogue", "App Service: PL supported, downscale to B1 in DR", "Azure SQL: PL supported, GP tier for standby", "Storage GRS: geo-redundant, PL compatible", "Key Vault + Entra ID: always-on, no DR action", "28 of 32 components fully covered by Pilot Light"],
      },
      {
        id: "s3-t4", label: "Identifying CAF scope components", status: "active" as const,
        detail: "4 flagged",
        subSteps: ["4 assets require Azure-native blueprints (CAF)", "Custom data pipeline X: not in PL catalogue", "Legacy integration Y (on-prem): not in PL catalogue", "APIM gateway: needs CAF blueprint for DR failover", "Event Hub namespace: needs CAF blueprint for geo-DR"],
      },
      {
        id: "s3-t5", label: "Flagging out-of-scope items for BCM Crew", status: "active" as const,
        detail: "2 requests",
        subSteps: ["Custom data pipeline X: request to Dan (BCM Crew)", "Legacy integration Y: request to Dan (BCM Crew)", "APIM + Event Hub: CAF blueprint available, auto-mappable"],
      },
    ],
    agentMessage: {
      id: "demo-s3-fitgap",
      role: "agent",
      content:
        "**SMDB + CMDB fit-gap complete**\n\n" +
        "SMDB + CMDB scanned: Research API has 32 assets across 3 subscriptions.\n" +
        "Pilot Light covers 28 of 32 assets. 4 assets require Azure-native blueprints (CAF).\n\n" +
        "⚠ Out of scope today: Custom data pipeline X and Legacy integration Y. Request raised to Dan (BCM Crew) for review.\n\n" +
        "The remaining 2 CAF items (APIM gateway and Event Hub) have standard CAF blueprints available and can be auto-mapped.",
      timestamp: t,
      badges: [
        { label: "SMDB \u2713", variant: "success" },
        { label: "CMDB \u2713", variant: "success" },
        { label: "28/32 covered", variant: "success" },
        { label: "4 CAF scope", variant: "warning" },
      ],
      tables: [
        {
          title: "Fit-gap: Pilot Light vs CMDB service components",
          rows: [
            { label: "App Service + Azure SQL (WEU/NEU)", value: "Pilot Light - fully covered", variant: "success" },
            { label: "Traffic Manager + DNS zones", value: "Pilot Light - included", variant: "success" },
            { label: "Storage GRS + ADLS", value: "Pilot Light - included", variant: "success" },
            { label: "Key Vault + Entra ID", value: "Always-on - no action needed", variant: "success" },
            { label: "APIM gateway", value: "CAF blueprint available", variant: "warning" },
            { label: "Event Hub namespace", value: "CAF blueprint available", variant: "warning" },
            { label: "Custom data pipeline X", value: "Out of scope - request at Dan", variant: "error" },
            { label: "Legacy integration Y (on-prem)", value: "Out of scope - request at Dan", variant: "error" },
          ],
        },
      ],
    },
    contextSummary: [
      { label: "Assets scanned", value: "32 (3 subs)", variant: "neutral" },
      { label: "PL covered", value: "28 of 32", variant: "success" },
      { label: "CAF scope", value: "4 components", variant: "warning" },
      { label: "Out of scope", value: "2 (pending Dan)", variant: "error" },
    ],
    contextStageId: 3,
    inlineSuggestions: [
      { label: "Fit to Pilot Light", message: "Fit my architecture to Pilot Light. I use App Service over APIM for the API gateway. Request pipeline X and integration Y at Dan." },
      { label: "Show CAF blueprints", message: "Show me the CAF blueprints available for APIM and Event Hub." },
      { label: "What about legacy Y?", message: "What options do I have for the legacy on-prem integration Y?" },
    ],
  },

  // Step S3-3: Architecture fitted + deliverable catalogue
  {
    thinkingSteps: [
      {
        id: "s3-a1", label: "Mapping architecture to Pilot Light pattern", status: "active" as const,
        detail: "Mapped",
        subSteps: ["App Service replaces APIM for API gateway (user confirmed)", "Event Hub: standard CAF geo-DR pattern applies", "28 PL components mapped to Pilot Light pattern", "Architecture mapping complete"],
      },
      {
        id: "s3-a2", label: "Submitting out-of-scope requests to BCM Crew", status: "active" as const,
        detail: "2 requests sent",
        subSteps: ["Custom data pipeline X: request #BCM-4821 created for Dan", "Legacy integration Y: request #BCM-4822 created for Dan", "Both flagged as non-blocking for PL adoption", "Dan will review within 5 business days"],
      },
      {
        id: "s3-a3", label: "Checking Pilot Light catalogue for available deliverables", status: "active" as const,
        detail: "Catalogue matched", parallelGroup: "deliverables",
        subSteps: ["Scanning Pilot Light service catalogue", "App Service (WEU/NEU): concept + pipeline + Terraform", "Azure SQL (GP failover): concept + pipeline + Terraform", "Storage GRS: concept only (geo-redundancy built-in)", "Traffic Manager: concept + pipeline", "Key Vault + Entra ID: concept only (always-on)"],
      },
      {
        id: "s3-a4", label: "Building per-service deliverable summary", status: "active" as const,
        detail: "Summary ready", parallelGroup: "deliverables",
        subSteps: ["6 service components identified for BCM coverage", "Concept document: available for all 6", "Pipeline code (GitLab CI / ADO): available for 4", "Terraform module: available for 3", "Team copies code to their repo, configures and adjusts"],
      },
    ],
    agentMessage: {
      id: "demo-s3-deliverables",
      role: "agent",
      content:
        "**Architecture fitted to BCM Service Catalogue**\n\n" +
        "\u2713 Architecture mapped: App Service replaces APIM for API gateway (your confirmation).\n" +
        "\u2713 Event Hub: standard CAF geo-DR pattern applies.\n" +
        "\u2713 Custom pipeline X + Legacy Y flagged as out of scope. Request submitted to Dan (BCM Crew) for review.\n\n" +
        "Based on the analysis, here are the **services that need BCM coverage** and what Pilot Light has available for each. You take the code, drop it into your repo, configure it for your environment and adjust as needed.\n\n" +
        "For each service below, I've listed whether we provide a **concept document**, **pipeline code** (GitLab CI / ADO), **Terraform module**, or a combination.",
      timestamp: t,
      tables: [
        {
          title: "Pilot Light deliverables per service: Research API",
          rows: [
            { label: "App Service (WEU/NEU)", value: "Concept + Pipeline + Terraform", variant: "success" },
            { label: "Azure SQL GP (failover replica)", value: "Concept + Pipeline + Terraform", variant: "success" },
            { label: "Traffic Manager (DNS failover)", value: "Concept + Pipeline", variant: "success" },
            { label: "Event Hub (geo-DR)", value: "Concept + Pipeline + Terraform", variant: "success" },
            { label: "Storage GRS + ADLS", value: "Concept only", variant: "neutral" },
            { label: "Key Vault + Entra ID", value: "Concept only", variant: "neutral" },
            { label: "Custom data pipeline X", value: "Out of scope (pending Dan)", variant: "error" },
            { label: "Legacy integration Y (on-prem)", value: "Out of scope (pending Dan)", variant: "error" },
          ],
        },
      ],
    },
    serviceContext: {
      name: "Research API",
      subscriptions: [
        { name: "UBS-IB-PROD-WEU", type: "primary", resourceCount: 14 },
        { name: "UBS-IB-DR-NEU", type: "DR standby", resourceCount: 12 },
        { name: "UBS-IB-DEV", type: "dev/test", resourceCount: 6 },
      ],
      tier: "Tier 3 (revised)",
      rto: "1 hour",
      rpo: "15 min",
      budget: "$1.2M",
      actualSpend: "$1.3M",
      budgetUtilisation: 108,
      pilotLightTarget: "$480k / year",
      annualSaving: "\u2193 $820k",
    },
    contextSummary: [
      { label: "Services for BCM", value: "6 components", variant: "neutral" },
      { label: "Concept available", value: "6 of 6", variant: "success" },
      { label: "Pipeline code", value: "4 of 6", variant: "success" },
      { label: "Terraform module", value: "3 of 6", variant: "success" },
      { label: "Out of scope", value: "2 (pending Dan)", variant: "error" },
    ],
    contextStageId: 3,
    inlineSuggestions: [
      { label: "Show App Service details", message: "Show me the Pilot Light concept and code for App Service failover." },
      { label: "Why concept only for Storage?", message: "Why is Storage GRS concept only and not pipeline + Terraform?" },
      { label: "How do I use the code?", message: "Walk me through how to take the pipeline and Terraform code into my repo." },
    ],
  },
];
