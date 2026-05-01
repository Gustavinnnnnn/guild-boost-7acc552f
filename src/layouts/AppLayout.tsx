import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Megaphone, LogOut, Plus, MessageCircle, Gift, Server, Crown } from "lucide-react";
import { DiscordIcon } from "@/components/DiscordIcon";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

const formatDMs = (n: number) => n.toLocaleString("pt-BR");

const baseNav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/campanhas", label: "Campanhas", icon: Megaphone, end: false },
  { to: "/app/servidores", label: "Servidores", icon: Server, end: false },
  { to: "/app/creditos", label: "DMs", icon: MessageCircle, end: false },
  { to: "/app/afiliados", label: "Afiliados", icon: Gift, end: false },
];

const AppLayout = () => {
  const navigate = useNavigate();
  const { profile, isAdmin } = useProfile();

  const nav = isAdmin
    ? [...baseNav, { to: "/app/admin", label: "Admin", icon: Crown, end: false }]
    : baseNav;

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col">
        <div className="p-5 border-b border-border">
          <Link to="/app" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-glow">
              <DiscordIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">ServerBoost</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`
            }>
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
          <Link to="/app/campanhas/nova" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold border border-dashed border-border text-foreground hover:border-primary hover:bg-primary/5 transition mt-3">
            <Plus className="h-4 w-4" /> Nova campanha
          </Link>
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <Link to="/app/creditos" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/15 to-primary-glow/15 hover:from-primary/25 hover:to-primary-glow/25 transition">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">DMs</span>
            <span className="ml-auto font-bold text-sm">{formatDMs(profile?.credits ?? 0)}</span>
          </Link>
          <div className="flex items-center gap-2.5 px-2 py-2">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="h-9 w-9 rounded-full" alt="" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-secondary grid place-items-center text-sm font-bold">
                {profile?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{profile?.discord_username || profile?.username || "Usuário"}</div>
              {profile?.discord_id && <div className="text-[10px] text-success">● Discord conectado</div>}
            </div>
            <Button size="icon" variant="ghost" onClick={logout} title="Sair"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </aside>

      <header className="md:hidden border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <Link to="/app" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <DiscordIcon className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold">ServerBoost</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/app/creditos" className="flex items-center gap-1 px-2 py-1 rounded bg-primary/15">
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold">{formatDMs(profile?.credits ?? 0)}</span>
          </Link>
          <Button size="icon" variant="ghost" onClick={logout}><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] ${isActive ? "text-primary" : "text-muted-foreground"}`
          }>
            <n.icon className="h-5 w-5" />
            {n.label.split(" ")[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AppLayout;
