import { Shell } from "@/components/layout/Shell";
import { DropZone } from "@/components/upload/DropZone";
import { ColumnMapper } from "@/components/upload/ColumnMapper";
import { ProcessingView } from "@/components/results/ProcessingView";
import { ResultsView } from "@/components/results/ResultsView";
import { useStore } from "@/hooks/useStore";

export default function App() {
  const step = useStore((s) => s.step);
  const isDark = useStore((s) => s.isDark);

  return (
    <div className={isDark ? "dark" : ""}>
      <Shell>
        {step === "upload" && <DropZone />}
        {step === "preview" && <ColumnMapper />}
        {step === "processing" && <ProcessingView />}
        {step === "results" && <ResultsView />}
      </Shell>
    </div>
  );
}
