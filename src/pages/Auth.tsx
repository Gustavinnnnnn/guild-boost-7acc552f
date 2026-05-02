import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/DiscordIcon";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { SupportFab } from "@/components/SupportFab";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Auth = () => {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const [clientId, setClientId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const redirect = params.get("redirect") || "/app";

  useEffect(() => {
    supabase.functions.invoke("discord-config").then(({ data }) => {
      if (data?.client_id) setClientId(data.client_id);
    }).catch(() => {});
  }, []);

  if (loading) return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (user) return <Navigate to={redirect} replace />;

  const loginWithDiscord = () => {
    if (!clientId) return toast.error("Configuração do Discord não carregada");
    setBusy(true);
    const state = btoa(JSON.stringify({ origin: window.location.origin, redirect, nonce: crypto.randomUUID() }));
    const redirectUri = encodeURIComponent(`${SUPABASE_URL}/functions/v1/discord-oauth-callback`);
    const scope = encodeURIComponent("identify email guilds");
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&prompt=consent`;
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(235_86%_65%/0.15),transparent_50%)]" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="DMFlow" className="h-20 w-20 mx-auto rounded-2xl shadow-glow mb-4 object-cover" width={80} height={80} />
          <h1 className="text-3xl font-bold">DMFlow</h1>
          <p className="text-muted-foreground text-sm mt-1">Cresça seu servidor do Discord de verdade</p>
        </div>

        <div className="rounded-2xl bg-card border border-border p-8 shadow-2xl text-center">
          <h2 className="text-lg font-semibold mb-2">Entre com sua conta do Discord</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sem senha. Sem cadastro. Só clicar e autorizar.
          </p>
          <Button variant="discord" size="xl" className="w-full gap-2" onClick={loginWithDiscord} disabled={!clientId || busy}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><DiscordIcon className="h-5 w-5" /> Entrar com Discord</>}
          </Button>
          {!clientId && <p className="text-xs text-muted-foreground mt-3">Carregando...</p>}
        </div>
      </div>
      <SupportFab />
    </div>
  );
};

export default Auth;
