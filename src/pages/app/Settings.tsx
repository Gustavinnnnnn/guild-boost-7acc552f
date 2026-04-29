import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { mockUser } from "@/lib/mock-data";
import { toast } from "sonner";

const Settings = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-xl bg-card border border-border p-6">
        <h2 className="font-bold mb-5">Perfil</h2>
        <div className="flex items-center gap-4 mb-6">
          <img src={mockUser.avatar} alt="" className="h-16 w-16 rounded-full bg-secondary" />
          <Button variant="outline" size="sm">Trocar avatar</Button>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Nome de usuário</Label>
            <Input defaultValue={mockUser.username} className="mt-2" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="seu@email.com" className="mt-2" />
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

      <Button variant="discord" className="w-full" onClick={() => toast.success("Configurações salvas")}>
        Salvar alterações
      </Button>
    </div>
  );
};

export default Settings;
