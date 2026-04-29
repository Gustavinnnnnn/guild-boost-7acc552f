import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (profile) setUsername(profile.username);
  }, [profile]);

  const save = async () => {
    if (!user) return;
    if (!username.trim()) return toast.error("Nome obrigatório");
    const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
    refresh();
  };

  const avatar = profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username ?? "user"}`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-xl bg-card border border-border p-6">
        <h2 className="font-bold mb-5">Perfil</h2>
        <div className="flex items-center gap-4 mb-6">
          <img src={avatar} alt="" className="h-16 w-16 rounded-full bg-secondary" />
          <div>
            <div className="font-semibold">{profile?.username}</div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Nome de usuário</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={user?.email ?? ""} disabled className="mt-2 opacity-60" />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-6">
        <h2 className="font-bold mb-5">Preferências</h2>
        <div className="space-y-4">
          {[
            { l: "Notificações por email", d: "Receba updates de campanhas" },
            { l: "Notificações no Discord", d: "Avisos importantes no DM" },
            { l: "Resumo semanal", d: "Relatório toda segunda" },
          ].map((p, i) => (
            <div key={p.l} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
              <div>
                <div className="font-semibold text-sm">{p.l}</div>
                <div className="text-xs text-muted-foreground">{p.d}</div>
              </div>
              <Switch defaultChecked={i !== 2} />
            </div>
          ))}
        </div>
      </div>

      <Button variant="discord" className="w-full" onClick={save}>Salvar alterações</Button>
    </div>
  );
};

export default Settings;
