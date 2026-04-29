import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { growthData, sourceData } from "@/lib/mock-data";

const COLORS = ["hsl(235 86% 65%)", "hsl(265 80% 65%)", "hsl(139 47% 55%)"];

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl bg-card border border-border p-6">
    <h3 className="font-bold mb-4">{title}</h3>
    <div className="h-64">{children}</div>
  </div>
);

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
};

const Analytics = () => {
  return (
    <div className="grid lg:grid-cols-2 gap-5 max-w-6xl">
      <Card title="Crescimento de membros">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="members" stroke="hsl(235 86% 65%)" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Taxa de conversão (cliques → membros)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={growthData}>
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
            <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {sourceData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Resumo geral">
        <div className="grid grid-cols-2 gap-3 h-full content-center">
          {[
            { l: "Total membros", v: "1.247" },
            { l: "Taxa conversão", v: "12.7%" },
            { l: "CPM médio", v: "R$ 2.40" },
            { l: "Custo por membro", v: "R$ 0.47" },
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
