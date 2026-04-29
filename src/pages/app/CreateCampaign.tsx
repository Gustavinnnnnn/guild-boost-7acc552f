import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const niches = ["Roblox", "Free Fire", "Loja digital", "Geral"];
const audiences = ["Gamers", "Compradores ativos"];
const deliveries = [
  { id: "clicks", label: "Cliques", desc: "Pague por cliques no convite" },
  { id: "joins", label: "Entradas", desc: "Pague apenas por novos membros" },
];

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [servers, setServers] = useState<{ id: string; name: string; icon: string; members: number }[]>([]);
  const [name, setName] = useState("");
  const [serverId, setServerId] = useState<string>("");
  const [niche, setNiche] = useState("Roblox");
  const [audience, setAudience] = useState("Gamers");
  const [budget, setBudget] = useState([50]);
  const [delivery, setDelivery] = useState("clicks");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("servers").select("id,name,icon,members").eq("user_id", user.id).then(({ data }) => {
      setServers(data ?? []);
      if (data && data.length && !serverId) setServerId(data[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!name.trim()) return toast.error("Dê um nome à campanha");
    if (!serverId) return toast.error("Adicione um servidor primeiro");
    if (budget[0] > profile.balance) return toast.error("Saldo insuficiente. Recarregue na carteira.");

    setBusy(true);
    // Simulate immediate seed metrics
    const seedClicks = Math.round(budget[0] * 8 + Math.random() * 50);
    const seedMembers = Math.round(budget[0] * 1.2 + Math.random() * 10);
    const seedImpressions = seedClicks * 15;
    const initialSpend = +(budget[0] * 0.3).toFixed(2);

    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      server_id: serverId,
      name,
      niche,
      audience,
      delivery_type: delivery,
      budget: budget[0],
      spent: initialSpend,
      impressions: seedImpressions,
      clicks: seedClicks,
      members_gained: seedMembers,
      status: "active",
    });
    if (error) { setBusy(false); return toast.error(error.message); }

    // Debit wallet
    await supabase.from("profiles").update({ balance: profile.balance - initialSpend }).eq("id", user.id);
    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      description: `Campanha: ${name}`,
      amount: -initialSpend,
      type: "out",
    });
    refresh();

    toast.success("Campanha iniciada com sucesso! 🚀");
    setTimeout(() => navigate("/app/campanhas"), 600);
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <div className="rounded-xl bg-card border border-border p-6 space-y-5">
        <div>
          <Label htmlFor="name">Nome da campanha</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Boost Loja Junho" className="mt-2" />
        </div>

        <div>
          <Label>Servidor</Label>
          {servers.length === 0 ? (
            <div className="mt-2 p-4 rounded-lg bg-secondary/40 border border-border text-sm text-muted-foreground">
              Adicione um servidor em <strong>Meus Servidores</strong> primeiro.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              {servers.map((s) => (
                <button key={s.id} type="button" onClick={() => setServerId(s.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-smooth ${
                    serverId === s.id ? "border-primary bg-primary/10" : "border-border bg-secondary/40 hover:border-primary/40"
                  }`}>
                  <span className="text-2xl">{s.icon}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.members} membros</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <Label>Nicho</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {niches.map((n) => (
                <button key={n} type="button" onClick={() => setNiche(n)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-smooth ${
                    niche === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/40 hover:border-primary/40"
                  }`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>Público alvo</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {audiences.map((a) => (
                <button key={a} type="button" onClick={() => setAudience(a)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-smooth ${
                    audience === a ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/40 hover:border-primary/40"
                  }`}>{a}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Orçamento</Label>
            <span className="text-lg font-bold text-primary">R$ {budget[0]}</span>
          </div>
          <Slider value={budget} onValueChange={setBudget} min={10} max={500} step={10} />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>R$ 10</span>
            <span>Estimado: ~{Math.round(budget[0] * 4)} membros</span>
            <span>R$ 500</span>
          </div>
          {profile && (
            <div className="text-xs text-muted-foreground mt-2">Saldo disponível: <span className="text-success font-semibold">R$ {profile.balance.toFixed(2)}</span></div>
          )}
        </div>

        <div>
          <Label>Tipo de entrega</Label>
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            {deliveries.map((d) => (
              <button key={d.id} type="button" onClick={() => setDelivery(d.id)}
                className={`p-4 rounded-lg border text-left transition-smooth ${
                  delivery === d.id ? "border-primary bg-primary/10" : "border-border bg-secondary/40 hover:border-primary/40"
                }`}>
                <div className="font-semibold">{d.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button type="submit" variant="discord" size="xl" className="w-full gap-2" disabled={busy || servers.length === 0}>
        <Rocket className="h-5 w-5" /> Iniciar campanha
      </Button>
    </form>
  );
};

export default CreateCampaign;
