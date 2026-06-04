import { create } from "zustand";

import { DEMO_STEPS } from "./demo-data";
import type { DemoStep } from "./demo-data";
import type { RpoSliderConfig } from "../components/v2/RpoSlider";

// --- Widget types for interactive components embedded in messages ---

export interface RpoSliderWidget {
  type: "rpo-slider";
  config: RpoSliderConfig;
}

export type ChatWidget = RpoSliderWidget;

// --- Stage definitions ---

export interface SuggestedPrompt {
  label: string;
  message: string;
}

export interface WorkflowStage {
  id: number;
  key: string;
  label: string;
  color: "orange" | "green" | "blue" | "purple" | "teal" | "rose";
  goal: string;
  steps: string[];
  welcomeMessage: string;
  suggestedPrompts: SuggestedPrompt[];
  /** Data sources shown at the bottom of the context panel */
  sources: string[];
  /** If true, stage is not yet available */
  disabled?: boolean;
}

export const STAGES: WorkflowStage[] = [
  {
    id: 1,
    key: "analyse",
    label: "Analyse my service",
    color: "orange",
    goal: "Connect to Azure, scan subscriptions & assets, show a full financial comparison.",
    steps: [
      "Name your service",
      "Confirm assets & inventory",
      "Financial comparison",
    ],
    welcomeMessage: "I'll help you analyse your Azure service. To get started, I need the **name of your application** and the **Azure subscription** it runs on.",
    suggestedPrompts: [
      { label: "Analyse a service", message: "Analyse the IB Investment Research API on subscription UBS-IB-PROD-WEU" },
      { label: "List my subscriptions", message: "Show me all my Azure subscriptions" },
      { label: "Cost overview", message: "Give me a cost overview for my service" },
      { label: "Compare environments", message: "Compare prod vs DR subscription resources and costs" },
    ],
    sources: ["Azure Cost Mgmt", "ARM API", "Entra ID"],
  },
  {
    id: 2,
    key: "rto-rpo",
    label: "Set RTO & RPO",
    color: "orange",
    goal: "Define recovery time and data loss targets in business language - cost-aware, compliance-aligned, no cloud jargon.",
    steps: [
      "SMDB report",
      "Confirm BCM requirements",
      "Architecture delta",
      "Validate Tier & set RPO",
    ],
    welcomeMessage: "Let's define recovery targets for your service. I'll pull your SMDB record, check BCM requirements, and highlight any gaps.",
    suggestedPrompts: [
      { label: "Pull SMDB report", message: "Pull the SMDB report for my service and show the BCM figures" },
      { label: "What tier am I?", message: "What tier is my service classified as and does it match the workload?" },
      { label: "Set RPO", message: "RPO is not defined yet - help me set a realistic RPO" },
      { label: "RTO vs architecture", message: "Show the delta between my RTO target and what my architecture can deliver" },
    ],
    sources: ["SMDB", "BCM Policy", "Architecture Registry"],
  },
  {
    id: 3,
    key: "adopt-pilot-light",
    label: "Adopt Pilot Light",
    color: "green",
    goal: "Confirm Pilot Light is the right pattern, run a fit-gap, and show which deliverables are available per service: concept, pipeline code, Terraform, or a combination.",
    steps: [
      "SMDB + CMDB fit-gap",
      "Fit architecture to BCM Catalogue",
      "Show deliverables per service",
    ],
    welcomeMessage: "Time to check if Pilot Light fits your service. I'll run a fit-gap against SMDB and CMDB, then show you which deliverables are available for each component: concept doc, pipeline code, Terraform module, or a combination.",
    suggestedPrompts: [
      { label: "Run fit-gap", message: "Run the SMDB + CMDB fit-gap and show what Pilot Light covers" },
      { label: "What's out of scope?", message: "Which components are out of scope for Pilot Light?" },
      { label: "Show deliverables", message: "Show me which deliverables are available per service" },
      { label: "Show pipeline", message: "Show me the CI/CD pipeline code for Pilot Light failover" },
    ],
    sources: ["SMDB", "CMDB", "BCM Catalogue", "Entra ID", "Audit logged"],
  },
  {
    id: 4,
    key: "cost-approval",
    label: "Cost & approval",
    color: "blue",
    goal: "Final cost breakdown, budget approval workflow, and sign-off from stakeholders.",
    steps: [
      "Cost breakdown",
      "Approval workflow",
    ],
    welcomeMessage: "Let's finalise the cost picture and get stakeholder approval for the Pilot Light setup.",
    suggestedPrompts: [
      { label: "Cost breakdown", message: "Show the full cost breakdown: current vs Pilot Light" },
      { label: "Annual savings", message: "What are the projected annual savings with Pilot Light?" },
      { label: "Approval status", message: "What approvals do I still need and from whom?" },
      { label: "Budget impact", message: "Will Pilot Light fit within my current approved budget?" },
    ],
    sources: ["FinOps", "Approval Portal", "Azure Cost Mgmt"],
    disabled: true,
  },
  {
    id: 5,
    key: "bcm-test",
    label: "BCM test",
    color: "purple",
    goal: "Validate DR readiness with automated BCM test execution and reporting.",
    steps: [
      "Test plan",
      "Execute tests",
      "Report results",
    ],
    welcomeMessage: "Let's validate your DR setup with a BCM test. I'll help you create the plan, execute it, and generate the compliance report.",
    suggestedPrompts: [
      { label: "Create test plan", message: "Generate a BCM test plan for my Pilot Light setup" },
      { label: "Run failover test", message: "Execute a failover test and report results" },
      { label: "Last test results", message: "When was the last BCM test and what were the results?" },
      { label: "Test gaps", message: "What scenarios are not covered by my current test plan?" },
    ],
    sources: ["BCM Test Framework", "DR Automation"],
    disabled: true,
  },
  {
    id: 6,
    key: "go-to-production",
    label: "Go to production",
    color: "teal",
    goal: "Production deployment checklist, final validation, and go-live confirmation.",
    steps: [
      "Pre-production checklist",
      "Go-live confirmation",
    ],
    welcomeMessage: "Final stage - let's make sure everything is ready for production. I'll walk through the checklist and confirm go-live readiness.",
    suggestedPrompts: [
      { label: "Pre-prod checklist", message: "Show the pre-production readiness checklist" },
      { label: "Remaining blockers", message: "Are there any open blockers preventing go-live?" },
      { label: "Go-live confirmation", message: "Confirm go-live and generate the completion report" },
      { label: "Rollback plan", message: "What's the rollback plan if something goes wrong post go-live?" },
    ],
    sources: ["Deployment Pipeline", "BCM Registry"],
    disabled: true,
  },
];

