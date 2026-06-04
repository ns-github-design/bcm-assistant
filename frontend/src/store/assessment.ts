import { create } from "zustand";
import type { AssessmentResult, TimelineEntry } from "../types";

interface AssessmentState {
  // Assessment data
  subscriptionId: string | null;
  useMock: boolean;
  assessmentResult: AssessmentResult | null;
  isAssessing: boolean;

  // Agent timeline
  timeline: TimelineEntry[];

  // Actions
  setSubscription: (id: string, useMock: boolean) => void;
  setAssessmentResult: (result: AssessmentResult) => void;
  setIsAssessing: (value: boolean) => void;
  addTimelineEntry: (entry: TimelineEntry) => void;
  updateTimelineEntry: (id: string, updates: Partial<TimelineEntry>) => void;
  reset: () => void;
}

export const useAssessmentStore = create<AssessmentState>((set) => ({
  subscriptionId: null,
  useMock: true,
  assessmentResult: null,
  isAssessing: false,
  timeline: [],

  setSubscription: (id, useMock) => set({ subscriptionId: id, useMock }),

  setAssessmentResult: (result) =>
    set({ assessmentResult: result, isAssessing: false }),

  setIsAssessing: (value) => set({ isAssessing: value }),

  addTimelineEntry: (entry) =>
    set((state) => ({ timeline: [...state.timeline, entry] })),

  updateTimelineEntry: (id, updates) =>
    set((state) => ({
      timeline: state.timeline.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      ),
    })),

  reset: () =>
    set({
      subscriptionId: null,
      assessmentResult: null,
      isAssessing: false,
      timeline: [],
    }),
}));
