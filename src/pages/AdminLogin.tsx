import { FormEvent, forwardRef, useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.png";

const AdminLogin = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/app/admin";
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: profileLoading, refresh } = useProfile();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Login Admin | ServerBoost";
  }, []);

  if (!authLoading && !profileLoading && user && isAdmin) {
    return <Navigate to={redirect} replace />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return toast.error("Coloque o e-mail e a senha do admin.");

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      setSubmitting(false);
      toast.error("E-mail ou senha incorretos.");
      return;
    }

    const { data: bootstrap, error: bootstrapError } = await (supabase as any).rpc("bootstrap_admin_account");
    if (bootstrapError || !(bootstrap as { is_admin?: boolean } | null)?.is_admin) {
      await supabase.auth.signOut();
      setSubmitting(false);
      toast.error("Essa conta não tem acesso ao painel admin.");
      return;
    }

    await refresh();
    setSubmitting(false);
    toast.success("Admin conectado.");
    navigate(redirect, { replace: true });
  };

  return (
    <main ref={ref} className="min-h-screen bg-background text-foreground grid place-items-center p-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-card">
        <div className="mb-6 text-center">
          <img src={logo} alt="ServerBoost" className="mx-auto mb-4 h-16 w-16 rounded-lg object-cover shadow-glow" />
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary">
            <ShieldCheck className="h-4 w-4" /> Admin
          </div>
          <h1 className="text-2xl font-black">Login administrativo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entre com o e-mail e senha da conta admin.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">E-mail</label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Senha</label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="h-11 w-full font-black" disabled={submitting || authLoading}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            Entrar no admin
          </Button>
        </form>
      </section>
    </main>
  );
});

AdminLogin.displayName = "AdminLogin";

export default AdminLogin;