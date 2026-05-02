import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  AlertTriangle, KeyRound, CheckCircle2, Server, Send, Loader2, RefreshCw, User as UserIcon, Trash2,
} from "lucide-react";

type Selfbot = {
  id: string;
  discord_user_id?: string;
  discord_username?: string;
  discord_avatar_url?: string;
  selected_guild_id?: string;
  selected_guild_name?: string;
  selected_guild_member_count?: number;
  total_broadcasts: number;
  total_dms_sent: number;
  total_dms_failed: number;
};
type Guild = { id: string; name: string; member_count: number; icon: string | null };
type Broadcast = {
  id: string; message: string; status: string;
  total_targeted: number; total_sent: number; total_failed: number;
  delay_seconds: number; created_at: string; finished_at?: string | null;
};

const fmt = (n: number) => (n ?? 0).toLocaleString("pt-BR");

export default function MyAccount() {
  const [sb, setSb] = useState<Selfbot | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [loadingGuilds, setLoadingGuilds] = useState(false);

  const [message, setMessage] = useState("");
  const [delay, setDelay] = useState(10);
  const [targetCount, setTargetCount] = useState(50);
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const [s, b] = await Promise.all([
      supabase.from("user_selfbots").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("selfbot_broadcasts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setSb(s.data as any);
    setBroadcasts((b.data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const has = broadcasts.some(b => b.status === "sending");
    if (!has) return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [broadcasts]);

  const connect = async () => {
    if (!token || token.length < 50) return toast.error("Cole o token completo da conta.");
    setConnecting(true);
    const { data, error } = await supabase.functions.invoke("selfbot-connect", { body: { action: "connect", token } });
    setConnecting(false);
    if (error || data?.error) return toast.error(data?.detail || data?.error || "Erro.");
    toast.success(`Conta ${data.selfbot.discord_username} conectada.`);
    setToken("");
    setSb(data.selfbot);
    setGuilds(data.guilds || []);
  };

  const listGuilds = async () => {
    setLoadingGuilds(true);
    const { data, error } = await supabase.functions.invoke("selfbot-connect", { body: { action: "list_guilds" } });
    setLoadingGuilds(false);
    if (error || data?.error) return toast.error(data?.detail || data?.error || "Erro.");
    setGuilds(data.guilds || []);
  };

  const selectGuild = async (g: Guild) => {
    const { data, error } = await supabase.functions.invoke("selfbot-connect", {
      body: { action: "select_guild", guild_id: g.id, guild_name: g.name, guild_member_count: g.member_count },
    });
    if (error || data?.error) return toast.error(data?.error || "Erro.");
    setSb(data.selfbot);
    setGuilds([]);
    toast.success(`Servidor "${g.name}" selecionado.`);
  };

  const switchGuild = async () => {
    const { data, error } = await supabase.functions.invoke("selfbot-connect", { body: { action: "clear_guild" } });
    if (error || data?.error) return toast.error(data?.error || "Erro.");
    setSb(data.selfbot);
    await listGuilds();
  };

  const disconnect = async () => {
    if (!confirm("Desconectar a conta? O token será apagado.")) return;
    const { error } = await supabase.functions.invoke("selfbot-connect", { body: { action: "disconnect" } });
    if (error) return toast.error("Erro.");
    setSb(null); setGuilds([]); setBroadcasts([]);
    toast.success("Conta desconectada.");
  };

  const broadcast = async () => {
    if (!message || message.length < 5) return toast.error("Mensagem muito curta.");
    if (!sb?.selected_guild_id) return toast.error("Escolha um servidor.");
    if (!confirm(`Enviar DM pra até ${targetCount} membros de "${sb.selected_guild_name}"?\n\n⚠️ Sua conta pode ser banida.`)) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("selfbot-broadcast", {
      body: { message, delay_seconds: delay, target_count: targetCount },
    });
    setSending(false);
    if (error || data?.error) return toast.error(data?.detail || data?.error || "Erro.");
    toast.success("Disparo iniciado! Acompanhe abaixo.");
    setMessage("");
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
          <UserIcon className="h-7 w-7 text-primary" /> Minha Conta
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Divulgue usando uma conta Discord descartável.</p>
      </div>

      <Alert variant="destructive" className="border-destructive/50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Risco de banimento</AlertTitle>
        <AlertDescription>
          Usar conta de usuário pra mandar DM em massa <strong>viola os Termos do Discord</strong> e pode causar
          <strong> banimento permanente sem aviso</strong>. Use SEMPRE uma conta descartável, nunca sua principal.
        </AlertDescription>
      </Alert>

      {/* Estado 1: sem conta conectada */}
      {!sb && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Conectar conta Discord</h2>
          </div>
          <Label htmlFor="token">Token da conta</Label>
          <Input
            id="token"
            type="password"
            placeholder="MTI2NDU2..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono mt-1"
          />
          <p className="text-xs text-muted-foreground mt-2">
            No Discord web (F12) → Network → Filtre "api" → clique numa request → Headers → copie o valor de <code>authorization</code>.
          </p>
          <Button onClick={connect} disabled={connecting} className="mt-4 w-full" variant="discord">
            {connecting ? <><Loader2 className="h-4 w-4 animate-spin" /> Conectando…</> : "Conectar"}
          </Button>
        </Card>
      )}

      {/* Estado 2: conta conectada */}
      {sb && (
        <>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              {sb.discord_avatar_url ? (
                <img src={sb.discord_avatar_url} className="h-12 w-12 rounded-full" alt="" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-secondary grid place-items-center font-bold">
                  {sb.discord_username?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{sb.discord_username}</div>
                <div className="flex items-center gap-1.5 text-xs text-success">
                  <CheckCircle2 className="h-3 w-3" /> Conectado
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={disconnect}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
              <Stat label="Disparos" value={fmt(sb.total_broadcasts)} />
              <Stat label="DMs enviadas" value={fmt(sb.total_dms_sent)} />
              <Stat label="Falhas" value={fmt(sb.total_dms_failed)} />
            </div>
          </Card>

          {/* Servidor */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                <h2 className="font-bold">Servidor para divulgar</h2>
              </div>
              {sb.selected_guild_id && (
                <Button size="sm" variant="outline" onClick={switchGuild}>
                  <RefreshCw className="h-3.5 w-3.5" /> Trocar
                </Button>
              )}
            </div>

            {sb.selected_guild_id ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                <div>
                  <div className="font-semibold">{sb.selected_guild_name}</div>
                  <div className="text-xs text-muted-foreground">{fmt(sb.selected_guild_member_count || 0)} membros</div>
                </div>
              </div>
            ) : (
              <>
                {guilds.length === 0 ? (
                  <Button onClick={listGuilds} disabled={loadingGuilds} variant="outline" className="w-full">
                    {loadingGuilds ? <Loader2 className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
                    Listar servidores
                  </Button>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {guilds.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => selectGuild(g)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition text-left"
                      >
                        {g.icon ? (
                          <img src={g.icon} className="h-9 w-9 rounded" alt="" />
                        ) : (
                          <div className="h-9 w-9 rounded bg-secondary grid place-items-center font-bold text-xs">
                            {g.name[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{g.name}</div>
                          <div className="text-xs text-muted-foreground">{fmt(g.member_count)} membros</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Disparo */}
          {sb.selected_guild_id && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Send className="h-5 w-5 text-primary" />
                <h2 className="font-bold">Disparar DMs</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="msg">Mensagem</Label>
                  <Textarea
                    id="msg"
                    placeholder="Olá! Confira meu servidor: discord.gg/..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    className="mt-1"
                  />
                  <div className="text-xs text-muted-foreground mt-1">{message.length}/2000</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target">Quantos membros</Label>
                    <Input
                      id="target" type="number" min={1} max={500}
                      value={targetCount}
                      onChange={(e) => setTargetCount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="delay">Delay entre DMs (s)</Label>
                    <Input
                      id="delay" type="number" min={3} max={120}
                      value={delay}
                      onChange={(e) => setDelay(Math.max(3, Math.min(120, Number(e.target.value) || 3)))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                  Tempo estimado: <strong>~{Math.round((targetCount * delay) / 60)} min</strong>.
                  Quanto maior o delay, menor o risco de detecção.
                </div>

                <Button onClick={broadcast} disabled={sending} className="w-full" variant="premium" size="lg">
                  {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Iniciando…</> : <><Send className="h-4 w-4" /> Disparar</>}
                </Button>
              </div>
            </Card>
          )}

          {/* Histórico */}
          {broadcasts.length > 0 && (
            <Card className="p-5">
              <h2 className="font-bold mb-4">Histórico</h2>
              <div className="space-y-3">
                {broadcasts.map((b) => (
                  <div key={b.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={b.status === "done" ? "default" : b.status === "error" ? "destructive" : "secondary"}>
                        {b.status === "sending" ? "Enviando…" : b.status === "done" ? "Concluído" : "Erro"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2 text-muted-foreground">{b.message}</p>
                    <div className="flex gap-4 text-xs mt-2">
                      <span>✅ {fmt(b.total_sent)}</span>
                      <span>❌ {fmt(b.total_failed)}</span>
                      <span className="text-muted-foreground">de {fmt(b.total_targeted)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-black">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
