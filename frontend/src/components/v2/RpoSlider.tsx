import { useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { useChatStore } from "../../store/chat";

export interface RpoSliderConfig {
  /** Minimum RPO value in minutes */
  min: number;
  /** Maximum RPO value in minutes */
  max: number;
  /** Initial value in minutes */
  initial: number;
  /** Step size in minutes */
  step: number;
  /** Pre-defined snap points (minutes) with labels */
  ticks: { value: number; label: string }[];
  /** Cost multiplier curve: maps RPO minutes to annual cost string */
  costCurve: { rpoMinutes: number; annualCost: string; saving: string }[];
}

interface Props {
  config: RpoSliderConfig;
}

export function RpoSlider({ config }: Props) {
  const [value, setValue] = useState(config.initial);
  const [confirmed, setConfirmed] = useState(false);
  const advanceDemo = useChatStore((s) => s.advanceDemo);
  const isDemoMode = useChatStore((s) => s.isDemoMode);

  const getCostInfo = useCallback(
    (rpo: number) => {
      let closest = config.costCurve[0]!;
      let minDist = Math.abs(rpo - closest.rpoMinutes);
      for (const entry of config.costCurve) {
        const dist = Math.abs(rpo - entry.rpoMinutes);
        if (dist < minDist) {
          closest = entry;
          minDist = dist;
        }
      }
      return closest;
    },
    [config.costCurve],
  );

  const formatRpo = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const costInfo = getCostInfo(value);

  const handleConfirm = () => {
    setConfirmed(true);
    if (isDemoMode) {
      advanceDemo(
        `Set RPO to ${formatRpo(value)}. Estimated Pilot Light cost: ${costInfo.annualCost}/year.`,
      );
    }
  };

  return (
    <div className="v2-card overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-surface-raised flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
          Set RPO
        </span>
        {confirmed && (
          <span className="inline-flex items-center gap-1 rounded-md border border-success/20 bg-success-muted px-2 py-0.5 text-[11px] font-medium text-success">
            <CheckCircle2 className="h-3 w-3" />
            Confirmed
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pt-4 pb-3">
        {/* Value display */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-foreground tabular-nums leading-none">
            {formatRpo(value)}
          </span>
          <span className="text-[11px] text-muted">max data loss</span>
        </div>

        {/* Radix slider */}
        <SliderPrimitive.Root
          min={config.min}
          max={config.max}
          step={config.step}
          value={[value]}
          onValueChange={([v]) => !confirmed && v != null && setValue(v)}
          disabled={confirmed}
          className="relative flex w-full touch-none select-none items-center h-5"
        >
          <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-inset">
            <SliderPrimitive.Range className="absolute h-full bg-accent rounded-full" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-accent bg-surface shadow-sm v2-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-50 hover:scale-110" />
        </SliderPrimitive.Root>

        {/* Tick labels */}
        <div className="flex justify-between mt-1.5 px-0.5">
          {config.ticks.map((tick) => (
            <button
              key={tick.value}
              onClick={() => !confirmed && setValue(tick.value)}
              disabled={confirmed}
              className={`text-[10px] font-mono v2-transition disabled:cursor-default ${
                value === tick.value ? "text-accent font-semibold" : "text-muted hover:text-muted-foreground"
              }`}
            >
              {tick.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm */}
      {!confirmed && (
        <div className="border-t border-border px-3 py-2.5">
          <button
            onClick={handleConfirm}
            className="w-full rounded-lg bg-accent text-white py-2 text-[12px] font-medium hover:bg-accent-hover v2-transition active:scale-[0.99]"
          >
            Confirm RPO - {formatRpo(value)}
          </button>
        </div>
      )}
    </div>
  );
}
