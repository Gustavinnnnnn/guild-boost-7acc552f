import { useEffect, useState } from "react";
import { Users, MousePointerClick, Megaphone, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Campaign = {
  id: string; name: string; niche: string; status: string;
  impressions: number; clicks: number; members_gained: number;
  servers?: { name: string } | null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("campaigns")
      .select("id,name,niche,status,impressions,clicks,members_gained,servers(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setCampaigns((data as any) ?? []));
  }, [user]);

  const totals = campaigns.reduce(
    (acc, c) => ({
      members: acc.members + c.members_gained,
      clicks: acc.clicks + c.clicks,
      active: acc.active + (c.status === "active" ? 1 : 0),
    }),
    { members: 0, clicks: 0, active: 0 }
  );
  const conversion = totals.clicks > 0 ? ((totals.members / totals.clicks) * 100).toFixed(1) : "0.0";

  const stats = [
    { label: "Membros ganhos", value: totals.members.toLocaleString(), icon: Users, color: "text-primary" },
    { label: "Cliques totais", value: totals.clicks.toLocaleString(), icon: MousePointerClick, color: "text-success" },
    { label: "Campanhas ativas", value: String(totals.active), icon: Megaphone, color: "text-warning" },
    { label: "Conversão", value: `${conversion}%`, icon: TrendingUp, color: "text-primary-glow" },
  ];

  // Simulated 7-day growth based on totals
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const chartData = days.map((day, i) => ({
    day,
    members: Math.round((totals.members / 7) * (0.6 + i * 0.12)),
    clicks: Math.round((totals.clicks / 7) * (0.6 + i * 0.12)),
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card border border-border p-5 hover:border-primary/40 transition-smooth">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="text-2xl md:text-3xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-lg">Crescimento da semana</h2>
            <p className="text-xs text-muted-foreground">Distribuição de membros e cliques</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(235 86% 65%)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(235 86% 65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Area type="monotone" dataKey="members" stroke="hsl(235 86% 65%)" fill="url(#g1)" strokeWidth={2} />
              <Line type="monotone" dataKey="clicks" stroke="hsl(139 47% 55%)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Campanhas recentes</h2>
          <Link to="/app/criar-campanha"><Button variant="discord" size="sm">+ Nova campanha</Button></Link>
        </div>
        {campaigns.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Nenhuma campanha ainda. <Link to="/app/criar-campanha" className="text-primary hover:underline">Crie a primeira</Link>.
          </div>
        ) : (
          <div className="space-y-2">
            {campaigns.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 hover:bg-secondary transition-smooth">
                <div>
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.servers?.name ?? "—"} · {c.niche}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">+{c.members_gained}</div>
                  <div className="text-xs text-muted-foreground">membros</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
