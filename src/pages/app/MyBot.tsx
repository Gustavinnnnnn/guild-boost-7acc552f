import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Bot, KeyRound, CheckCircle2, Server, Send, Sparkles, Copy, QrCode,
  TrendingUp, MessageCircle, AlertCircle, Loader2, Users,
} from "lucide-react";

type UserBot = {
  id: string; bot_id?: string; bot_username?: string; bot_avatar_url?: string;
  guild_id?: string; guild_name?: string; guild_member_count?: number;
  access_paid: boolean; access_paid_at?: string;
  total_broadcasts: number; total_dms_sent: number; total_dms_failed: number; total_clicks: number;
};
type Guild = { id: string; name: string; member_count: number; icon: string | null };
type Broadcast = {
  id: string; title?: string; message: string; status: string;
  total_targeted: number; total_delivered: number; total_failed: number;
  created_at: string;
};

const fmt = (n: number) => (n ?? 0).toLocaleString("pt-BR");

export default function MyBot() {
  const [bot, setBot] = useState<UserBot | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);

  // Connect
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);

  // Pay
  const [pay, setPay] = useState<{ reference: string; pix_code: string; qr_code_base64: string } | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [creatingPay, setCreatingPay] = useState(false);

  // Broadcast form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [image_url, setImageUrl] = useState("");
  const [button_label, setButtonLabel] = useState("");
  const [button_url, setButtonUrl] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
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

  // Polling do pagamento
  useEffect(() => {
    if (!pay || !payOpen) return;
    const t = setInterval(async () => {
      const { data, error } = await supabase.functions.invoke("user-bot-pay", {
        body: { action: "check", reference: pay.reference },
      });
      if (!error && data?.status === "approved") {
        toast.success("Pagamento aprovado! Acesso liberado 🎉");
        setPayOpen(false); setPay(null);
        load();
      }
    }, 4000);
    return () => clearInterval(t);
  }, [pay, payOpen]);

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

  const startPay = async () => {
    setCreatingPay(true);
    const { data, error } = await supabase.functions.invoke("user-bot-pay", { body: { action: "create" } });
    setCreatingPay(false);
    if (error || data?.error) return toast.error(data?.error || "Erro ao gerar PIX.");
    setPay({ reference: data.reference, pix_code: data.pix_code, qr_code_base64: data.qr_code_base64 });
    setPayOpen(true);
  };

  const sendBroadcast = async () => {
    if (!message.trim()) return toast.error("Escreva a mensagem.");
    setSending(true);
    const { data, error } = await supabase.functions.invoke("user-bot-broadcast", {
      body: { title, message, image_url, button_label, button_url },
    });
    setSending(false);
    if (error || data?.error) return toast.error(data?.message || data?.error || "Erro ao disparar.");
    toast.success(`Disparando para ${fmt(data.total_targeted)} membros!`);
    setTitle(""); setMessage(""); setImageUrl(""); setButtonLabel(""); setButtonUrl("");
    load();
  };

  const copyPix = () => {
    if (!pay) return;
    navigator.clipboard.writeText(pay.pix_code);
    toast.success("Código PIX copiado!");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // ===== ETAPA 1: Não conectou bot =====
  if (!bot?.bot_id) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow items-center justify-center shadow-glow">
            <Bot className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Meu Bot Próprio</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Conecte seu próprio bot do Discord e divulgue por DM para todos os membros do <b>seu servidor</b>. Pagamento único de <b>R$ 10</b> e acesso vitalício.
          </p>
        </div>

        <Card className="p-6 space-y-5 bg-gradient-to-br from-card to-card/50 border-primary/20">
          <h2 className="font-bold text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Conectar bot</h2>
          <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Vá em <a href="https://discord.com/developers/applications" target="_blank" className="text-primary underline">discord.com/developers/applications</a></li>
            <li>Crie uma aplicação → Bot → <b>Reset Token</b> e copie</li>
            <li>Em <b>Privileged Gateway Intents</b>, ative <b>SERVER MEMBERS INTENT</b></li>
            <li>Convide o bot pro seu servidor com permissões de envio de mensagem</li>
            <li>Cole o token aqui embaixo</li>
          </ol>
          <div className="space-y-2">
            <Label>Token do bot</Label>
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="MTIzNDU2Nzg5..." />
          </div>
          <Button onClick={connect} disabled={connecting} className="w-full">
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Bot className="h-4 w-4" /> Conectar bot</>}
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

  // ===== ETAPA 3: Dashboard + Form (acesso gratuito por enquanto) =====
  const broadcastsToday = broadcasts.filter(b =>
    new Date(b.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
  ).length;
  const remainingToday = Math.max(0, 3 - broadcastsToday);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        {bot.bot_avatar_url && <img src={bot.bot_avatar_url} className="h-12 w-12 rounded-full ring-2 ring-primary" />}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{bot.bot_username}</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Server className="h-3.5 w-3.5" /> {bot.guild_name} · {fmt(bot.guild_member_count ?? 0)} membros
          </div>
        </div>
        <Badge className="bg-success/15 text-success border-success/30">Vitalício ativo</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Divulgações</div>
          <div className="text-2xl font-bold">{fmt(bot.total_broadcasts)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">DMs entregues</div>
          <div className="text-2xl font-bold text-success">{fmt(bot.total_dms_sent)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Falhas</div>
          <div className="text-2xl font-bold text-muted-foreground">{fmt(bot.total_dms_failed)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Restantes hoje</div>
          <div className="text-2xl font-bold text-primary">{remainingToday}/3</div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Nova divulgação</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Título (opcional)</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="🎁 Promoção exclusiva!" maxLength={256} />
          </div>
          <div className="space-y-2">
            <Label>URL da imagem (opcional)</Label>
            <Input value={image_url} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Mensagem *</Label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} maxLength={4000}
            placeholder="Ei! Temos uma promoção especial rolando hoje..." />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Texto do botão (opcional)</Label>
            <Input value={button_label} onChange={e => setButtonLabel(e.target.value)} placeholder="Ver oferta" maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label>URL do botão (opcional)</Label>
            <Input value={button_url} onChange={e => setButtonUrl(e.target.value)} placeholder="https://sualoja.com/promo" />
          </div>
        </div>
        <Button onClick={sendBroadcast} disabled={sending || remainingToday === 0} className="w-full bg-gradient-to-r from-primary to-primary-glow">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> :
            remainingToday === 0 ? "Limite diário atingido" :
              <><Send className="h-4 w-4" /> Disparar para {fmt(bot.guild_member_count ?? 0)} membros</>}
        </Button>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-bold text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Histórico</h2>
        {broadcasts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma divulgação ainda.</p>
        ) : (
          <div className="space-y-2">
            {broadcasts.map(b => (
              <div key={b.id} className="p-3 rounded-lg border border-border space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={b.status === "sent" ? "default" : b.status === "sending" ? "secondary" : "destructive"}>
                    {b.status === "sent" ? "Enviado" : b.status === "sending" ? "Enviando..." : b.status}
                  </Badge>
                  <span className="font-semibold text-sm truncate">{b.title || b.message.slice(0, 60)}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(b.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span><MessageCircle className="h-3 w-3 inline" /> {fmt(b.total_delivered)}/{fmt(b.total_targeted)} entregues</span>
                  {b.total_failed > 0 && <span>· {fmt(b.total_failed)} falhas</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
