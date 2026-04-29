import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import {
  Coins, Plus, ArrowDown, ArrowUp, Sparkles, Zap, Crown, Rocket, Loader2,
  Gift, Flame, Check, TrendingUp, Wallet, History,
} from "lucide-react";
import { toast } from "sonner";
import { formatCoins, coinsToDms } from "@/lib/ads";

type Tx = {
  id: string; amount: number; type: string;
  description: string | null; balance_after: number; created_at: string;
};

// Pacotes em coins. Bônus crescente (estilo Robux / V-Bucks / Riot).
const PACKAGES = [
  {
    coins: 100, bonus: 0, price: "R$ 19,90",
    icon: Zap, label: "Starter", tag: null,
    accent: "from-sky-500 to-cyan-500",
    ring: "ring-sky-500/30",
  },
  {
    coins: 500, bonus: 50, price: "R$ 89,90",
    icon: Rocket, label: "Pro", tag: "Mais popular",
    accent: "from-primary to-primary-glow",
    ring: "ring-primary/40",
  },
  {
    coins: 2000, bonus: 400, price: "R$ 299,90",
    icon: Crown, label: "Business", tag: "Melhor valor",
    accent: "from-amber-400 to-orange-500",
    ring: "ring-amber-500/30",
  },
  {
    coins: 5000, bonus: 1500, price: "R$ 699,90",
    icon: Flame, label: "Whale", tag: "+30% bônus",
    accent: "from-fuchsia-500 to-pink-500",
    ring: "ring-fuchsia-500/30",
  },
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

  const buy = async (coinsAmount: number, bonus: number) => {
    const total = coinsAmount + bonus;
    setBuying(coinsAmount);
    const { error } = await supabase.functions.invoke("add-credits", { body: { amount: total } });
    setBuying(null);
    if (error) return toast.error("Falha ao adicionar coins");
    toast.success(`+${formatCoins(total)} coins adicionados! 🎉`);
    refresh();
    load();
  };

  const coins = profile?.credits ?? 0;
  const reach = coinsToDms(coins);

  // Stats lifetime
  const { totalSpent, totalBought } = useMemo(() => {
    let spent = 0, bought = 0;
    txs.forEach((t) => {
      if (t.amount > 0) bought += t.amount;
      else spent += -t.amount;
    });
    return { totalSpent: spent, totalBought: bought };
  }, [txs]);

  return (
    <div className="max-w-7xl space-y-6">
      {/* TOPO — layout em 2 colunas: hero saldo + stats lifetime */}
      <div className="grid lg:grid-cols-[420px,1fr] gap-4">
        {/* Hero saldo (compacto, sticky-feel) */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-glow p-6 text-white shadow-glow">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-10 -bottom-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-[10px] uppercase tracking-widest font-bold">
              <Wallet className="h-3 w-3" /> Sua carteira
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <Coins className="h-8 w-8 opacity-80" />
              <span className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums">
                {formatCoins(coins)}
              </span>
              <span className="text-xl font-bold opacity-70">coins</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/20 text-[11px] font-bold">
              ≈ {reach.toLocaleString("pt-BR")} pessoas alcançáveis
            </div>
          </div>
        </div>

        {/* Stats lifetime ao lado */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-success/10 to-card p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-success/15 grid place-items-center">
                <ArrowUp className="h-4 w-4 text-success" />
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Total comprado
              </div>
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums">{formatCoins(totalBought)}</div>
              <div className="text-[11px] text-muted-foreground">coins lifetime</div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-gradient-to-br from-destructive/10 to-card p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-destructive/15 grid place-items-center">
                <ArrowDown className="h-4 w-4 text-destructive" />
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Total gasto
              </div>
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums">{formatCoins(totalSpent)}</div>
              <div className="text-[11px] text-muted-foreground">em campanhas</div>
            </div>
          </div>
        </div>
      </div>

      {/* PACOTES — grid 2x2 com cards premium */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/15 grid place-items-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-black tracking-tight">Comprar coins</h3>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full bg-warning/15 text-warning font-bold uppercase tracking-wider">
            🧪 Modo teste · grátis
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PACKAGES.map((p) => {
            const I = p.icon;
            const total = p.coins + p.bonus;
            const isPopular = p.label === "Pro";
            const reachPkg = coinsToDms(total);
            return (
              <div
                key={p.coins}
                className={`group relative rounded-2xl bg-card border border-border overflow-hidden transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow ${
                  isPopular ? `ring-2 ${p.ring} -translate-y-1 shadow-glow` : ""
                }`}
              >
                {/* Tag */}
                {p.tag && (
                  <div className={`absolute top-0 left-0 right-0 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-center text-white bg-gradient-to-r ${p.accent}`}>
                    {p.tag}
                  </div>
                )}

                {/* Glow decorativo */}
                <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${p.accent} opacity-20 blur-2xl group-hover:opacity-40 transition`} />

                <div className={`relative p-5 ${p.tag ? "pt-8" : ""}`}>
                  {/* Ícone */}
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${p.accent} grid place-items-center shadow-lg mb-4`}>
                    <I className="h-6 w-6 text-white" />
                  </div>

                  {/* Label */}
                  <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">
                    {p.label}
                  </div>

                  {/* Valor em coins */}
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <Coins className="h-5 w-5 text-primary" />
                    <span className="text-3xl font-black tracking-tighter tabular-nums">
                      {formatCoins(p.coins)}
                    </span>
                  </div>

                  {/* Bônus pill */}
                  {p.bonus > 0 ? (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/15 text-success text-[11px] font-black">
                      <Gift className="h-3 w-3" /> +{formatCoins(p.bonus)} bônus
                    </div>
                  ) : (
                    <div className="mt-2 h-[22px]" />
                  )}

                  {/* Total */}
                  <div className="mt-3 pt-3 border-t border-border space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Total recebido</span>
                      <b className="text-foreground tabular-nums">{formatCoins(total)} coins</b>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Alcance</span>
                      <b className="text-primary tabular-nums">{reachPkg.toLocaleString("pt-BR")} DMs</b>
                    </div>
                  </div>

                  {/* Preço + CTA */}
                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Por apenas</div>
                      <div className="text-2xl font-black tracking-tight">{p.price}</div>
                    </div>
                  </div>

                  <Button
                    onClick={() => buy(p.coins, p.bonus)}
                    disabled={buying !== null}
                    variant={isPopular ? "discord" : "secondary"}
                    className="w-full mt-3 gap-1.5 font-bold"
                  >
                    {buying === p.coins ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Comprar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HISTÓRICO + INFO lado-a-lado em desktop */}
      <div className="grid lg:grid-cols-[1fr,320px] gap-4">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-secondary grid place-items-center">
              <History className="h-4 w-4" />
            </div>
            <h3 className="text-base font-black tracking-tight">Histórico de transações</h3>
            <div className="flex-1 h-px bg-border" />
          </div>
          {txs.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
              <Coins className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma transação ainda.</p>
              <p className="text-[11px] text-muted-foreground mt-1">Compre seu primeiro pacote acima 👆</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
              {txs.map((t) => {
                const isCredit = t.amount > 0;
                return (
                  <div key={t.id} className="p-4 flex items-center gap-3 hover:bg-secondary/30 transition">
                    <div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${
                      isCredit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                    }`}>
                      {isCredit ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{t.description || t.type}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(t.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-black text-base tabular-nums ${isCredit ? "text-success" : "text-destructive"}`}>
                        {isCredit ? "+" : ""}{formatCoins(t.amount)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        saldo: {formatCoins(t.balance_after)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Sidebar de info */}
        <aside className="space-y-3">
          <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-black">Como funciona</h4>
            </div>
            <ul className="space-y-2 text-[12px] text-muted-foreground">
              <li className="flex gap-2">
                <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                <span><b className="text-foreground">1 coin</b> = 10 DMs entregues</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                <span>Pacotes maiores ganham <b className="text-foreground">bônus</b> automático</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                <span>Coins não expiram</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                <span>Teste de campanha é <b className="text-foreground">sempre grátis</b></span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🧪</span>
              <h4 className="text-xs font-black uppercase tracking-wider text-warning">Modo teste</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Pagamento real (PIX, cartão, Pay) será integrado em breve.
              Por enquanto, todos os pacotes são <b>liberados grátis</b> ao clicar em comprar.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Credits;
