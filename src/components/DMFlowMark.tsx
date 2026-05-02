import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
};

const SIZES = {
  sm: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-base" },
  md: { box: "h-10 w-10", icon: "h-5 w-5", text: "text-lg" },
  lg: { box: "h-14 w-14", icon: "h-7 w-7", text: "text-xl" },
  xl: { box: "h-20 w-20", icon: "h-10 w-10", text: "text-3xl" },
};

/**
 * Logo / mark oficial do DMFlow.
 * Use como wordmark completo ou apenas o ícone (showWordmark={false}).
 */
export const DMFlowMark = ({ size = "md", showWordmark = true, className }: Props) => {
  const s = SIZES[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          s.box,
          "relative rounded-xl bg-gradient-to-br from-primary via-primary-glow to-primary grid place-items-center shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.7),inset_0_1px_0_hsl(0_0%_100%/0.25)]",
        )}
      >
        <Rocket className={cn(s.icon, "text-primary-foreground")} strokeWidth={2.5} />
        <span className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/10 to-white/0 pointer-events-none" />
      </div>
      {showWordmark && (
        <span className={cn(s.text, "font-display font-black tracking-tight leading-none")}>
          DM<span className="text-primary">FLOW</span>
        </span>
      )}
    </div>
  );
};
