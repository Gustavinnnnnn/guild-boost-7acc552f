import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Server, Rocket, Megaphone, BarChart3, Wallet, Settings, Bell, Search,
} from "lucide-react";
import { mockUser } from "@/lib/mock-data";

const navItems = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/servidores", label: "Meus Servidores", icon: Server },
  { to: "/app/criar-campanha", label: "Criar Campanha", icon: Rocket },
  { to: "/app/campanhas", label: "Campanhas Ativas", icon: Megaphone },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/carteira", label: "Carteira", icon: Wallet },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
];

const AppLayout = () => {
  const { pathname } = useLocation();
  const current = navItems.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-sidebar-foreground">ServerBoost</span>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Menu
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent">
            <img src={mockUser.avatar} alt={mockUser.username} className="h-9 w-9 rounded-full bg-card" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{mockUser.username}</div>
              <div className="text-xs text-muted-foreground">#{mockUser.discriminator}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-lg md:text-xl font-bold">{current?.label ?? "Dashboard"}</h1>
            <p className="hidden md:block text-xs text-muted-foreground">Bem-vindo de volta, {mockUser.username} 👋</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg bg-secondary border border-border w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar..."
                className="bg-transparent flex-1 outline-none text-sm placeholder:text-muted-foreground"
              />
            </div>
            <button className="h-9 w-9 rounded-lg bg-secondary border border-border grid place-items-center hover:bg-primary/20 transition-smooth">
              <Bell className="h-4 w-4" />
            </button>
            <div className="px-3 h-9 rounded-lg bg-success/15 text-success border border-success/30 flex items-center text-sm font-semibold">
              R$ {mockUser.balance.toFixed(2)}
            </div>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar border-t border-sidebar-border flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label.split(" ")[0]}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
