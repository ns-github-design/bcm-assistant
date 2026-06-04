import { useChatStore, STAGES } from "../../store/chat";

export function StageBar() {
  const { activeStage, completedStages } = useChatStore();

  return (
    <div className="flex h-1 w-full bg-surface-inset">
      {STAGES.map((stage) => {
        const isCompleted = completedStages.includes(stage.id);
        const isActive = activeStage === stage.id;

        return (
          <div
            key={stage.id}
            className="flex-1 relative"
            title={`Stage ${stage.id}: ${stage.label}`}
          >
            <div
              className={`h-full transition-all duration-500 ${
                isCompleted
                  ? "bg-success"
                  : isActive
                    ? "bg-accent"
                    : "bg-transparent"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
