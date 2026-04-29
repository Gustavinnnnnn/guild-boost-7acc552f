import { useEffect, useState } from "react";
import { Plus, Users, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Server = {
  id: string;
  name: string;
  icon: string;
  members: number;
  status: string;
  bot_active: boolean;
};

const ICONS = ["🎮", "🔥", "🛒", "💬", "⚔️", "🎨", "🚀", "💎", "🌟"];

const Servers = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎮");
  const [members, setMembers] = useState(100);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("servers").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setServers(data ?? []);
  };

  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!user || !name.trim()) return toast.error("Dê um nome ao servidor");
    const { error } = await supabase.from("servers").insert({
      user_id: user.id, name, icon, members, status: "active", bot_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Servidor adicionado!");
    setOpen(false); setName(""); setMembers(100);
    load();
  };

  const toggleBot = async (s: Server) => {
    await supabase.from("servers").update({ bot_active: !s.bot_active, status: !s.bot_active ? "active" : "inactive" }).eq("id", s.id);
    toast.success(s.bot_active ? "Bot removido" : "Bot ativado!");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("servers").delete().eq("id", id);
    toast.success("Servidor removido");
    load();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">Conecte e gerencie os servidores onde o ServerBoost atua.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="discord" className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar servidor</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Nome do servidor</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Roblox Trade Hub" className="mt-2" />
              </div>
              <div>
                <Label>Ícone</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {ICONS.map((i) => (
                    <button key={i} type="button" onClick={() => setIcon(i)} className={`h-10 w-10 rounded-lg text-xl border ${icon === i ? "border-primary bg-primary/10" : "border-border bg-secondary"}`}>{i}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Membros atuais</Label>
                <Input type="number" value={members} onChange={(e) => setMembers(Number(e.target.value))} className="mt-2" />
              </div>
              <Button variant="discord" className="w-full" onClick={create}>Adicionar servidor</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {servers.length === 0 ? (
        <div className="rounded-xl bg-card border border-border p-12 text-center">
          <div className="text-5xl mb-3">🤖</div>
          <h3 className="font-bold mb-1">Nenhum servidor ainda</h3>
          <p className="text-sm text-muted-foreground">Adicione seu primeiro servidor para começar a impulsionar.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map((s) => (
            <div key={s.id} className="rounded-xl bg-card border border-border p-5 hover:border-primary/50 transition-smooth">
              <div className="flex items-start justify-between">
                <div className="h-14 w-14 rounded-2xl bg-gradient-primary grid place-items-center text-2xl shadow-glow">{s.icon}</div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${s.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {s.status === "active" ? "Ativo" : "Inativo"}
                </span>
              </div>
              <h3 className="font-bold mt-4">{s.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Users className="h-3.5 w-3.5" /> {s.members.toLocaleString()} membros
              </div>
              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                {s.bot_active ? (
                  <Button size="sm" variant="secondary" className="flex-1 gap-1.5" onClick={() => toggleBot(s)}>
                    <Check className="h-3.5 w-3.5" /> Bot ativo
                  </Button>
                ) : (
                  <Button size="sm" variant="discord" className="flex-1" onClick={() => toggleBot(s)}>Adicionar bot</Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Servers;
