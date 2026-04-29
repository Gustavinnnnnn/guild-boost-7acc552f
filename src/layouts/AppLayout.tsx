import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Server, Megaphone, LogOut, Plus } from "lucide-react";
import { DiscordIcon } from "@/components/DiscordIcon";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/app/servidores", label: "Meus Servidores", icon: Server },
  { to: "/app/campanhas", label: "Campanhas", icon: Megaphone },
];

const AppLayout = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col">
        <div className="p-5 border-b border-border">
          <Link to="/app/servidores" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-glow">
              <DiscordIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">ServerBoost</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) =>
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

        <div className="p-3 border-t border-border">
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

      {/* Mobile header */}
      <header className="md:hidden border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <Link to="/app/servidores" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <DiscordIcon className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold">ServerBoost</span>
        </Link>
        <Button size="icon" variant="ghost" onClick={logout}><LogOut className="h-4 w-4" /></Button>
      </header>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`
          }>
            <n.icon className="h-5 w-5" />
            {n.label.split(" ")[0]}
          </NavLink>
        ))}
        <Link to="/app/campanhas/nova" className="flex-1 flex flex-col items-center gap-1 py-3 text-xs text-foreground">
          <Plus className="h-5 w-5" /> Nova
        </Link>
      </nav>
    </div>
  );
};

export default AppLayout;
