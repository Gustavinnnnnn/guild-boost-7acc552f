import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DiscordIcon } from "@/components/DiscordIcon";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (user) return <Navigate to="/app/servidores" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/app/servidores` },
      });
      if (error) toast.error(error.message);
      else toast.success("Conta criada! Verifique seu email.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else { toast.success("Bem-vindo!"); navigate("/app/servidores"); }
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(235_86%_65%/0.15),transparent_50%)]" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow items-center justify-center shadow-glow mb-4">
            <DiscordIcon className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold">ServerBoost</h1>
          <p className="text-muted-foreground text-sm mt-1">Cresça seu servidor do Discord de verdade</p>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 shadow-2xl">
          <div className="flex gap-1 p-1 bg-secondary rounded-lg mb-5">
            <button onClick={() => setMode("login")} className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${mode === "login" ? "bg-card text-foreground" : "text-muted-foreground"}`}>Entrar</button>
            <button onClick={() => setMode("signup")} className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${mode === "signup" ? "bg-card text-foreground" : "text-muted-foreground"}`}>Criar conta</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" placeholder="seu@email.com" />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" placeholder="Mínimo 6 caracteres" />
            </div>
            <Button type="submit" variant="discord" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Após entrar, conecte sua conta do Discord para listar seus servidores.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
