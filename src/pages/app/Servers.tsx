import { Plus, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockServers } from "@/lib/mock-data";
import { toast } from "sonner";

const Servers = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Conecte e gerencie os servidores onde o ServerBoost atua.</p>
        <Button variant="discord" className="gap-2" onClick={() => toast.success("Bot adicionado! (simulação)")}>
          <Plus className="h-4 w-4" /> Adicionar bot
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockServers.map((s) => (
          <div key={s.id} className="rounded-xl bg-card border border-border p-5 hover:border-primary/50 transition-smooth">
            <div className="flex items-start justify-between">
              <div className="h-14 w-14 rounded-2xl bg-gradient-primary grid place-items-center text-2xl shadow-glow">
                {s.icon}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  s.status === "active"
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.status === "active" ? "Ativo" : "Inativo"}
              </span>
            </div>
            <h3 className="font-bold mt-4">{s.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Users className="h-3.5 w-3.5" /> {s.members.toLocaleString()} membros
            </div>
            <div className="mt-4 pt-4 border-t border-border flex gap-2">
              {s.boost ? (
                <Button size="sm" variant="secondary" className="flex-1 gap-1.5" disabled>
                  <Check className="h-3.5 w-3.5" /> Bot ativo
                </Button>
              ) : (
                <Button size="sm" variant="discord" className="flex-1" onClick={() => toast.success(`Bot adicionado em ${s.name}`)}>
                  Adicionar bot
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Servers;
