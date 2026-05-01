import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import {
  MessageCircle, Megaphone, Send, MousePointerClick, Plus, Users, Ban, MailX,
  UserX, AlertTriangle, TrendingUp, Sparkles, ArrowUpRight, Zap, Server, Rocket,
  CheckCircle2, Crown, ShieldCheck,
} from "lucide-react";

const formatDMs = (n: number) => n.toLocaleString("pt-BR");
const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PRICE_PER_DM = 0.20;

const StatCard = ({ icon: Icon, label, value, sub, accent, gradient }: any) => (
  <div className={`group relative rounded-2xl border border-border p-4 overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5 ${gradient ?? "bg-card"}`}>
    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition" />
    <div className="relative">
      <div className="flex items-center justify-between mb-2.5">
        <div className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center"><Icon className="h-4.5 w-4.5 text-primary" /></div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">{label}</div>
      </div>
      <div className={`text-2xl md:text-3xl font-black tracking-tight tabular-nums ${accent ?? ""}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">{sub}</div>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, isDiscordConnected, isAdmin } = useProfile();
  const [s, setS] = useState({
    sent: 0, delivered: 0, blocked: 0, dmClosed: 0, deleted: 0, otherFail: 0,
    clicks: 0, spent: 0, campaigns: 0, targeted: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [serversCount, setServersCount] = useState(0);
  const [weekly, setWeekly] = useState<{ day: string; delivered: number; clicks: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: cs }, { count }] = await Promise.all([
        supabase
          .from("campaigns")
          .select("id, name, status, sent_at, total_targeted, total_delivered, total_clicks, credits_spent, failed_blocked, failed_dm_closed, failed_deleted, failed_other")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("discord_servers")
          .select("id", { count: "exact", head: true })
          .eq("bot_in_server", true),
      ]);
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
      setServersCount(count ?? 0);
      setRecentCampaigns(list.filter((c) => c.status === "sent").slice(0, 4));

      // Build last 7 days series from real sent campaigns
      const now = new Date();
      const days: { day: string; delivered: number; clicks: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d); next.setDate(d.getDate() + 1);
        const dayItems = list.filter((c) => {
          if (!c.sent_at) return false;
          const t = new Date(c.sent_at).getTime();
          return t >= d.getTime() && t < next.getTime();
        });
        days.push({
          day: d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3),
          delivered: dayItems.reduce((a, c) => a + (c.total_delivered || 0), 0),
          clicks: dayItems.reduce((a, c) => a + (c.total_clicks || 0), 0),
        });
      }
      setWeekly(days);
    })();
  }, [user]);

  const ctr = s.delivered > 0 ? ((s.clicks / s.delivered) * 100).toFixed(2) : "0.00";
  const deliveryRate = s.targeted > 0 ? ((s.delivered / s.targeted) * 100).toFixed(1) : "0.0";
  const blockRate = s.targeted > 0 ? ((s.blocked / s.targeted) * 100).toFixed(1) : "0.0";
  const dms = profile?.credits ?? 0;

  // Onboarding checklist
  const hasDiscord = isDiscordConnected;
  const hasDms = dms > 0;
  const hasCampaign = s.campaigns > 0;
  const allDone = hasDiscord && hasDms && hasCampaign;

  return (
    <div className="max-w-7xl space-y-7">
      {/* BANNER ADMIN - só aparece pra admins */}
      {isAdmin && (
        <Link to="/app/admin" className="block group">
          <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-yellow-500/15 p-4 hover:border-yellow-500 transition">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-yellow-500/20 blur-2xl group-hover:bg-yellow-500/30 transition" />
            <div className="relative flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 grid place-items-center shadow-lg shrink-0">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[9px] uppercase tracking-widest font-black mb-0.5">
                  <ShieldCheck className="h-2.5 w-2.5" /> Admin
                </div>
                <div className="font-black text-sm md:text-base">Painel administrativo</div>
                <div className="text-[11px] text-muted-foreground">Métricas globais, controle do bot, lista de usuários</div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-yellow-600 dark:text-yellow-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition" />
            </div>
          </div>
        </Link>
      )}

      {/* HERO PRINCIPAL */}
      <div className="grid lg:grid-cols-[1fr,1fr] gap-4">
        {/* Saldo */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-glow p-6 md:p-8 text-white shadow-glow">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-10 -bottom-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-[10px] uppercase tracking-widest font-black">
              <Sparkles className="h-3 w-3" /> Olá {profile?.discord_username || profile?.username || ""}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">Saldo de DMs</div>
              <div className="flex items-baseline gap-2 flex-wrap mt-1">
                <span className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums">{formatDMs(dms)}</span>
                <span className="text-xl font-bold opacity-70">DMs</span>
              </div>
              <div className="text-sm opacity-90 mt-1">
                ≈ <strong>{formatBRL(dms * PRICE_PER_DM)}</strong> · 1 DM = R$ 0,20
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link to="/app/creditos" className="flex-1 min-w-[140px]">
                <Button variant="secondary" className="w-full gap-2 backdrop-blur bg-white/20 border border-white/20 text-white hover:bg-white/30 font-bold">
                  <Plus className="h-4 w-4" /> Comprar DMs
                </Button>
              </Link>
              <Link to="/app/campanhas/nova" className="flex-1 min-w-[140px]">
                <Button className="w-full bg-white text-primary hover:bg-white/90 gap-2 font-black shadow-xl">
                  <Zap className="h-4 w-4" /> Nova campanha
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Onboarding ou Stats rápidos */}
        {!allDone ? (
          <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-card to-primary/5 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-primary/15 grid place-items-center"><Rocket className="h-4 w-4 text-primary" /></div>
              <h3 className="font-black tracking-tight">Comece em 3 passos</h3>
            </div>
            <div className="space-y-2.5">
              <ChecklistItem done={hasDiscord} num={1} label="Conecte sua conta Discord" link="/app/servidores" />
              <ChecklistItem done={hasDms} num={2} label="Compre suas primeiras DMs" link="/app/creditos" />
              <ChecklistItem done={hasCampaign} num={3} label="Crie sua primeira campanha" link="/app/campanhas/nova" />
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-success/15 grid place-items-center"><TrendingUp className="h-4 w-4 text-success" /></div>
              <h3 className="font-black tracking-tight">Resumo geral</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <QuickStat label="Campanhas enviadas" value={s.sent} />
              <QuickStat label="Pessoas alcançadas" value={formatDMs(s.delivered)} />
              <QuickStat label="Cliques totais" value={formatDMs(s.clicks)} accent="text-primary" />
              <QuickStat label="Servidores na rede" value={formatDMs(serversCount)} icon={Server} />
            </div>
          </div>
        )}
      </div>

      {/* AÇÕES RÁPIDAS */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction to="/app/campanhas/nova" icon={Plus} label="Nova campanha" desc="Criar e disparar" />
          <QuickAction to="/app/campanhas" icon={Megaphone} label="Campanhas" desc="Histórico e drafts" />
          <QuickAction to="/app/servidores" icon={Server} label="Servidores" desc="Adicionar bot" />
          <QuickAction to="/app/creditos" icon={MessageCircle} label="Comprar DMs" desc="Recarregar saldo" />
        </div>
      </section>

      {/* PERFORMANCE */}
      {s.sent > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-success/15 grid place-items-center"><TrendingUp className="h-4 w-4 text-success" /></div>
            <h3 className="text-base font-black tracking-tight">Performance</h3>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Send} label="Campanhas" value={s.sent} sub={`${s.campaigns} no total`} />
            <StatCard icon={Users} label="Alcance total" value={formatDMs(s.delivered)} sub={`${deliveryRate}% de entrega`} gradient="bg-gradient-to-br from-success/10 to-card" />
            <StatCard icon={MousePointerClick} label="Cliques (CTR)" value={`${ctr}%`} accent="text-primary" sub={`${formatDMs(s.clicks)} cliques`} gradient="bg-gradient-to-br from-primary/10 to-card" />
            <StatCard icon={MessageCircle} label="DMs enviadas" value={formatDMs(s.spent)} sub="lifetime" />
          </div>
        </section>
      )}

      {/* ANÁLISE DE FALHAS */}
      {(s.blocked + s.dmClosed + s.deleted + s.otherFail) > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-destructive/15 grid place-items-center"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
            <h3 className="text-base font-black tracking-tight">Análise de falhas</h3>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Ban} label="Bot bloqueado" value={formatDMs(s.blocked)} accent="text-destructive" sub={`${blockRate}% dos alvos`} gradient="bg-gradient-to-br from-destructive/10 to-card" />
            <StatCard icon={MailX} label="DM fechada" value={formatDMs(s.dmClosed)} accent="text-warning" sub="Privacidade ativa" />
            <StatCard icon={UserX} label="Conta deletada" value={formatDMs(s.deleted)} sub="Inválidas" />
            <StatCard icon={AlertTriangle} label="Outros erros" value={formatDMs(s.otherFail)} sub="Rate limit, etc" />
          </div>
        </section>
      )}

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
              const cctr = c.total_delivered > 0 ? ((c.total_clicks / c.total_delivered) * 100).toFixed(1) : "0.0";
              return (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition">
                  <div className="font-bold text-sm truncate">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">{c.sent_at ? new Date(c.sent_at).toLocaleDateString("pt-BR") : ""}</div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div><div className="text-[9px] text-muted-foreground uppercase">Alcance</div><div className="font-black text-sm tabular-nums">{c.total_delivered}</div></div>
                    <div><div className="text-[9px] text-muted-foreground uppercase">CTR</div><div className="font-black text-sm text-primary">{cctr}%</div></div>
                    <div><div className="text-[9px] text-muted-foreground uppercase">Custo</div><div className="font-black text-sm tabular-nums">{c.credits_spent} <span className="text-[9px] text-muted-foreground font-normal">DMs</span></div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

const ChecklistItem = ({ done, num, label, link }: { done: boolean; num: number; label: string; link: string }) => (
  <Link to={link} className={`flex items-center gap-3 p-3 rounded-xl border transition ${
    done ? "border-success/30 bg-success/5" : "border-border bg-background/40 hover:border-primary/40"
  }`}>
    <div className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 font-black text-sm ${
      done ? "bg-success text-white" : "bg-secondary text-muted-foreground"
    }`}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : num}
    </div>
    <div className={`flex-1 text-sm font-bold ${done ? "line-through text-muted-foreground" : ""}`}>{label}</div>
    {!done && <ArrowUpRight className="h-4 w-4 text-primary shrink-0" />}
  </Link>
);

const QuickStat = ({ label, value, accent, icon: Icon }: { label: string; value: string | number; accent?: string; icon?: any }) => (
  <div className="rounded-xl bg-secondary/40 p-3">
    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-black flex items-center gap-1">
      {Icon && <Icon className="h-3 w-3" />} {label}
    </div>
    <div className={`text-xl font-black tabular-nums mt-1 ${accent ?? ""}`}>{value}</div>
  </div>
);

const QuickAction = ({ to, icon: Icon, label, desc }: { to: string; icon: any; label: string; desc: string }) => (
  <Link to={to} className="group rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:-translate-y-0.5 transition flex items-center gap-3">
    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary-glow/20 grid place-items-center group-hover:from-primary group-hover:to-primary-glow group-hover:text-white transition shrink-0">
      <Icon className="h-5 w-5 text-primary group-hover:text-white" />
    </div>
    <div className="min-w-0">
      <div className="font-black text-sm truncate">{label}</div>
      <div className="text-[10px] text-muted-foreground">{desc}</div>
    </div>
  </Link>
);

export default Dashboard;
