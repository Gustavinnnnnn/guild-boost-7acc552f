import { Pause, Play, Eye, MousePointerClick, Users } from "lucide-react";
import { mockCampaigns } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

const statusStyle: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  paused: "bg-warning/15 text-warning border-warning/30",
  finished: "bg-muted text-muted-foreground border-border",
};
const statusLabel: Record<string, string> = {
  active: "Ativa",
  paused: "Pausada",
  finished: "Finalizada",
};

const Campaigns = () => {
  return (
    <div className="space-y-4 max-w-6xl">
      {mockCampaigns.map((c) => {
        const pct = (c.spent / c.budget) * 100;
        return (
          <div key={c.id} className="rounded-xl bg-card border border-border p-6 hover:border-primary/40 transition-smooth">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg">{c.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${statusStyle[c.status]}`}>
                    {statusLabel[c.status]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{c.server} · {c.niche}</p>
              </div>
              <div className="flex gap-2">
                {c.status === "active" ? (
                  <Button size="sm" variant="secondary" className="gap-1.5"><Pause className="h-3.5 w-3.5" /> Pausar</Button>
                ) : c.status === "paused" ? (
                  <Button size="sm" variant="discord" className="gap-1.5"><Play className="h-3.5 w-3.5" /> Retomar</Button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-5">
              <Metric icon={Eye} label="Impressões" value={c.impressions.toLocaleString()} />
              <Metric icon={MousePointerClick} label="Cliques" value={c.clicks.toLocaleString()} />
              <Metric icon={Users} label="Membros" value={`+${c.members}`} highlight />
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Orçamento</span>
                <span className="font-semibold">R$ {c.spent.toFixed(2)} / R$ {c.budget}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Metric = ({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) => (
  <div className="rounded-lg bg-secondary/40 border border-border p-3">
    <Icon className={`h-4 w-4 mb-1.5 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
    <div className={`text-lg font-bold ${highlight ? "text-primary" : ""}`}>{value}</div>
    <div className="text-[11px] text-muted-foreground">{label}</div>
  </div>
);

export default Campaigns;