// --- Chat message types ---

export type MessageRole = "agent" | "user";

export interface StatusBadge {
  label: string;
  variant: "success" | "warning" | "error" | "info" | "neutral";
}

export interface TableData {
  title: string;
  variant?: "default" | "danger" | "success";
  headers?: string[];
  rows: Array<{ label: string; value: string; variant?: "success" | "warning" | "error" | "neutral" }>;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  badges?: StatusBadge[];
  tables?: TableData[];
  /** Interactive widget embedded in the message */
  widget?: ChatWidget;
  isStreaming?: boolean;
  /** Tables revealed so far during streaming (progressive reveal) */
  streamedTableCount?: number;
  /** Completed thinking steps attached to this message (reviewable after) */
  thinkingLog?: ThinkingStep[];
}

// --- Session ---

export interface ChatSession {
  id: string;
  title: string;
  serviceName?: string;
  stageId: number;
  createdAt: Date;
  isActive: boolean;
}

// --- Service context (right panel) ---

export interface ServiceContext {
  name: string;
  subscriptions?: Array<{ name: string; type: string; resourceCount: number }>;
  tier?: string;
  rto?: string;
  rpo?: string;
  budget?: string;
  actualSpend?: string;
  budgetUtilisation?: number;
  pilotLightTarget?: string;
  annualSaving?: string;
}

export interface SummaryRow {
  label: string;
  value: string;
  variant?: "success" | "warning" | "error" | "neutral";
}

export type ThinkingStatus = "pending" | "active" | "done" | "error";

