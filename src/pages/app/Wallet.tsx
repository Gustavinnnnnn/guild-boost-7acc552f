import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

type Tx = { id: string; description: string; amount: number; type: string; created_at: string };

const Wallet = () => {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [history, setHistory] = useState<Tx[]>([]);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(50);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setHistory((data ?? []).map((t: any) => ({ ...t, amount: Number(t.amount) })));
  };

  useEffect(() => { load(); }, [user]);

  const recharge = async () => {
    if (!user || !profile) return;
    if (amount <= 0) return toast.error("Valor inválido");
    await supabase.from("profiles").update({ balance: profile.balance + amount }).eq("id", user.id);
    await supabase.from("wallet_transactions").insert({
      user_id: user.id, description: "Recarga manual", amount, type: "in",
    });
    toast.success(`R$ ${amount.toFixed(2)} adicionado!`);
    setOpen(false);
    refresh(); load();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-2xl bg-gradient-primary p-8 text-primary-foreground shadow-glow relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative">
          <p className="text-sm opacity-90">Saldo disponível</p>
          <div className="text-5xl font-extrabold mt-2">R$ {(profile?.balance ?? 0).toFixed(2)}</div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="mt-6 gap-2 bg-white text-primary hover:bg-white/90">
                <Plus className="h-4 w-4" /> Adicionar saldo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar saldo</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-2" min={10} />
                </div>
                <div className="flex gap-2">
                  {[20, 50, 100, 200].map((v) => (
                    <button key={v} type="button" onClick={() => setAmount(v)} className="flex-1 py-2 rounded-lg bg-secondary border border-border hover:border-primary text-sm font-semibold">R$ {v}</button>
                  ))}
                </div>
                <Button variant="discord" className="w-full" onClick={recharge}>Confirmar recarga</Button>
                <p className="text-xs text-muted-foreground text-center">Em produção, integraria Stripe/Pix. Este é o MVP.</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-bold">Histórico de pagamentos</h2>
        </div>
        {history.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">Nenhuma transação ainda.</div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((t) => (
              <div key={t.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full grid place-items-center ${
                    t.type === "in" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  }`}>
                    {t.type === "in" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.description}</div>
                    <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</div>
                  </div>
                </div>
                <div className={`font-bold ${t.type === "in" ? "text-success" : "text-destructive"}`}>
                  {t.type === "in" ? "+" : ""}R$ {Math.abs(t.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
