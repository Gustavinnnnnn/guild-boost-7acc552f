import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Bot, KeyRound, CheckCircle2, Server, Send, Sparkles, Upload, X,
  TrendingUp, MessageCircle, AlertCircle, Loader2, Users, Flame, Target, Zap, Clock,
} from "lucide-react";

type UserBot = {
  id: string; bot_id?: string; bot_username?: string; bot_avatar_url?: string;
  guild_id?: string; guild_name?: string; guild_member_count?: number;
  total_broadcasts: number; total_dms_sent: number; total_dms_failed: number; total_clicks: number;
};
type Guild = { id: string; name: string; member_count: number; icon: string | null };
type Broadcast = {
  id: string; title?: string; message: string; status: string;
  total_targeted: number; total_delivered: number; total_failed: number;
  created_at: string; finished_at?: string | null; image_url?: string | null;
};

const fmt = (n: number) => (n ?? 0).toLocaleString("pt-BR");

export default function MyBot() {
  const [bot, setBot] = useState<UserBot | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const [b, bc] = await Promise.all([
      supabase.from("user_bots").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("bot_broadcasts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setBot(b.data as any);
    setBroadcasts((bc.data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Auto-refresh enquanto houver broadcast em "sending"
  useEffect(() => {
    const hasSending = broadcasts.some(b => b.status === "sending");
    if (!hasSending) return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [broadcasts]);

  const connect = async () => {
    if (!token || token.length < 50) return toast.error("Cole o token completo do bot.");
    setConnecting(true);
    const { data, error } = await supabase.functions.invoke("user-bot-connect", {
      body: { action: "connect", token },
    });
    setConnecting(false);
    if (error || data?.error) return toast.error(data?.detail || data?.error || "Erro ao conectar.");
    toast.success(`Bot ${data.bot.bot_username} conectado!`);
    setToken("");
    setBot(data.bot);
    setGuilds(data.guilds || []);
  };

  const selectGuild = async (g: Guild) => {
    const { data, error } = await supabase.functions.invoke("user-bot-connect", {
      body: { action: "select_guild", guild_id: g.id, guild_name: g.name, guild_member_count: g.member_count },
    });
    if (error) return toast.error(error.message);
    toast.success(`Servidor "${g.name}" selecionado!`);
    setBot(data.bot);
    setGuilds([]);
  };

  const uploadImage = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) return toast.error("Imagem muito grande (máx 8MB)");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Faça login.");
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("bot-broadcasts").upload(path, file, { upsert: false, contentType: file.type });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data: pub } = supabase.storage.from("bot-broadcasts").getPublicUrl(path);
    setImageUrl(pub.publicUrl);
    setUploading(false);
    toast.success("Imagem enviada!");
  };

  const sendBroadcast = async () => {
    if (!message.trim()) return toast.error("Escreva a mensagem.");
    setSending(true);
    const { data, error } = await supabase.functions.invoke("user-bot-broadcast", {
      body: { title, message, image_url: imageUrl || null, button_label: buttonLabel || null, button_url: buttonUrl || null },
    });
    setSending(false);
    if (error || data?.error) return toast.error(data?.message || data?.error || "Erro ao disparar.", { duration: 8000 });
    toast.success(`🚀 Disparando para ${fmt(data.total_targeted)} membros!`);
    setTitle(""); setMessage(""); setImageUrl(""); setButtonLabel(""); setButtonUrl("");
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // ===== ETAPA 1: Não conectou bot =====
  if (!bot?.bot_id) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6 md:p-10">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary-glow/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-center mb-5">
              <ServerBoostMark size="xl" showWordmark={false} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 border border-success/30 text-success text-[10px] uppercase tracking-widest font-black mb-3">
              <Sparkles className="h-3 w-3" /> Grátis por enquanto
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Conecte <span className="text-primary">seu bot</span>, divulgue pra todo seu servidor
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">
              Coloque o token do <b>seu próprio bot Discord</b> aqui e dispare DMs em massa pra
              todos os membros do <b>seu servidor</b>. Sem comprar saldo, sem limite por dia
              (exceto 3 disparos/dia), <b>tudo seu</b>.
            </p>
          </div>
        </div>

        {/* Passo a passo visual */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { n: "1", t: "Crie o bot", d: "Em discord.com/developers", icon: Bot },
            { n: "2", t: "Ative intents", d: "SERVER MEMBERS INTENT", icon: Zap },
            { n: "3", t: "Cole o token", d: "Pronto, é só divulgar", icon: KeyRound },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card p-4 relative overflow-hidden">
              <div className="absolute -right-3 -top-3 text-7xl font-black text-primary/5 leading-none select-none">{s.n}</div>
              <div className="relative">
                <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary grid place-items-center mb-2">
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="font-black text-sm">{s.t}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <Card className="p-6 space-y-5 bg-gradient-to-br from-card to-card/50 border-primary/30 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.4)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-lg flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" /> Cole o token do seu bot
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Token fica criptografado e só o seu bot consegue usar.
              </p>
            </div>
            <a
              href="https://discord.com/developers/applications"
              target="_blank"
              rel="noopener"
              className="text-[11px] text-primary underline shrink-0 mt-1"
            >
              Abrir Developer Portal ↗
            </a>
          </div>

          <details className="group rounded-xl border border-border bg-background/50 p-3">
            <summary className="cursor-pointer text-xs font-bold text-muted-foreground flex items-center justify-between list-none">
              <span className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Como pegar o token (passo a passo)</span>
              <span className="text-[10px] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside mt-3 pl-1">
              <li>Vá em <a href="https://discord.com/developers/applications" target="_blank" rel="noopener" className="text-primary underline">discord.com/developers/applications</a></li>
              <li>Crie uma aplicação → Bot → <b>Reset Token</b> e copie</li>
              <li>Em <b>Privileged Gateway Intents</b>, ative <b className="text-warning">SERVER MEMBERS INTENT</b></li>
              <li>Convide o bot pro seu servidor com permissão de enviar mensagens</li>
            </ol>
          </details>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Token do bot</Label>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.GxXxXx..."
              className="font-mono text-sm h-12"
            />
          </div>

          <Button onClick={connect} disabled={connecting} variant="discord" className="w-full h-12 text-sm">
            {connecting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Conectando...</>
            ) : (
              <><Zap className="h-4 w-4" /> Conectar meu bot</>
            )}
          </Button>
        </Card>
      </div>
    );
  }

  // ===== ETAPA 2: Conectou bot, mas sem servidor selecionado =====
  if (!bot.guild_id) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-5 bg-gradient-to-r from-success/10 to-success/5 border-success/30">
          <div className="flex items-center gap-3">
            {bot.bot_avatar_url && <img src={bot.bot_avatar_url} className="h-12 w-12 rounded-full" />}
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Bot conectado</div>
              <div className="font-bold">{bot.bot_username}</div>
            </div>
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2"><Server className="h-5 w-5 text-primary" /> Escolha o servidor</h2>
          <p className="text-sm text-muted-foreground">Selecione o servidor onde o bot vai divulgar:</p>
          {guilds.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <AlertCircle className="h-8 w-8 text-warning mx-auto" />
              <p className="text-sm">O bot não está em nenhum servidor ainda. Convide-o pelo Discord Developer Portal e recarregue.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Recarregar</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {guilds.map(g => (
                <button key={g.id} onClick={() => selectGuild(g)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition text-left">
                  {g.icon ? <img src={g.icon} className="h-10 w-10 rounded-lg" /> :
                    <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center font-bold">{g.name[0]}</div>}
                  <div className="flex-1">
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {fmt(g.member_count)} membros</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ===== ETAPA 3: Dashboard =====
  const broadcastsToday = broadcasts.filter(b =>
    new Date(b.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
  ).length;
  const remainingToday = Math.max(0, 3 - broadcastsToday);
  const sendingNow = broadcasts.find(b => b.status === "sending");
  const successRate = bot.total_dms_sent + bot.total_dms_failed > 0
    ? Math.round((bot.total_dms_sent / (bot.total_dms_sent + bot.total_dms_failed)) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* HEADER */}
      <Card className="p-5 bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
        <div className="flex items-center gap-4">
          {bot.bot_avatar_url ? (
            <img src={bot.bot_avatar_url} className="h-14 w-14 rounded-2xl ring-2 ring-primary shadow-glow" />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-primary grid place-items-center"><Bot className="h-7 w-7 text-primary-foreground" /></div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-black truncate">{bot.bot_username}</h1>
            <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 truncate">
              <Server className="h-3.5 w-3.5 shrink-0" /> {bot.guild_name} · <Users className="h-3.5 w-3.5 shrink-0" /> {fmt(bot.guild_member_count ?? 0)}
            </div>
          </div>
          <Badge className="bg-success/15 text-success border-success/30 hidden sm:flex">Acesso vitalício</Badge>
        </div>
      </Card>

      {/* AO VIVO */}
      {sendingNow && (
        <Card className="p-5 bg-gradient-to-br from-primary/15 to-primary-glow/10 border-primary/40 shadow-glow">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="font-bold text-sm uppercase tracking-wider text-primary">Disparando ao vivo</span>
            <span className="ml-auto text-xs text-muted-foreground">{sendingNow.title || sendingNow.message.slice(0, 40)}...</span>
          </div>
          <Progress
            value={sendingNow.total_targeted > 0
              ? ((sendingNow.total_delivered + sendingNow.total_failed) / sendingNow.total_targeted) * 100
              : 0}
            className="h-3"
          />
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div><div className="text-xl font-black text-success">{fmt(sendingNow.total_delivered)}</div><div className="text-[10px] uppercase text-muted-foreground">Entregues</div></div>
            <div><div className="text-xl font-black text-destructive">{fmt(sendingNow.total_failed)}</div><div className="text-[10px] uppercase text-muted-foreground">Falhas</div></div>
            <div><div className="text-xl font-black">{fmt(sendingNow.total_targeted)}</div><div className="text-[10px] uppercase text-muted-foreground">Total</div></div>
          </div>
        </Card>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Flame className="h-4 w-4" />} label="Divulgações" value={fmt(bot.total_broadcasts)} accent="text-primary" />
        <StatCard icon={<Send className="h-4 w-4" />} label="DMs entregues" value={fmt(bot.total_dms_sent)} accent="text-success" />
        <StatCard icon={<Target className="h-4 w-4" />} label="Taxa de sucesso" value={`${successRate}%`} accent="text-primary-glow" />
        <StatCard icon={<Zap className="h-4 w-4" />} label="Restantes hoje" value={`${remainingToday}/3`} accent="text-warning" />
      </div>

      {/* FORM + HISTORICO */}
      <div className="grid lg:grid-cols-[1fr,400px] gap-5">
        <Card className="p-6 space-y-4">
          <h2 className="font-black text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Nova divulgação</h2>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Título (opcional)</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="🎁 Promoção exclusiva!" maxLength={256} className="mt-1.5" />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mensagem *</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} maxLength={4000}
              placeholder="Ei! Temos uma promoção rolando hoje..." className="mt-1.5" />
            <p className="text-[10px] text-muted-foreground text-right mt-1">{message.length}/4000</p>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Imagem (opcional)</Label>
            {imageUrl ? (
              <div className="mt-1.5 relative inline-block">
                <img src={imageUrl} alt="" className="rounded-lg max-h-48 border-2 border-border" />
                <button type="button" onClick={() => setImageUrl("")}
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-white grid place-items-center shadow-lg hover:scale-110 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="mt-1.5 cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/60 hover:bg-primary/5 transition">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
                {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                <div className="text-sm font-semibold">{uploading ? "Enviando..." : "Clique pra adicionar imagem"}</div>
                <div className="text-[10px] text-muted-foreground">PNG, JPG, GIF · até 8MB</div>
              </label>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Texto botão (opcional)</Label>
              <Input value={buttonLabel} onChange={e => setButtonLabel(e.target.value)} placeholder="Ver oferta" maxLength={80} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL botão (opcional)</Label>
              <Input value={buttonUrl} onChange={e => setButtonUrl(e.target.value)} placeholder="https://sualoja.com" className="mt-1.5" />
            </div>
          </div>

          <Button onClick={sendBroadcast} disabled={sending || remainingToday === 0 || !!sendingNow} className="w-full bg-gradient-to-r from-primary to-primary-glow shadow-glow">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> :
              sendingNow ? "Aguarde a divulgação atual terminar..." :
              remainingToday === 0 ? "Limite diário atingido (3/3)" :
                <><Send className="h-4 w-4" /> Disparar para {fmt(bot.guild_member_count ?? 0)} membros</>}
          </Button>
        </Card>

        <Card className="p-5 space-y-3 self-start">
          <h2 className="font-black text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Histórico</h2>
          {broadcasts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma divulgação ainda.</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {broadcasts.map(b => {
                const total = b.total_delivered + b.total_failed;
                const pct = b.total_targeted > 0 ? (total / b.total_targeted) * 100 : 0;
                return (
                  <div key={b.id} className="p-3 rounded-lg border border-border bg-card/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={b.status === "sent" ? "default" : b.status === "sending" ? "secondary" : "destructive"} className="text-[10px]">
                        {b.status === "sent" ? "✓ Enviado" : b.status === "sending" ? "Enviando" : "Falhou"}
                      </Badge>
                      <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(b.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-xs font-semibold truncate">{b.title || b.message.slice(0, 60)}</div>
                    {b.status === "sending" && <Progress value={pct} className="h-1.5" />}
                    <div className="flex gap-3 text-[11px] text-muted-foreground">
                      <span className="text-success font-semibold"><MessageCircle className="h-3 w-3 inline" /> {fmt(b.total_delivered)}</span>
                      <span>·</span>
                      <span>{fmt(b.total_targeted)} alvo</span>
                      {b.total_failed > 0 && <><span>·</span><span className="text-destructive">{fmt(b.total_failed)} falhas</span></>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <Card className="p-4 hover:border-primary/40 transition">
      <div className={`flex items-center gap-1.5 ${accent}`}>{icon}<span className="text-[10px] uppercase tracking-wider font-bold">{label}</span></div>
      <div className="text-2xl font-black mt-1">{value}</div>
    </Card>
  );
}
