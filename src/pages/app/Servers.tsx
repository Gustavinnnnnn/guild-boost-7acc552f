import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/DiscordIcon";
import { Loader2, RefreshCw, Plus, Check, ExternalLink, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type Guild = { guild_id: string; name: string; icon_url: string | null; bot_in_server: boolean };
type ConnectedServer = { id: string; guild_id: string; name: string; icon_url: string | null; bot_in_server: boolean };

const Servers = () => {
  const { user } = useAuth();
  const { profile, isDiscordConnected, refresh: refreshProfile } = useProfile();
  const [params, setParams] = useSearchParams();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [connected, setConnected] = useState<ConnectedServer[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [discordClientId, setDiscordClientId] = useState<string>("");

  useEffect(() => {
    if (params.get("discord_connected")) {
      toast.success("Discord conectado!");
      refreshProfile();
      params.delete("discord_connected");
      setParams(params, { replace: true });
    }
    if (params.get("discord_error")) {
      toast.error("Erro ao conectar Discord");
      params.delete("discord_error");
      setParams(params, { replace: true });
    }
  }, [params, setParams, refreshProfile]);

  const loadConnected = async () => {
    if (!user) return;
    const { data } = await supabase.from("discord_servers").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setConnected((data ?? []) as ConnectedServer[]);
  };

  useEffect(() => { loadConnected(); }, [user]);
  useEffect(() => { if (isDiscordConnected) loadGuilds(); }, [isDiscordConnected]);

  const loadGuilds = async () => {
    setLoadingGuilds(true);
    const { data, error } = await supabase.functions.invoke("discord-list-guilds");
    setLoadingGuilds(false);
    if (error || data?.error) {
      toast.error("Não foi possível carregar seus servidores. Reconecte o Discord.");
      return;
    }
    setGuilds(data.guilds || []);
  };

  const startDiscordOAuth = async () => {
    if (!user) return;
    // Get client id from a tiny edge call (or env). For simplicity ask backend? We embed via VITE not available.
    // Instead, fetch client id via a public function call. We'll just hardcode the URL building on backend... 
    // Actually we can build the URL here using DISCORD_CLIENT_ID from a public env field set in code.
    // To avoid a roundtrip, store client id as a constant in a public file the user will edit if needed.
    if (!discordClientId) {
      toast.error("Configure o Discord Client ID público na constante do app.");
      return;
    }
    const state = btoa(JSON.stringify({ origin: window.location.origin, user_id: user.id }));
    const redirectUri = encodeURIComponent(`${SUPABASE_URL}/functions/v1/discord-oauth-callback`);
    const scope = encodeURIComponent("identify guilds");
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&prompt=consent`;
  };

  // Fetch the public client id from the backend (one-time)
  useEffect(() => {
    supabase.functions.invoke("discord-config").then(({ data }) => {
      if (data?.client_id) setDiscordClientId(data.client_id);
    }).catch(() => {});
  }, []);

  const installBotUrl = (guildId: string) => {
    const perms = "274877990912"; // Send Messages + Embed Links + Read Messages
    return `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&permissions=${perms}&scope=bot&guild_id=${guildId}&disable_guild_select=true`;
  };

  const connectServer = async (g: Guild) => {
    if (!user) return;
    const { error } = await supabase.from("discord_servers").upsert({
      user_id: user.id, guild_id: g.guild_id, name: g.name, icon_url: g.icon_url, bot_in_server: g.bot_in_server,
    }, { onConflict: "user_id,guild_id" });
    if (error) return toast.error(error.message);
    toast.success(`${g.name} conectado!`);
    loadConnected();
  };

  const disconnectServer = async (id: string) => {
    await supabase.from("discord_servers").delete().eq("id", id);
    toast.success("Servidor removido");
    loadConnected();
  };

  const isAlreadyConnected = (guildId: string) => connected.some((c) => c.guild_id === guildId);

  if (!isDiscordConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-card border border-border p-8 md:p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Sincronizando sua conta do Discord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Connected servers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Servidores conectados</h2>
            <p className="text-sm text-muted-foreground">Esses servidores estão prontos para receber campanhas</p>
          </div>
        </div>
        {connected.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum servidor conectado ainda. Escolha um abaixo.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {connected.map((s) => (
              <div key={s.id} className="rounded-xl bg-card border border-border p-4">
                <div className="flex items-center gap-3">
                  {s.icon_url ? <img src={s.icon_url} className="h-12 w-12 rounded-xl" alt="" /> : <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center text-white font-bold">{s.name[0]}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{s.name}</div>
                    <div className={`text-xs ${s.bot_in_server ? "text-success" : "text-warning"}`}>{s.bot_in_server ? "● Bot ativo" : "● Bot não instalado"}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {!s.bot_in_server && discordClientId && (
                    <a href={installBotUrl(s.guild_id)} target="_blank" rel="noreferrer" className="flex-1">
                      <Button size="sm" variant="discord" className="w-full gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" /> Instalar bot
                      </Button>
                    </a>
                  )}
                  {s.bot_in_server && (
                    <Link to="/app/campanhas/nova" className="flex-1">
                      <Button size="sm" variant="discord" className="w-full gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Campanha</Button>
                    </Link>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => disconnectServer(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Discord guilds */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Seus servidores no Discord</h2>
            <p className="text-sm text-muted-foreground">Apenas servidores onde você é dono ou admin</p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadGuilds} disabled={loadingGuilds}>
            <RefreshCw className={`h-4 w-4 ${loadingGuilds ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {loadingGuilds ? (
          <div className="grid place-items-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {guilds.map((g) => {
              const already = isAlreadyConnected(g.guild_id);
              return (
                <div key={g.guild_id} className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
                  {g.icon_url ? <img src={g.icon_url} className="h-12 w-12 rounded-xl" alt="" /> : <div className="h-12 w-12 rounded-xl bg-secondary grid place-items-center font-bold">{g.name[0]}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{g.name}</div>
                    <div className="text-xs text-muted-foreground">{g.bot_in_server ? "Bot já instalado" : "Bot ausente"}</div>
                  </div>
                  {already ? (
                    <Button size="sm" variant="secondary" disabled className="gap-1"><Check className="h-3.5 w-3.5" /> Conectado</Button>
                  ) : (
                    <Button size="sm" variant="discord" onClick={() => connectServer(g)} className="gap-1"><Plus className="h-3.5 w-3.5" /> Conectar</Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Servers;
