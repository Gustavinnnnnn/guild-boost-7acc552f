import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Megaphone, LogOut, MessageCircle, Crown, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { DMFlowMark } from "@/components/DMFlowMark";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

const formatDMs = (n: number) => n.toLocaleString("pt-BR");

// Compra de DMs e criação de campanhas agora são feitas pelo bot Discord.
// O site mantém só dashboard, métricas, servidores e afiliado.
const baseNav = [
  { to: "/app", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/app/campanhas", label: "Campanhas", icon: Megaphone, end: false },
  { to: "/app/creditos", label: "DMs", icon: MessageCircle, end: false },
  { to: "/app/meu-bot", label: "Meu Bot", icon: Bot, end: false },
];

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
          <Link to="/app">
            <DMFlowMark size="md" />
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
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold border border-dashed border-primary/40 text-primary bg-primary/5 mt-3">
            <Bot className="h-4 w-4" /> Use o bot Discord para comprar e divulgar
          </div>
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
        <Link to="/app">
          <DMFlowMark size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/app/creditos" className="flex items-center gap-1 px-2 py-1 rounded bg-primary/15">
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold">{formatDMs(profile?.credits ?? 0)}</span>
          </Link>
          <Button size="icon" variant="ghost" onClick={logout}><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Mobile bottom nav — pill flutuante premium */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50">
        <div className="relative rounded-2xl bg-card/85 backdrop-blur-xl border border-border/80 shadow-[0_10px_40px_-10px_hsl(0_0%_0%/0.7)] px-1.5 py-1.5">
          <ul className="flex items-stretch justify-between gap-1">
            {nav.map((n) => {
              const active =
                n.end ? location.pathname === n.to : location.pathname.startsWith(n.to);
              return (
                <li key={n.to} className="flex-1">
                  <NavLink
                    to={n.to}
                    end={n.end}
                    className="relative flex flex-col items-center justify-center gap-0.5 h-14 rounded-xl text-[10px] font-bold transition-colors"
                  >
                    {active && (
                      <motion.span
                        layoutId="bottom-nav-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/25 to-primary/10 border border-primary/40 shadow-[inset_0_1px_0_hsl(var(--primary)/0.3)]"
                      />
                    )}
                    <span className={`relative z-10 transition-transform ${active ? "scale-110" : ""}`}>
                      <n.icon
                        className={`h-[22px] w-[22px] ${active ? "text-primary" : "text-muted-foreground"}`}
                        strokeWidth={active ? 2.4 : 2}
                      />
                    </span>
                    <span
                      className={`relative z-10 leading-none tracking-tight ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {n.label}
                    </span>
                    {active && (
                      <motion.span
                        layoutId="bottom-nav-dot"
                        className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary"
                      />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
