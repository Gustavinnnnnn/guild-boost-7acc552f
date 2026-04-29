import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      // Tokens come in the URL hash: #access_token=...&refresh_token=...
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        // Maybe Supabase already auto-handled it via detectSessionInUrl
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate("/app/servidores", { replace: true });
          return;
        }
        toast.error("Sessão inválida. Tente entrar novamente.");
        navigate("/auth", { replace: true });
        return;
      }

      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        toast.error("Erro ao iniciar sessão");
        navigate("/auth", { replace: true });
        return;
      }
      toast.success("Conectado com Discord!");
      navigate("/app/servidores", { replace: true });
    };
    run();
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground mt-3">Finalizando login...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
