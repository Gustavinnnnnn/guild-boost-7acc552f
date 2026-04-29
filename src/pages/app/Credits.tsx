import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, ArrowDown, ArrowUp, Sparkles, Zap, Crown, Rocket, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { formatBRL, centsToDms } from "@/lib/ads";

type Tx = { id: string; amount: number; type: string; description: string | null; balance_after: number; created_at: string };

// Pacotes em CENTAVOS de R$ — bônus crescente
const PACKAGES = [
  { cents: 2000,  price_label: "R$ 20",  bonus: 0,    icon: Zap,    label: "Starter",  color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30" },
  { cents: 10000, price_label: "R$ 100", bonus: 1000, icon: Rocket, label: "Pro",      color: "from-primary/30 to-primary-glow/30 border-primary", popular: true },
  { cents: 50000, price_label: "R$ 500", bonus: 7500, icon: Crown,  label: "Business", color: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30" },
];

const Credits = () => {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [buying, setBuying] = useState<number | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setTxs((data ?? []) as Tx[]);
  };

  useEffect(() => { load(); }, [user]);

  const buy = async (cents: number) => {
    setBuying(cents);
    const { error } = await supabase.functions.invoke("add-credits", { body: { amount: cents } });
    setBuying(null);
    if (error) return toast.error("Falha ao adicionar saldo");
    toast.success(`+${formatBRL(cents)} adicionados!`);
    refresh();
    load();
  };

  const balanceCents = profile?.credits ?? 0;
  const reachableDms = centsToDms(balanceCents);

  return (
    <div className="max-w-5xl space-y-7">
      {/* HERO Saldo em R$ */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-glow p-7 md:p-10 text-white shadow-glow">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-[10px] uppercase tracking-widest font-bold mb-3">
            <Sparkles className="h-3 w-3" /> Sua carteira
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <Wallet className="h-7 w-7 opacity-80" />
            <span className="text-5xl md:text-7xl font-black tracking-tighter">{formatBRL(balanceCents)}</span>
          </div>
          <p className="text-sm opacity-90 mt-1">
            ≈ <strong>{reachableDms.toLocaleString("pt-BR")}</strong> pessoas alcançáveis · custo R$ 0,02 por DM
          </p>
        </div>
      </div>

      {/* Pacotes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-primary/15 grid place-items-center"><Plus className="h-4 w-4 text-primary" /></div>
          <h3 className="text-base font-black tracking-tight">Adicionar saldo</h3>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {PACKAGES.map((p) => {
            const I = p.icon;
            const totalCents = p.cents + p.bonus;
            const totalDms = centsToDms(totalCents);
            return (
              <div key={p.cents} className={`relative rounded-2xl border-2 p-5 bg-gradient-to-br ${p.color} ${p.popular ? "shadow-glow" : ""} transition hover:-translate-y-1`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider shadow-lg">
                    ⭐ Mais popular
                  </span>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur grid place-items-center"><I className="h-4 w-4" /></div>
                  <span className="font-black uppercase text-xs tracking-wider">{p.label}</span>
                </div>
                <div className="text-3xl font-black tracking-tight">{p.price_label}</div>
                {p.bonus > 0 && (
                  <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-success/20 text-success text-[10px] font-black uppercase">
                    <TrendingUp className="h-2.5 w-2.5" /> +{formatBRL(p.bonus)} bônus
                  </div>
                )}
                <div className="mt-3 text-xs text-muted-foreground">
                  Saldo total: <b className="text-foreground">{formatBRL(totalCents)}</b>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  ≈ {totalDms.toLocaleString("pt-BR")} pessoas
                </div>
                <Button onClick={() => buy(p.cents)} disabled={buying !== null}
                  variant={p.popular ? "discord" : "secondary"} className="w-full mt-4 gap-1.5 font-bold">
                  {buying === p.cents ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Depositar
                </Button>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-center text-[11px] text-muted-foreground bg-warning/10 border border-warning/20 rounded-lg p-2.5">
          ⚠️ Modo de teste — depósitos gratuitos. Pagamento real (PIX, cartão) será integrado em breve.
        </div>
      </section>

      {/* Histórico */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-secondary grid place-items-center"><ArrowDown className="h-4 w-4" /></div>
          <h3 className="text-base font-black tracking-tight">Histórico</h3>
          <div className="flex-1 h-px bg-border" />
        </div>
        {txs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhuma transação ainda.
          </div>
        ) : (
          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            {txs.map((t) => (
              <div key={t.id} className="p-4 flex items-center gap-3 hover:bg-secondary/30 transition">
                <div className={`h-10 w-10 rounded-xl grid place-items-center ${t.amount > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {t.amount > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{t.description || t.type}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-base ${t.amount > 0 ? "text-success" : "text-destructive"}`}>
                    {t.amount > 0 ? "+" : "-"}{formatBRL(Math.abs(t.amount))}
                  </div>
                  <div className="text-[10px] text-muted-foreground">saldo: {formatBRL(t.balance_after)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Credits;
