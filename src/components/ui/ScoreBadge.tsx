interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const config = {
    excelente: { color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "Excelente", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
    bueno: { color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", label: "Bueno", bg: "bg-amber-50 dark:bg-amber-950/20" },
    regular: { color: "bg-orange-500", text: "text-orange-600 dark:text-orange-400", label: "Regular", bg: "bg-orange-50 dark:bg-orange-950/20" },
    bajo: { color: "bg-red-500", text: "text-red-600 dark:text-red-400", label: "Bajo", bg: "bg-red-50 dark:bg-red-950/20" },
    nulo: { color: "bg-gray-400", text: "text-gray-500 dark:text-gray-400", label: "Nulo", bg: "bg-gray-50 dark:bg-gray-800/50" },
  };

  function getLevel(s: number) {
    if (s >= 85) return "excelente";
    if (s >= 60) return "bueno";
    if (s >= 35) return "regular";
    if (s > 0) return "bajo";
    return "nulo";
  }

  const level = getLevel(score);
  const c = config[level];
  const sizes = { sm: "text-xs px-2 py-0.5", md: "text-sm px-3 py-1", lg: "text-base px-4 py-1.5" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizes[size]} ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.color} ${score >= 85 ? "animate-pulse" : ""}`} />
      {score > 0 ? `${score}` : "—"}
      {size !== "sm" && <span className="opacity-60">{c.label}</span>}
    </span>
  );
}
