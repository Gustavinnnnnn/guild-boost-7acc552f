import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Server, MessageCircle, DollarSign, Send, Activity, Bot,
  Loader2, ShieldCheck, TrendingUp, Megaphone, Zap, Crown,
} from "lucide-react";
import { toast } from "sonner";

const formatBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (n: number) => (n ?? 0).toLocaleString("pt-BR");

type Stats = {
  totalUsers: number; totalServersInNetwork: number; botGuildsCount: number | null;
  totalCampaigns: number; activeCampaigns: number; totalDelivered: number; totalClicks: number;
  totalCreditsSpent: number; totalRevenueCents: number; totalCoinsSold: number; paidDepositsCount: number;
};

const Admin = () => {
  const { isAdmin, loading } = useProfile();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Bot broadcast
  const [guilds, setGuilds] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [msgContent, setMsgContent] = useState("");
  const [embedTitle, setEmbedTitle] = useState("");
  const [embedDesc, setEmbedDesc] = useState("");
  const [embedImage, setEmbedImage] = useState("");
  const [embedColor, setEmbedColor] = useState("#5865F2");
  const [btnLabel, setBtnLabel] = useState("");
  const [btnUrl, setBtnUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingGuilds, setLoadingGuilds] = useState(false);

  const loadStats = async () => {
    setLoadingStats(true);
    const { data, error } = await supabase.functions.invoke("admin-stats");
    setLoadingStats(false);
    if (error || !data?.success) return toast.error("Falha ao carregar métricas");
    setStats(data.stats);
    setRecentCampaigns(data.recentCampaigns);
    setRecentUsers(data.recentUsers);
  };

  const loadGuilds = async () => {
    setLoadingGuilds(true);
    const { data, error } = await supabase.functions.invoke("admin-broadcast", { body: { action: "list_guilds" } });
    setLoadingGuilds(false);
    if (error || !data?.success) return toast.error("Falha ao carregar servidores do bot");
    setGuilds(data.guilds);
  };

  const loadChannels = async (guildId: string) => {
    setSelectedGuild(guildId);
    setSelectedChannel("");
    setChannels([]);
    if (!guildId) return;
    const { data } = await supabase.functions.invoke("admin-broadcast", { body: { action: "list_channels", guild_id: guildId } });
    if (data?.success) setChannels(data.channels);
  };

  const sendMessage = async () => {
    if (!selectedChannel) return toast.error("Escolha um canal");
    if (!msgContent && !embedTitle && !embedDesc) return toast.error("Escreva uma mensagem");
    setSending(true);
    const { data, error } = await supabase.functions.invoke("admin-broadcast", {
      body: {
        action: "send_message",
        channel_id: selectedChannel,
        content: msgContent || undefined,
        embed: (embedTitle || embedDesc || embedImage) ? {
          title: embedTitle, description: embedDesc, image_url: embedImage,
          color: embedColor,
          button_url: btnUrl || undefined, button_label: btnLabel || undefined,
        } : undefined,
      },
    });
    setSending(false);
    if (error || !data?.success) {
      console.error(error, data);
      return toast.error("Falha no envio: " + (data?.detail || error?.message || "erro"));
    }
    toast.success("Mensagem enviada! 🎉");
    setMsgContent(""); setEmbedTitle(""); setEmbedDesc(""); setEmbedImage(""); setBtnLabel(""); setBtnUrl("");
  };

  useEffect(() => { if (isAdmin) { loadStats(); loadGuilds(); } }, [isAdmin]);

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  if (!isAdmin) return <Navigate to="/app" replace />;

  const kpis = stats ? [
    { icon: Users, label: "Usuários", value: fmt(stats.totalUsers), color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-400" },
    { icon: DollarSign, label: "Receita total", value: formatBRL(stats.totalRevenueCents), color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-400", sub: `${fmt(stats.paidDepositsCount)} depósitos pagos` },
    { icon: MessageCircle, label: "DMs vendidas", value: fmt(stats.totalCoinsSold), color: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { icon: Send, label: "DMs entregues", value: fmt(stats.totalDelivered), color: "from-violet-500/20 to-violet-500/5", iconColor: "text-violet-400", sub: `${fmt(stats.totalClicks)} cliques` },
    { icon: Megaphone, label: "Campanhas", value: fmt(stats.totalCampaigns), color: "from-orange-500/20 to-orange-500/5", iconColor: "text-orange-400", sub: `${fmt(stats.activeCampaigns)} ativas` },
    { icon: Server, label: "Servidores na rede", value: fmt(stats.totalServersInNetwork), color: "from-pink-500/20 to-pink-500/5", iconColor: "text-pink-400" },
    { icon: Bot, label: "Bot está em", value: stats.botGuildsCount === null ? "—" : fmt(stats.botGuildsCount), color: "from-cyan-500/20 to-cyan-500/5", iconColor: "text-cyan-400", sub: "servidores Discord" },
    { icon: Activity, label: "DMs gastas", value: fmt(stats.totalCreditsSpent), color: "from-yellow-500/20 to-yellow-500/5", iconColor: "text-yellow-400" },
  ] : [];

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      {/* Hero admin */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-glow">
            <Crown className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] uppercase tracking-widest font-black mb-1">
              <ShieldCheck className="h-3 w-3" /> Admin
            </div>
            <h1 className="text-2xl font-black">Painel administrativo</h1>
            <p className="text-xs text-muted-foreground">Visão geral da plataforma + ferramenta do bot</p>
          </div>
          <Button onClick={loadStats} variant="outline" size="sm" className="ml-auto" disabled={loadingStats}>
            {loadingStats ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loadingStats ? Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-border bg-card animate-pulse" />
        )) : kpis.map((k) => {
          const I = k.icon;
          return (
            <div key={k.label} className={`relative rounded-2xl border border-border overflow-hidden bg-gradient-to-br ${k.color} p-4`}>
              <I className={`h-5 w-5 ${k.iconColor} mb-2`} />
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{k.label}</div>
              <div className="text-2xl font-black tabular-nums mt-0.5 truncate">{k.value}</div>
              {k.sub && <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{k.sub}</div>}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Bot broadcast */}
        <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card to-secondary/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-lg bg-primary/20 grid place-items-center"><Bot className="h-4 w-4 text-primary" /></div>
            <div>
              <h2 className="font-black uppercase tracking-wider text-sm">Mexer no bot</h2>
              <p className="text-[11px] text-muted-foreground">Mande mensagem em qualquer canal onde o bot está</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Servidor</label>
              <Select value={selectedGuild} onValueChange={loadChannels}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={loadingGuilds ? "Carregando..." : `Escolher (${guilds.length} disponíveis)`} /></SelectTrigger>
                <SelectContent>
                  {guilds.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Canal</label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel} disabled={!selectedGuild}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Escolher canal" /></SelectTrigger>
                <SelectContent>
                  {channels.map((c) => <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Mensagem simples (opcional)</label>
              <Textarea value={msgContent} onChange={(e) => setMsgContent(e.target.value)} placeholder="Texto direto..." className="mt-1" rows={2} />
            </div>

            <div className="rounded-lg border border-border p-3 space-y-2 bg-background/40">
              <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Embed (opcional)</div>
              <Input value={embedTitle} onChange={(e) => setEmbedTitle(e.target.value)} placeholder="Título do embed" />
              <Textarea value={embedDesc} onChange={(e) => setEmbedDesc(e.target.value)} placeholder="Descrição (suporta markdown)" rows={3} />
              <Input value={embedImage} onChange={(e) => setEmbedImage(e.target.value)} placeholder="URL da imagem (opcional)" />
              <div className="flex gap-2">
                <input type="color" value={embedColor} onChange={(e) => setEmbedColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer bg-transparent" />
                <Input value={btnLabel} onChange={(e) => setBtnLabel(e.target.value)} placeholder="Texto botão" />
                <Input value={btnUrl} onChange={(e) => setBtnUrl(e.target.value)} placeholder="URL botão" />
              </div>
            </div>

            <Button onClick={sendMessage} disabled={sending || !selectedChannel} variant="discord" className="w-full font-black h-11">
              {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <><Send className="h-4 w-4" /> Enviar pelo bot</>}
            </Button>
          </div>
        </div>

        {/* Recent campaigns */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="h-4 w-4 text-primary" />
            <h2 className="font-black uppercase tracking-wider text-sm">Campanhas recentes</h2>
          </div>
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {recentCampaigns.length === 0 && <div className="text-xs text-muted-foreground text-center py-8">Nenhuma campanha ainda</div>}
            {recentCampaigns.map((c: any) => (
              <div key={c.id} className="rounded-lg border border-border p-3 bg-background/40 hover:bg-background/60 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      {c.profiles?.avatar_url && <img src={c.profiles.avatar_url} alt="" className="h-3 w-3 rounded-full" />}
                      <span className="truncate">{c.profiles?.username ?? "—"}</span>
                      <span>·</span>
                      <span>{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded shrink-0 ${
                    c.status === "sent" ? "bg-success/20 text-success" :
                    c.status === "sending" ? "bg-primary/20 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>{c.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
                  <div><span className="text-muted-foreground">Alvo:</span> <b>{fmt(c.total_targeted)}</b></div>
                  <div><span className="text-muted-foreground">Entreg:</span> <b className="text-success">{fmt(c.total_delivered)}</b></div>
                  <div><span className="text-muted-foreground">DMs:</span> <b>{fmt(c.credits_spent)}</b></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent users */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="font-black uppercase tracking-wider text-sm">Usuários recentes</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {recentUsers.map((u: any) => (
            <div key={u.id} className="rounded-lg border border-border p-3 bg-background/40 flex items-center gap-2">
              {u.avatar_url ? <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full" /> : <div className="h-9 w-9 rounded-full bg-secondary grid place-items-center text-xs font-black">{u.username?.[0]?.toUpperCase() ?? "?"}</div>}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate">{u.username}</div>
                <div className="text-[10px] text-muted-foreground truncate">{u.discord_username ?? "—"}</div>
                <div className="text-[10px] text-primary font-bold">{fmt(u.credits)} DMs</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
