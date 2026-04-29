import { Users, MousePointerClick, Megaphone, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { growthData, mockCampaigns } from "@/lib/mock-data";

const stats = [
  { label: "Membros ganhos", value: "1.247", trend: "+18%", icon: Users, color: "text-primary" },
  { label: "Cliques totais", value: "9.842", trend: "+24%", icon: MousePointerClick, color: "text-success" },
  { label: "Campanhas ativas", value: "3", trend: "Nova", icon: Megaphone, color: "text-warning" },
  { label: "Conversão", value: "12.7%", trend: "+3.2%", icon: TrendingUp, color: "text-primary-glow" },
];

const Dashboard = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card border border-border p-5 hover:border-primary/40 transition-smooth">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <span className="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded">{s.trend}</span>
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
            <p className="text-xs text-muted-foreground">Membros e cliques nos últimos 7 dias</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(235 86% 65%)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(235 86% 65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                }}
              />
              <Area type="monotone" dataKey="members" stroke="hsl(235 86% 65%)" fill="url(#g1)" strokeWidth={2} />
              <Line type="monotone" dataKey="clicks" stroke="hsl(139 47% 55%)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-6">
        <h2 className="font-bold text-lg mb-4">Campanhas recentes</h2>
        <div className="space-y-2">
          {mockCampaigns.slice(0, 3).map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 hover:bg-secondary transition-smooth">
              <div>
                <div className="font-semibold text-sm">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.server} · {c.niche}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">+{c.members}</div>
                <div className="text-xs text-muted-foreground">membros</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