export interface ThinkingStep {
  id: string;
  label: string;
  status: ThinkingStatus;
  detail?: string;
  /** What happened behind the scenes */
  subSteps?: string[];
  /** How long this step took (set on completion) */
  durationMs?: number;
  /** Whether sub-steps are visible */
  expanded?: boolean;
  /** Steps with the same parallelGroup run concurrently */
  parallelGroup?: string;
  /** When this step completes, replace the next placeholder step with these */
  expandsInto?: ThinkingStep[];
  /** ID of a placeholder step this expansion replaces */
  replacesId?: string;
}

// --- Session snapshot (persisted per conversation) ---

export interface SessionSnapshot {
  messages: ChatMessage[];
  serviceContext: ServiceContext | null;
  stageContextMap: Record<number, SummaryRow[]>;
  activeStage: number;
  completedStages: number[];
  isDemoMode: boolean;
  demoStep: number;
  demoInputSuggestion: SuggestedPrompt | null;
  demoInlineSuggestions: SuggestedPrompt[];
  thinkingSteps: ThinkingStep[];
  isAgentTyping: boolean;
}

// --- Store ---

interface ChatState {
  // Active stage
  activeStage: number;
  completedStages: number[];

  // Messages
  messages: ChatMessage[];
  isAgentTyping: boolean;
  thinkingSteps: ThinkingStep[];

  // Sessions
  sessions: ChatSession[];
  activeSessionId: string | null;
  /** Per-session state storage */
  sessionSnapshots: Record<string, SessionSnapshot>;

  // Service context
  serviceContext: ServiceContext | null;
  /** Per-stage summary rows for the context panel */
  stageContextMap: Record<number, SummaryRow[]>;

  // Demo
  isDemoMode: boolean;
  demoStep: number;
  /** Suggestion shown above the input bar (single prefill) */
  demoInputSuggestion: SuggestedPrompt | null;
  /** Suggestions shown inline after the agent message (follow-ups) */
  demoInlineSuggestions: SuggestedPrompt[];

  // User
  userName: string;
  userRole: string;

  // Actions
  setActiveStage: (stage: number) => void;
  completeStage: (stage: number) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setIsAgentTyping: (typing: boolean) => void;
  setThinkingSteps: (steps: ThinkingStep[]) => void;
  setServiceContext: (ctx: ServiceContext | null) => void;
  setStageContext: (stageId: number, rows: SummaryRow[]) => void;
  createSession: (title: string) => string;
  setActiveSession: (id: string) => void;
  /** Load a session by ID from URL (restores snapshot if exists) */
  loadSession: (id: string) => boolean;
  /** Clear active session (return to landing) */
  clearSession: () => void;
  sendMessage: (content: string) => void;
  startDemo: () => string;
  advanceDemo: (userMessage: string) => void;
  reset: () => void;
}

let messageCounter = 0;

/** Helper: capture current session state as a snapshot */
function captureSnapshot(s: ChatState): SessionSnapshot {
  return {
    messages: s.messages,
    serviceContext: s.serviceContext,
    stageContextMap: s.stageContextMap,
    activeStage: s.activeStage,
    completedStages: s.completedStages,
    isDemoMode: s.isDemoMode,
    demoStep: s.demoStep,
    demoInputSuggestion: s.demoInputSuggestion,
    demoInlineSuggestions: s.demoInlineSuggestions,
    thinkingSteps: s.thinkingSteps,
    isAgentTyping: s.isAgentTyping,
  };
}

