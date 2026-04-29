import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const COLORS = ["hsl(235 86% 65%)", "hsl(265 80% 65%)", "hsl(139 47% 55%)"];
const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 };

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl bg-card border border-border p-6">
    <h3 className="font-bold mb-4">{title}</h3>
    <div className="h-64">{children}</div>
  </div>
);

const Analytics = () => {
  const { user } = useAuth();
  const [totals, setTotals] = useState({ members: 0, clicks: 0, impressions: 0, spent: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("campaigns").select("members_gained,clicks,impressions,spent").eq("user_id", user.id).then(({ data }) => {
      const t = (data ?? []).reduce((acc, c: any) => ({
        members: acc.members + c.members_gained,
        clicks: acc.clicks + c.clicks,
        impressions: acc.impressions + c.impressions,
        spent: acc.spent + Number(c.spent),
      }), { members: 0, clicks: 0, impressions: 0, spent: 0 });
      setTotals(t);
    });
  }, [user]);

  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const growth = days.map((day, i) => ({
    day,
    members: Math.round((totals.members / 7) * (0.6 + i * 0.12)),
    clicks: Math.round((totals.clicks / 7) * (0.6 + i * 0.12)),
  }));
  const sources = [
    { name: "Bot Discord", value: 62 },
    { name: "Convite Direto", value: 23 },
    { name: "Indicação", value: 15 },
  ];
  const conversion = totals.clicks > 0 ? ((totals.members / totals.clicks) * 100).toFixed(1) : "0.0";
  const cpm = totals.impressions > 0 ? ((totals.spent / totals.impressions) * 1000).toFixed(2) : "0.00";
  const cpu = totals.members > 0 ? (totals.spent / totals.members).toFixed(2) : "0.00";

  return (
    <div className="grid lg:grid-cols-2 gap-5 max-w-6xl">
      <Card title="Crescimento de membros">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={growth}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="members" stroke="hsl(235 86% 65%)" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Cliques na semana">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={growth}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="clicks" fill="hsl(265 80% 65%)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Origem dos usuários">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={sources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Resumo geral">
        <div className="grid grid-cols-2 gap-3 h-full content-center">
          {[
            { l: "Total membros", v: totals.members.toLocaleString() },
            { l: "Taxa conversão", v: `${conversion}%` },
            { l: "CPM médio", v: `R$ ${cpm}` },
            { l: "Custo por membro", v: `R$ ${cpu}` },
          ].map((s) => (
            <div key={s.l} className="rounded-lg bg-secondary/40 p-4">
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="text-2xl font-bold mt-1">{s.v}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
