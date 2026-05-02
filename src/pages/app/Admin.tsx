import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Server, MessageCircle, DollarSign, Send, Activity, Bot,
  Loader2, ShieldCheck, TrendingUp, Megaphone, Zap, Crown, KeyRound,
  CheckCircle2, XCircle, Save, Eye, EyeOff, Search, Plus, Minus, Coins,
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
  const location = useLocation();
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

  // Bot token mgmt
  const [tokenInfo, setTokenInfo] = useState<{ has_token: boolean; masked: string; source: string; updated_at: string | null; valid: boolean | null; bot: { username?: string; id?: string } | null } | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [loadingToken, setLoadingToken] = useState(false);

  // Credit management
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [creditReason, setCreditReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const searchUsers = async (q: string) => {
    setSearchingUsers(true);
    const { data, error } = await supabase.functions.invoke("admin-credit-user", { body: { action: "search_users", q } });
    setSearchingUsers(false);
    if (error || !data?.success) return toast.error("Falha ao buscar usuários");
    setUserResults(data.users);
  };

  const adjustCredits = async (sign: 1 | -1) => {
    if (!selectedUser) return toast.error("Escolha um usuário");
    const n = parseInt(creditAmount, 10);
    if (!Number.isFinite(n) || n <= 0) return toast.error("Quantidade inválida");
    setAdjusting(true);
    const { data, error } = await supabase.functions.invoke("admin-credit-user", {
      body: { action: "adjust_credits", user_id: selectedUser.id, amount: sign * n, description: creditReason || undefined },
    });
    setAdjusting(false);
    if (error || !data?.success) return toast.error("Falha: " + (data?.error || error?.message || "erro"));
    toast.success(`${sign > 0 ? "+" : "-"}${n} DMs · ${selectedUser.username} agora tem ${data.user.new_credits}`);
    setSelectedUser({ ...selectedUser, credits: data.user.new_credits });
    setUserResults((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, credits: data.user.new_credits } : u));
    setCreditAmount("");
    setCreditReason("");
    loadStats();
  };


  const loadToken = async () => {
    setLoadingToken(true);
    const { data } = await supabase.functions.invoke("admin-bot-token", { body: { action: "get" } });
    setLoadingToken(false);
    if (data?.success) setTokenInfo(data);
  };

  const saveToken = async () => {
    if (!tokenInput.trim() || tokenInput.trim().length < 30) return toast.error("Token inválido (curto demais)");
    setSavingToken(true);
    const { data, error } = await supabase.functions.invoke("admin-bot-token", { body: { action: "set", token: tokenInput.trim() } });
    setSavingToken(false);
    if (error || !data?.success) {
      const detail = data?.detail || data?.error || error?.message || "erro";
      return toast.error("Falha: " + detail);
    }
    toast.success(`Token salvo! Bot: ${data.bot?.username ?? "ok"}`);
    setTokenInput("");
    setShowToken(false);
    loadToken();
    loadGuilds(); // reload guilds with new token
  };

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

  useEffect(() => { if (isAdmin) { loadStats(); loadGuilds(); loadToken(); searchUsers(""); } }, [isAdmin]);

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  if (!isAdmin) return <Navigate to={`/admin-login?redirect=${encodeURIComponent(location.pathname)}`} replace />;

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

      {/* BOT TOKEN MANAGEMENT */}
      <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-lg bg-primary/20 grid place-items-center"><KeyRound className="h-4 w-4 text-primary" /></div>
          <div className="flex-1">
            <h2 className="font-black uppercase tracking-wider text-sm">Token do bot Discord</h2>
            <p className="text-[11px] text-muted-foreground">Troque o token sempre que resetar — sem precisar pedir ao suporte</p>
          </div>
          <Button onClick={loadToken} variant="ghost" size="sm" disabled={loadingToken}>
            {loadingToken ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* status */}
          <div className="rounded-xl border border-border bg-background/40 p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Status atual</div>
            {!tokenInfo ? (
              <div className="text-xs text-muted-foreground">Carregando...</div>
            ) : !tokenInfo.has_token ? (
              <div className="flex items-center gap-2 text-warning text-sm font-bold">
                <XCircle className="h-4 w-4" /> Nenhum token configurado
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm font-bold">
                  {tokenInfo.valid === true ? (
                    <><CheckCircle2 className="h-4 w-4 text-success" /> <span className="text-success">Ativo</span></>
                  ) : tokenInfo.valid === false ? (
                    <><XCircle className="h-4 w-4 text-destructive" /> <span className="text-destructive">Token inválido / expirado</span></>
                  ) : (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</>
                  )}
                </div>
                {tokenInfo.bot?.username && (
                  <div className="text-xs"><span className="text-muted-foreground">Bot:</span> <b>{tokenInfo.bot.username}</b></div>
                )}
                <div className="text-[11px] font-mono text-muted-foreground">{tokenInfo.masked}</div>
                <div className="text-[10px] text-muted-foreground">
                  Origem: <b className="uppercase">{tokenInfo.source}</b>
                  {tokenInfo.updated_at && <> · Atualizado {new Date(tokenInfo.updated_at).toLocaleString("pt-BR")}</>}
                </div>
              </>
            )}
          </div>

          {/* form */}
          <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Trocar token</div>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Cole aqui o novo token do bot"
                className="pr-10 font-mono text-xs"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button onClick={saveToken} disabled={savingToken || !tokenInput.trim()} variant="discord" className="w-full font-black">
              {savingToken ? <><Loader2 className="h-4 w-4 animate-spin" /> Validando...</> : <><Save className="h-4 w-4" /> Salvar e validar</>}
            </Button>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              O token é validado direto na API do Discord antes de salvar. Se for válido, todas as funções do bot passam a usar imediatamente.
            </p>
          </div>
        </div>
      </div>

      {/* GERENCIAR DMs DOS USUÁRIOS */}
      <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-lg bg-primary/20 grid place-items-center"><Coins className="h-4 w-4 text-primary" /></div>
          <div className="flex-1">
            <h2 className="font-black uppercase tracking-wider text-sm">Adicionar / remover DMs</h2>
            <p className="text-[11px] text-muted-foreground">Busque a conta, escolha quantas DMs e ajuste o saldo</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Busca */}
          <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">1. Encontrar usuário</div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers(userQuery)}
                placeholder="Nome, Discord ou ID..."
                className="pl-9"
              />
            </div>
            <Button onClick={() => searchUsers(userQuery)} variant="outline" size="sm" className="w-full" disabled={searchingUsers}>
              {searchingUsers ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Buscar
            </Button>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {userResults.length === 0 && <div className="text-[11px] text-muted-foreground text-center py-4">Nenhum usuário</div>}
              {userResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full text-left rounded-lg border p-2 flex items-center gap-2 transition ${
                    selectedUser?.id === u.id ? "border-primary bg-primary/10" : "border-border bg-background/60 hover:bg-background"
                  }`}
                >
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                    : <div className="h-8 w-8 rounded-full bg-secondary grid place-items-center text-xs font-black">{u.username?.[0]?.toUpperCase() ?? "?"}</div>}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate">{u.username}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{u.discord_username ?? u.discord_id ?? "—"}</div>
                  </div>
                  <div className="text-[11px] font-black text-primary tabular-nums">{fmt(u.credits)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Ajuste */}
          <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">2. Ajustar saldo</div>
            {!selectedUser ? (
              <div className="text-xs text-muted-foreground py-8 text-center">Escolha um usuário ao lado</div>
            ) : (
              <>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-2">
                  {selectedUser.avatar_url
                    ? <img src={selectedUser.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                    : <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center text-sm font-black">{selectedUser.username?.[0]?.toUpperCase() ?? "?"}</div>}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black truncate">{selectedUser.username}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{selectedUser.discord_username ?? "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase font-black text-muted-foreground">Saldo</div>
                    <div className="text-lg font-black text-primary tabular-nums">{fmt(selectedUser.credits)}</div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Quantidade de DMs</label>
                  <Input
                    type="number"
                    min={1}
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Ex: 1000"
                    className="mt-1 text-lg font-black tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Motivo (opcional)</label>
                  <Input
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder="Ex: bônus de vídeo, reembolso..."
                    className="mt-1"
                    maxLength={200}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => adjustCredits(1)}
                    disabled={adjusting || !creditAmount}
                    className="font-black bg-success hover:bg-success/90 text-white"
                  >
                    {adjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Adicionar
                  </Button>
                  <Button
                    onClick={() => adjustCredits(-1)}
                    disabled={adjusting || !creditAmount}
                    variant="destructive"
                    className="font-black"
                  >
                    {adjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                    Remover
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Toda alteração é registrada no histórico de transações com seu e-mail de admin.
                </p>
              </>
            )}
          </div>
        </div>
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
