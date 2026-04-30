import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import {
  MessageCircle, Megaphone, Send, MousePointerClick, Plus, Users, Ban, MailX,
  UserX, AlertTriangle, TrendingUp, Sparkles, ArrowUpRight, Zap,
} from "lucide-react";

const formatDMs = (n: number) => n.toLocaleString("pt-BR");
const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Card = ({ icon: Icon, label, value, accent, sub, gradient }: { icon: any; label: string; value: string | number; accent?: string; sub?: string; gradient?: string }) => (
  <div className={`group relative rounded-2xl border border-border p-4 overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5 ${gradient ?? "bg-card"}`}>
    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition" />
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center"><Icon className="h-4 w-4 text-primary" /></div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">{label}</div>
      </div>
      <div className={`text-2xl md:text-3xl font-black tracking-tight ${accent ?? ""}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">{sub}</div>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [s, setS] = useState({
    sent: 0, delivered: 0, blocked: 0, dmClosed: 0, deleted: 0, otherFail: 0,
    clicks: 0, spent: 0, campaigns: 0, targeted: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: cs } = await supabase
        .from("campaigns")
        .select("id, name, status, sent_at, total_targeted, total_delivered, total_clicks, credits_spent, failed_blocked, failed_dm_closed, failed_deleted, failed_other")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
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
      setRecentCampaigns(list.filter((c) => c.status === "sent").slice(0, 4));
    })();
  }, [user]);

  const ctr = s.delivered > 0 ? ((s.clicks / s.delivered) * 100).toFixed(2) : "0.00";
  const deliveryRate = s.targeted > 0 ? ((s.delivered / s.targeted) * 100).toFixed(1) : "0.0";
  const blockRate = s.targeted > 0 ? ((s.blocked / s.targeted) * 100).toFixed(1) : "0.0";
  const dms = profile?.credits ?? 0;

  return (
    <div className="max-w-7xl space-y-7">
      {/* HERO — Saldo principal estilo banking app */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-glow p-7 md:p-10 text-white shadow-glow">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)]" />

        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-[10px] uppercase tracking-widest font-bold">
              <Sparkles className="h-3 w-3" /> Olá {profile?.discord_username || profile?.username || ""}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <MessageCircle className="h-7 w-7 opacity-80" />
              <span className="text-5xl md:text-7xl font-black tracking-tighter">{formatDMs(dms)}</span>
              <span className="text-2xl font-bold opacity-70">DMs</span>
            </div>
            <p className="text-sm opacity-90">
              ≈ <strong>{formatBRL(dms * 5)}</strong> em saldo · <span className="opacity-75">1 DM = R$ 0,05</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/app/creditos">
              <Button variant="secondary" className="gap-2 backdrop-blur bg-white/20 border border-white/20 text-white hover:bg-white/30">
                <Plus className="h-4 w-4" /> Comprar DMs
              </Button>
            </Link>
            <Link to="/app/campanhas/nova">
              <Button className="bg-white text-primary hover:bg-white/90 gap-2 font-bold shadow-xl">
                <Zap className="h-4 w-4" /> Nova campanha
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* PERFORMANCE */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-success/15 grid place-items-center"><TrendingUp className="h-4 w-4 text-success" /></div>
          <h3 className="text-base font-black tracking-tight">Performance</h3>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card icon={Send} label="Campanhas" value={s.sent} sub={`${s.campaigns} no total`} />
          <Card icon={Users} label="Alcance total" value={s.delivered.toLocaleString("pt-BR")} sub={`${deliveryRate}% de entrega`} gradient="bg-gradient-to-br from-success/10 to-card" />
          <Card icon={MousePointerClick} label="Cliques (CTR)" value={`${ctr}%`} accent="text-primary" sub={`${s.clicks.toLocaleString("pt-BR")} cliques`} gradient="bg-gradient-to-br from-primary/10 to-card" />
          <Card icon={MessageCircle} label="DMs enviadas" value={formatDMs(s.spent)} sub="lifetime" />
        </div>
      </section>

      {/* ANÁLISE DE FALHAS */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-destructive/15 grid place-items-center"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
          <h3 className="text-base font-black tracking-tight">Análise de falhas</h3>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card icon={Ban} label="Bot bloqueado" value={s.blocked.toLocaleString("pt-BR")} accent="text-destructive" sub={`${blockRate}% dos alvos`} gradient="bg-gradient-to-br from-destructive/10 to-card" />
          <Card icon={MailX} label="DM fechada" value={s.dmClosed.toLocaleString("pt-BR")} accent="text-warning" sub="Privacidade ativa" />
          <Card icon={UserX} label="Conta deletada" value={s.deleted.toLocaleString("pt-BR")} sub="Inválidas" />
          <Card icon={AlertTriangle} label="Outros erros" value={s.otherFail.toLocaleString("pt-BR")} sub="Rate limit, etc" />
        </div>
      </section>

      {/* CAMPANHAS RECENTES */}
      {recentCampaigns.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/15 grid place-items-center"><Megaphone className="h-4 w-4 text-primary" /></div>
              <h3 className="text-base font-black tracking-tight">Últimas campanhas</h3>
            </div>
            <Link to="/app/campanhas" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {recentCampaigns.map((c) => {
              const ctr = c.total_delivered > 0 ? ((c.total_clicks / c.total_delivered) * 100).toFixed(1) : "0.0";
              return (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition">
                  <div className="font-bold text-sm truncate">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">{c.sent_at ? new Date(c.sent_at).toLocaleDateString("pt-BR") : ""}</div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div><div className="text-[9px] text-muted-foreground uppercase">Alcance</div><div className="font-black text-sm">{c.total_delivered}</div></div>
                    <div><div className="text-[9px] text-muted-foreground uppercase">CTR</div><div className="font-black text-sm text-primary">{ctr}%</div></div>
                    <div><div className="text-[9px] text-muted-foreground uppercase">Custo</div><div className="font-black text-sm">{c.credits_spent} <span className="text-[9px] text-muted-foreground font-normal">DMs</span></div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {s.campaigns === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center bg-gradient-to-br from-card to-transparent">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center mb-3 shadow-glow">
            <Megaphone className="h-7 w-7 text-white" />
          </div>
          <h4 className="font-black text-lg">Pronto pra disparar?</h4>
          <p className="text-sm text-muted-foreground mb-4 mt-1">Crie sua primeira campanha e alcance milhares no Discord.</p>
          <Link to="/app/campanhas/nova"><Button variant="discord" className="gap-2"><Plus className="h-4 w-4" /> Criar primeira campanha</Button></Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
