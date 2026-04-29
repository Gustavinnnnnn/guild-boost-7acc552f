import { useEffect, useState } from "react";
import { Pause, Play, Eye, MousePointerClick, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const statusStyle: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  paused: "bg-warning/15 text-warning border-warning/30",
  finished: "bg-muted text-muted-foreground border-border",
};
const statusLabel: Record<string, string> = { active: "Ativa", paused: "Pausada", finished: "Finalizada" };

type Campaign = {
  id: string; name: string; niche: string; status: string;
  impressions: number; clicks: number; members_gained: number;
  budget: number; spent: number;
  servers?: { name: string } | null;
};

const Campaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("campaigns")
      .select("id,name,niche,status,impressions,clicks,members_gained,budget,spent,servers(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setCampaigns((data as any) ?? []);
  };

  useEffect(() => { load(); }, [user]);

  // Simulate live growth every 5s for active campaigns
  useEffect(() => {
    if (!user) return;
    const t = setInterval(async () => {
      const actives = campaigns.filter((c) => c.status === "active" && c.spent < c.budget);
      for (const c of actives) {
        const newClicks = c.clicks + Math.floor(Math.random() * 8 + 2);
        const newMembers = c.members_gained + Math.floor(Math.random() * 3);
        const newImpressions = c.impressions + Math.floor(Math.random() * 80 + 20);
        const newSpent = Math.min(+(c.spent + Math.random() * 0.5).toFixed(2), c.budget);
        const newStatus = newSpent >= c.budget ? "finished" : "active";
        await supabase.from("campaigns").update({
          clicks: newClicks, members_gained: newMembers,
          impressions: newImpressions, spent: newSpent, status: newStatus,
        }).eq("id", c.id);
      }
      if (actives.length) load();
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns, user]);

  const toggleStatus = async (c: Campaign) => {
    const newStatus = c.status === "active" ? "paused" : "active";
    await supabase.from("campaigns").update({ status: newStatus }).eq("id", c.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("campaigns").delete().eq("id", id);
    toast.success("Campanha removida");
    load();
  };

  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border p-12 text-center max-w-2xl">
        <div className="text-5xl mb-3">🚀</div>
        <h3 className="font-bold mb-1">Nenhuma campanha ainda</h3>
        <p className="text-sm text-muted-foreground mb-4">Crie sua primeira campanha para começar a crescer.</p>
        <Link to="/app/criar-campanha"><Button variant="discord">Criar campanha</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl">
      {campaigns.map((c) => {
        const pct = (Number(c.spent) / Number(c.budget)) * 100;
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
                <p className="text-sm text-muted-foreground">{c.servers?.name ?? "—"} · {c.niche}</p>
              </div>
              <div className="flex gap-2">
                {c.status !== "finished" && (
                  <Button size="sm" variant={c.status === "active" ? "secondary" : "discord"} className="gap-1.5" onClick={() => toggleStatus(c)}>
                    {c.status === "active" ? <><Pause className="h-3.5 w-3.5" /> Pausar</> : <><Play className="h-3.5 w-3.5" /> Retomar</>}
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-5">
              <Metric icon={Eye} label="Impressões" value={c.impressions.toLocaleString()} />
              <Metric icon={MousePointerClick} label="Cliques" value={c.clicks.toLocaleString()} />
              <Metric icon={Users} label="Membros" value={`+${c.members_gained}`} highlight />
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Orçamento</span>
                <span className="font-semibold">R$ {Number(c.spent).toFixed(2)} / R$ {Number(c.budget).toFixed(2)}</span>
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