/** Helper: apply a snapshot to the store state */
function applySnapshot(snap: SessionSnapshot): Partial<ChatState> {
  return {
    messages: snap.messages,
    serviceContext: snap.serviceContext,
    stageContextMap: snap.stageContextMap,
    activeStage: snap.activeStage,
    completedStages: snap.completedStages,
    isDemoMode: snap.isDemoMode,
    demoStep: snap.demoStep,
    demoInputSuggestion: snap.demoInputSuggestion,
    demoInlineSuggestions: snap.demoInlineSuggestions,
    thinkingSteps: snap.thinkingSteps,
    isAgentTyping: snap.isAgentTyping,
  };
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeStage: 1,
  completedStages: [],
  messages: [],
  isAgentTyping: false,
  thinkingSteps: [],
  sessions: [],
  activeSessionId: null,
  sessionSnapshots: {},
  serviceContext: null,
  stageContextMap: {},
  isDemoMode: false,
  demoStep: 0,
  demoInputSuggestion: null,
  demoInlineSuggestions: [],
  userName: "Thomas Meyer",
  userRole: "IB Product Owner",

  setActiveStage: (stage) => set({ activeStage: stage }),

  completeStage: (stage) =>
    set((s) => ({
      completedStages: s.completedStages.includes(stage)
        ? s.completedStages
        : [...s.completedStages, stage],
    })),

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  updateMessage: (id, updates) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  setIsAgentTyping: (typing) => set({ isAgentTyping: typing }),
  setThinkingSteps: (steps) => set({ thinkingSteps: steps }),

  setServiceContext: (ctx) => set({ serviceContext: ctx }),
  setStageContext: (stageId, rows) =>
    set((s) => ({ stageContextMap: { ...s.stageContextMap, [stageId]: rows } })),

  createSession: (title) => {
    const id = `session-${Date.now()}`;
    const session: ChatSession = {
      id,
      title,
      stageId: 1,
      createdAt: new Date(),
      isActive: true,
    };
    // Save current session snapshot before switching
    const state = get();
    const snapshots = { ...state.sessionSnapshots };
    if (state.activeSessionId) {
      snapshots[state.activeSessionId] = captureSnapshot(state);
    }
    set({
      sessions: state.sessions.map((ses) => ({ ...ses, isActive: false })).concat(session),
      activeSessionId: id,
      sessionSnapshots: snapshots,
      messages: [],
      activeStage: 1,
      completedStages: [],
      serviceContext: null,
      stageContextMap: {},
      isDemoMode: false,
      demoStep: 0,
      demoInputSuggestion: null,
      demoInlineSuggestions: [],
      thinkingSteps: [],
      isAgentTyping: false,
    });
    return id;
  },

  setActiveSession: (id) => {
    const state = get();
    if (state.activeSessionId === id) return;
    // Save current session snapshot
    const snapshots = { ...state.sessionSnapshots };
    if (state.activeSessionId) {
      snapshots[state.activeSessionId] = captureSnapshot(state);
    }
    // Restore target session snapshot
    const snap = snapshots[id];
    const base = snap ? applySnapshot(snap) : {
      messages: [],
      activeStage: 1,
      completedStages: [],
      serviceContext: null,
      stageContextMap: {},
      isDemoMode: false,
      demoStep: 0,
      demoInputSuggestion: null,
      demoInlineSuggestions: [],
      thinkingSteps: [],
      isAgentTyping: false,
    };
    set({
      ...base,
      sessions: state.sessions.map((ses) => ({ ...ses, isActive: ses.id === id })),
      activeSessionId: id,
      sessionSnapshots: snapshots,
    });
  },

  loadSession: (id) => {
    const state = get();
    // Already active
    if (state.activeSessionId === id) return true;
    // Check if session exists
    const exists = state.sessions.some((s) => s.id === id);
    if (!exists) return false;
    // Use setActiveSession
    get().setActiveSession(id);
    return true;
  },

  clearSession: () => {
    const state = get();
    if (!state.activeSessionId) return;
    // Save current session snapshot
    const snapshots = { ...state.sessionSnapshots };
    snapshots[state.activeSessionId] = captureSnapshot(state);
    set({
      activeSessionId: null,
      sessionSnapshots: snapshots,
      messages: [],
      activeStage: 1,
      completedStages: [],
      serviceContext: null,
      stageContextMap: {},
      isDemoMode: false,
      demoStep: 0,
      demoInputSuggestion: null,
      demoInlineSuggestions: [],
      thinkingSteps: [],
      isAgentTyping: false,
      sessions: state.sessions.map((ses) => ({ ...ses, isActive: false })),
    });
  },

  sendMessage: (content) => {
    const id = `msg-${++messageCounter}-${Date.now()}`;
    const userMsg: ChatMessage = {
      id,
      role: "user",
      content,
      timestamp: new Date(),
    };
    set((s) => ({
      messages: [...s.messages, userMsg],
      isAgentTyping: true,
    }));

    // Trigger agent response via SSE
    void handleAgentResponse(content, get, set);
  },

  reset: () =>
    set({
      activeStage: 1,
      completedStages: [],
      messages: [],
      isAgentTyping: false,
      thinkingSteps: [],
      serviceContext: null,
      stageContextMap: {},
      isDemoMode: false,
      demoStep: 0,
      demoInputSuggestion: null,
      demoInlineSuggestions: [],
    }),

  startDemo: () => {
    const id = `session-demo-${Date.now()}`;
    const session: ChatSession = {
      id,
      title: "IB Investment Research API",
      serviceName: "Research API",
      stageId: 1,
      createdAt: new Date(),
      isActive: true,
    };
    // Save current session snapshot before switching
    const state = get();
    const snapshots = { ...state.sessionSnapshots };
    if (state.activeSessionId) {
      snapshots[state.activeSessionId] = captureSnapshot(state);
    }
    set({
      sessions: state.sessions.map((ses) => ({ ...ses, isActive: false })).concat(session),
      activeSessionId: id,
      sessionSnapshots: snapshots,
      messages: [],
      activeStage: 1,
      completedStages: [],
      serviceContext: null,
      stageContextMap: {},
      isDemoMode: true,
      demoStep: 0,
      demoInputSuggestion: null,
      demoInlineSuggestions: [],
      isAgentTyping: false,
    });

    // Play step 0 instantly
    void playDemoStep(0, set, true);
    return id;
  },

  advanceDemo: (userMessage: string) => {
    const { demoStep } = get();
    const nextStep = demoStep + 1;

    if (nextStep >= DEMO_STEPS.length) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `demo-user-${nextStep}-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    set((s) => ({
      messages: [...s.messages, userMsg],
      isAgentTyping: true,
      demoInputSuggestion: null,
      demoInlineSuggestions: [],
      demoStep: nextStep,
    }));

    // Play agent response with thinking delay
    void playDemoStep(nextStep, set);
  },
}));

// --- Demo step player ---

type SetFn = (partial: Partial<ChatState> | ((s: ChatState) => Partial<ChatState>)) => void;

/** Parse RPO value from the user's slider confirmation message and patch step data */
function patchRpoStep(step: DemoStep): DemoStep {
  const store = useChatStore.getState();
  const lastUserMsg = [...store.messages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg) return step;

  // Parse "Set RPO to 30 min. Estimated Pilot Light cost: $440k/year."
  const rpoMatch = lastUserMsg.content.match(/Set RPO to (.+?)\./);
  const costMatch = lastUserMsg.content.match(/Pilot Light cost: (.+?)\/year/);
  if (!rpoMatch) return step;

  const rpoValue = rpoMatch[1]!;
  const costValue = costMatch?.[1] ?? step.serviceContext?.pilotLightTarget ?? "$480k";

  // Deep-patch the step
  const msg = step.agentMessage;
  return {
    ...step,
    agentMessage: {
      ...msg,
      content: msg.content.replace(/RPO set/, `RPO ${rpoValue} set`),
      tables: msg.tables?.map((table) => ({
        ...table,
        rows: table.rows.map((row) =>
          row.label === "RPO set" ? { ...row, value: `${rpoValue} (set)` } : row,
        ),
      })),
    },
    serviceContext: step.serviceContext
      ? { ...step.serviceContext, rpo: rpoValue, pilotLightTarget: `${costValue} / year` }
      : undefined,
    contextSummary: step.contextSummary?.map((row) =>
      row.label === "RPO" ? { ...row, value: `${rpoValue} (set)` } : row,
    ),
  };
}

async function playDemoStep(stepIndex: number, set: SetFn, instant = false) {
  let step = DEMO_STEPS[stepIndex];
  if (!step) return;

  // Patch S2-5 (RPO confirmation) with the user's actual slider selection
  if (step.agentMessage.id === "demo-s2-aha") {
    step = patchRpoStep(step);
  }

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let thinkingLog: ThinkingStep[] | undefined;

  if (!instant && step.thinkingSteps && step.thinkingSteps.length > 0) {
    // Progressive thinking steps with varied timing and sub-step reveals
    const steps = step.thinkingSteps;

    // Per-step timing profiles (ms) - some steps are fast, some slow
    const STEP_TIMINGS: Record<string, [number, number]> = {
      t1: [500, 900],     // Auth
      t2: [700, 1400],    // Subscription scan
      t3: [900, 2000],    // Resource discovery - medium
      t4: [800, 1800],    // Resource discovery
      t5: [500, 1000],    // Dev has fewer resources
      t6: [1500, 3000],   // Cost API is slow
      t7: [800, 1600],    // Budget comparison
      t8: [1000, 2200],   // Pilot Light evaluation
      t9: [600, 1200],    // Report generation
      f1: [1000, 2000],   // DR utilisation analysis
      f2: [700, 1400],    // Budget compliance
      f3: [900, 1800],    // Resource DR compatibility
      f4: [800, 1500],    // Catalogue scan
      f5: [600, 1200],    // Question identification
      // Stage 2: RTO & RPO
      "s2-t1": [800, 1500],   // SMDB query
      "s2-t2": [600, 1200],   // Tier classification
      "s2-t3": [500, 900],    // RTO check
      "s2-t4": [500, 1000],   // RPO check
      "s2-t5": [700, 1400],   // BCM policy load
      "s2-t6": [900, 1800],   // Architecture comparison
      "s2-r1": [800, 1600],   // Tier re-evaluation
      "s2-r2": [600, 1200],   // RPO setting
      "s2-r3": [1000, 2000],  // Cost recalculation
      // Stage 3: Adopt Pilot Light
      "s3-t1": [800, 1500],   // SMDB scan
      "s3-t2": [900, 1800],   // CMDB inventory
      "s3-t3": [1000, 2000],  // Pilot Light catalogue match
      "s3-t4": [700, 1400],   // CAF scope check
      "s3-t5": [600, 1200],   // Out-of-scope flagging
      "s3-a1": [800, 1600],   // Architecture mapping
      "s3-a2": [600, 1200],   // Out-of-scope request
      "s3-a3": [1200, 2400],  // IaC template generation
      "s3-a4": [900, 1800],   // Runbook generation
      "s3-a5": [700, 1400],   // Security attestation
    };

    // Show all steps upfront as pending
    const allSteps: ThinkingStep[] = steps.map((s) => ({
      ...s,
      status: "pending" as const,
      subSteps: [],
      expanded: false,
    }));
    set({ thinkingSteps: [...allSteps] });
    await delay(300);

    // Helpers
    const refresh = () => set({ thinkingSteps: [...allSteps] });
    const markAt = (idx: number, updates: Partial<ThinkingStep>) => {
      Object.assign(allSteps[idx]!, updates);
      refresh();
    };

    // Process steps dynamically (supports expansion and parallel groups)
    let i = 0;
    while (i < allSteps.length) {
      const stepDef = allSteps[i]!;
      if (stepDef.status === "done") { i++; continue; }

      // Find the original step definition (for subSteps, expandsInto, etc.)
      const origDef = steps.find((s) => s.id === stepDef.id) ?? stepDef;

      // Check for parallel group
      const parallelIds: number[] = [i];
      if (stepDef.parallelGroup) {
        for (let j = i + 1; j < allSteps.length; j++) {
          if (allSteps[j]!.parallelGroup === stepDef.parallelGroup && allSteps[j]!.status === "pending") {
            parallelIds.push(j);
          } else break;
        }
      }

      if (parallelIds.length > 1) {
        // --- Parallel execution ---
        const states = parallelIds.map((idx) => {
          const orig = steps.find((s) => s.id === allSteps[idx]!.id) ?? allSteps[idx]!;
          return {
            idx,
            origSubs: orig.subSteps ?? [],
            detail: orig.detail,
            revealedSubs: 0,
            startTime: Date.now(),
          };
        });

        for (const s of states) markAt(s.idx, { status: "active", subSteps: [], expanded: true });
        await delay(200 + Math.random() * 300);

        const allParDone = () => states.every((s) => s.revealedSubs >= s.origSubs.length);
        while (!allParDone()) {
          const pend = states.filter((s) => s.revealedSubs < s.origSubs.length);
          if (pend.length === 0) break;
          const pick = pend[Math.floor(Math.random() * pend.length)]!;
          pick.revealedSubs++;

          const [mn, mx] = STEP_TIMINGS[allSteps[pick.idx]!.id] ?? [700, 1400];
          await delay((mn + Math.random() * (mx - mn)) / (pick.origSubs.length + 1));

          markAt(pick.idx, {
            subSteps: pick.origSubs.slice(0, pick.revealedSubs),
            ...(pick.revealedSubs >= pick.origSubs.length
              ? { status: "done" as const, durationMs: Date.now() - pick.startTime, detail: pick.detail, expanded: false }
              : {}),
          });
        }

        await delay(150 + Math.random() * 200);
        for (const s of states) {
          if (allSteps[s.idx]!.status !== "done") {
            markAt(s.idx, { status: "done", durationMs: Date.now() - s.startTime, detail: s.detail, expanded: false });
          }
        }
        i = Math.max(...parallelIds) + 1;
      } else {
        // --- Sequential execution ---
        const stepStart = Date.now();
        markAt(i, { status: "active", subSteps: [], expanded: true });

        const [minMs, maxMs] = STEP_TIMINGS[stepDef.id] ?? [700, 1400];
        await delay(200 + Math.random() * 400);

        const subs = origDef.subSteps ?? [];
        for (let s = 0; s < subs.length; s++) {
          const perSubMin = minMs / (subs.length + 1);
          const perSubMax = maxMs / (subs.length * 0.6);
          await delay(perSubMin + Math.random() * (perSubMax - perSubMin));
          markAt(i, { subSteps: subs.slice(0, s + 1) });
        }

        await delay(150 + Math.random() * 200);
        markAt(i, { status: "done", durationMs: Date.now() - stepStart, detail: origDef.detail, expanded: false });

        // Dynamic expansion: replace a placeholder with discovered steps
        if (origDef.expandsInto && origDef.replacesId) {
          const placeholderIdx = allSteps.findIndex((s) => s.id === origDef.replacesId);
          if (placeholderIdx !== -1) {
            const newSteps = origDef.expandsInto.map((s) => ({
              ...s,
              status: "pending" as const,
              subSteps: [] as string[],
              expanded: false,
            }));
            allSteps.splice(placeholderIdx, 1, ...newSteps);
            refresh();
            await delay(400);
          }
        }

        i++;
      }
    }

    // Keep completed steps briefly visible
    await delay(500);
    // Store the completed log for attachment to the message
    thinkingLog = [...allSteps];
    set({ thinkingSteps: [] });
  } else if (!instant) {
    await delay(2000 + Math.random() * 1000);
  }

  // Stream the agent message text
  const fullMsg = step.agentMessage;
  const fullContent = fullMsg.content;
  const fullTables = fullMsg.tables ?? [];
  const msgId = `${fullMsg.id}-${Date.now()}`;

  if (!instant && fullContent.length > 0) {
    // Create the message shell (streaming)
    const streamMsg: ChatMessage = {
      ...fullMsg,
      id: msgId,
      content: "",
      tables: [],
      isStreaming: true,
      timestamp: new Date(),
      thinkingLog,
    };
    set((s) => ({
      messages: [...s.messages, streamMsg],
      isAgentTyping: false,
    }));

    // Stream text in chunks (word by word, batched for speed)
    const words = fullContent.split(/(\s+)/);
    let streamed = "";
    const chunkSize = 3; // words per tick
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join("");
      streamed += chunk;
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === msgId ? { ...m, content: streamed } : m,
        ),
      }));
      await delay(25 + Math.random() * 20);
    }

    // Reveal badges
    if (fullMsg.badges && fullMsg.badges.length > 0) {
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === msgId ? { ...m, badges: fullMsg.badges } : m,
        ),
      }));
      await delay(200);
    }

    // Reveal tables one by one
    for (let t = 0; t < fullTables.length; t++) {
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === msgId
            ? { ...m, tables: fullTables.slice(0, t + 1) }
            : m,
        ),
      }));
      await delay(400 + Math.random() * 200);
    }

    // Reveal widget
    if (fullMsg.widget) {
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === msgId ? { ...m, widget: fullMsg.widget } : m,
        ),
      }));
      await delay(300);
    }

    // Mark streaming complete
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === msgId ? { ...m, isStreaming: false } : m,
      ),
    }));
  } else {
    // Instant reveal
    set((s) => ({
      messages: [...s.messages, { ...fullMsg, id: msgId, timestamp: new Date(), thinkingLog }],
      isAgentTyping: false,
    }));
  }

  // Update service context
  if (step.serviceContext) {
    set({ serviceContext: step.serviceContext });
  }
  if (step.contextSummary) {
    set((s) => ({
      stageContextMap: { ...s.stageContextMap, [step.contextStageId ?? s.activeStage]: step.contextSummary! },
    }));
  }

  // Handle stage transition
  if (step.stageTransition) {
    const { stageId, completeStage } = step.stageTransition;
    set((s) => ({
      activeStage: stageId,
      completedStages: completeStage && !s.completedStages.includes(completeStage)
        ? [...s.completedStages, completeStage]
        : s.completedStages,
    }));
  }

  // Show suggestions after a brief pause
  await delay(300);

  // Check if the next step should auto-play
  // STOP if the current step has inputSuggestion (user must act first)
  if (step.inputSuggestion) {
    set({
      demoInputSuggestion: step.inputSuggestion,
      demoInlineSuggestions: [],
    });
    return;
  }

  // STOP if the agent message has a widget (user interacts with it)
  if (step.agentMessage.widget) {
    set({ demoInputSuggestion: null, demoInlineSuggestions: [] });
    return;
  }

  // STOP if the current step has inlineSuggestions (user chooses a follow-up)
  if (step.inlineSuggestions) {
    set({
      demoInputSuggestion: null,
      demoInlineSuggestions: step.inlineSuggestions,
    });
    return;
  }

  // Otherwise auto-play the next step if it exists
  const nextStep = DEMO_STEPS[stepIndex + 1];
  if (nextStep) {
    set({ isAgentTyping: true, demoStep: stepIndex + 1 });
    await playDemoStep(stepIndex + 1, set);
  } else {
    set({ demoInputSuggestion: null, demoInlineSuggestions: [] });
  }
}

// --- Agent SSE handler ---

async function handleAgentResponse(
  message: string,
  _get: () => ChatState,
  set: (partial: Partial<ChatState> | ((s: ChatState) => Partial<ChatState>)) => void,
) {
  const responseId = `msg-agent-${++messageCounter}-${Date.now()}`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("text/event-stream")) {
      // SSE stream
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";

      const agentMsg: ChatMessage = {
        id: responseId,
        role: "agent",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };
      set((s) => ({ messages: [...s.messages, agentMsg] }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "response_delta" && event.content) {
              content += event.content;
              set((s) => ({
                messages: s.messages.map((m) =>
                  m.id === responseId ? { ...m, content } : m,
                ),
              }));
            } else if (event.type === "response_end") {
              if (event.content) content = event.content;
              set((s) => ({
                messages: s.messages.map((m) =>
                  m.id === responseId
                    ? { ...m, content, isStreaming: false }
                    : m,
                ),
                isAgentTyping: false,
              }));
            }
          } catch {
            // skip
          }
        }
      }

      set({ isAgentTyping: false });
    } else {
      // JSON fallback
      const data = await response.json();
      const agentMsg: ChatMessage = {
        id: responseId,
        role: "agent",
        content: data.response ?? JSON.stringify(data),
        timestamp: new Date(),
      };
      set((s) => ({
        messages: [...s.messages, agentMsg],
        isAgentTyping: false,
      }));
    }
  } catch (err) {
    const agentMsg: ChatMessage = {
      id: responseId,
      role: "agent",
      content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      timestamp: new Date(),
    };
    set((s) => ({
      messages: [...s.messages, agentMsg],
      isAgentTyping: false,
    }));
  }
}
