import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Coins, Megaphone, Send, MousePointerClick, Plus, Users, Ban, MailX, UserX, AlertTriangle, TrendingUp } from "lucide-react";

const Stat = ({ icon: Icon, label, value, accent, sub }: { icon: any; label: string; value: string | number; accent?: string; sub?: string }) => (
  <div className="rounded-xl bg-card border border-border p-4">
    <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-wider"><Icon className="h-3 w-3" /> {label}</div>
    <div className={`text-2xl font-bold mt-1.5 ${accent ?? ""}`}>{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [s, setS] = useState({
    sent: 0, delivered: 0, blocked: 0, dmClosed: 0, deleted: 0, otherFail: 0,
    clicks: 0, spent: 0, campaigns: 0, targeted: 0,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: cs } = await supabase
        .from("campaigns")
        .select("status, total_targeted, total_delivered, total_clicks, credits_spent, failed_blocked, failed_dm_closed, failed_deleted, failed_other")
        .eq("user_id", user.id);
      const list = (cs ?? []) as any[];
      setS({
        sent: list.filter((c) => c.status === "sent").length,
        targeted: list.reduce((a, c) => a + (c.total_targeted || 0), 0),
        delivered: list.reduce((a, c) => a + (c.total_delivered || 0), 0),
        blocked: list.reduce((a, c) => a + (c.failed_blocked || 0), 0),
        dmClosed: list.reduce((a, c) => a + (c.failed_dm_closed || 0), 0),
        deleted: list.reduce((a, c) => a + (c.failed_deleted || 0), 0),
        otherFail: list.reduce((a, c) => a + (c.failed_other || 0), 0),
        clicks: list.reduce((a, c) => a + (c.total_clicks || 0), 0),
        spent: list.reduce((a, c) => a + (c.credits_spent || 0), 0),
        campaigns: list.length,
      });
    })();
  }, [user]);

  const ctr = s.delivered > 0 ? ((s.clicks / s.delivered) * 100).toFixed(2) : "0.00";
  const deliveryRate = s.targeted > 0 ? ((s.delivered / s.targeted) * 100).toFixed(1) : "0.0";
  const blockRate = s.targeted > 0 ? ((s.blocked / s.targeted) * 100).toFixed(1) : "0.0";

  return (
    <div className="max-w-6xl space-y-6">
      {/* Hero saldo */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80 flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" /> Saldo em coins</div>
            <div className="text-5xl md:text-6xl font-black mt-2">{profile?.credits ?? 0}</div>
            <p className="text-sm opacity-90 mt-1">≈ {((profile?.credits ?? 0) * 10).toLocaleString("pt-BR")} DMs disponíveis</p>
          </div>
          <div className="flex gap-2">
            <Link to="/app/creditos"><Button variant="secondary" className="gap-2"><Plus className="h-4 w-4" /> Adicionar</Button></Link>
            <Link to="/app/campanhas/nova"><Button className="bg-white text-primary hover:bg-white/90 gap-2"><Megaphone className="h-4 w-4" /> Nova campanha</Button></Link>
          </div>
        </div>
      </div>

      {/* Performance geral */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={Send} label="Campanhas enviadas" value={s.sent} sub={`${s.campaigns} no total`} />
          <Stat icon={Users} label="Pessoas alcançadas" value={s.delivered.toLocaleString("pt-BR")} sub={`${deliveryRate}% de entrega`} />
          <Stat icon={MousePointerClick} label="CTR" value={`${ctr}%`} accent="text-success" sub={`${s.clicks} cliques`} />
          <Stat icon={Coins} label="Coins gastos" value={s.spent} sub="lifetime" />
        </div>
      </div>

      {/* Breakdown de falhas — Meta Ads style */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Análise de falhas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={Ban} label="Bot bloqueado" value={s.blocked.toLocaleString("pt-BR")} accent="text-destructive" sub={`${blockRate}% dos alvos`} />
          <Stat icon={MailX} label="DM fechada" value={s.dmClosed.toLocaleString("pt-BR")} accent="text-warning" sub="Privacidade ativa" />
          <Stat icon={UserX} label="Conta deletada" value={s.deleted.toLocaleString("pt-BR")} sub="Inválidas" />
          <Stat icon={AlertTriangle} label="Outros erros" value={s.otherFail.toLocaleString("pt-BR")} sub="Rate limit, etc" />
        </div>
      </div>

      {s.campaigns === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Megaphone className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Você ainda não criou nenhuma campanha</p>
          <Link to="/app/campanhas/nova"><Button variant="discord" className="gap-2"><Plus className="h-4 w-4" /> Criar primeira campanha</Button></Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
