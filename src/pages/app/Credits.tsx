import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Coins, Plus, ArrowDown, ArrowUp, Sparkles, Zap, Crown, Rocket, Loader2,
  Gift, Flame, TrendingUp, Activity, Check, ShieldCheck, Bolt, Lock,
  CreditCard, Star, Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { formatCoins, coinsToDms } from "@/lib/ads";

type Tx = {
  id: string; amount: number; type: string;
  description: string | null; balance_after: number; created_at: string;
};

// 1 coin = R$ 0,10  →  R$ 10 = 100 coins
const PRICE_PER_COIN = 0.10;
const coinsToBRL = (coins: number) => coins * PRICE_PER_COIN;
const brlToCoins = (brl: number) => Math.floor(brl / PRICE_PER_COIN);

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PACKAGES = [
  {
    coins: 100, bonus: 10, priceBRL: 10, icon: Zap, label: "Starter",
    desc: "Ideal para testar a plataforma", tag: null, popular: false,
    accent: "from-sky-500 to-cyan-400", glow: "shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)]",
    perks: ["Entrega instantânea", "Bônus de 10%", "Sem expiração"],
  },
  {
    coins: 500, bonus: 100, priceBRL: 50, icon: Rocket, label: "Pro",
    desc: "O mais escolhido pelos criadores", tag: "MAIS POPULAR", popular: true,
    accent: "from-primary to-primary-glow", glow: "shadow-[0_0_60px_-10px_hsl(var(--primary)/0.7)]",
    perks: ["Bônus de 20%", "Suporte prioritário", "Melhor custo-benefício"],
  },
  {
    coins: 2000, bonus: 600, priceBRL: 200, icon: Crown, label: "Business",
    desc: "Para campanhas grandes e recorrentes", tag: "+30% BÔNUS", popular: false,
    accent: "from-amber-400 to-orange-500", glow: "shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]",
    perks: ["Bônus de 30%", "Alcance massivo", "ROI máximo"],
  },
];

const Credits = () => {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [buying, setBuying] = useState<number | null>(null);
  const [tab, setTab] = useState<"shop" | "history">("shop");
  const [customBRL, setCustomBRL] = useState<string>("25");
  const [customLoading, setCustomLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
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

  const buyCustom = async () => {
    const brl = parseFloat(customBRL.replace(",", "."));
    if (!brl || brl < 5) return toast.error("Valor mínimo: R$ 5,00");
    const coinsAmount = brlToCoins(brl);
    setCustomLoading(true);
    const { error } = await supabase.functions.invoke("add-credits", { body: { amount: coinsAmount } });
    setCustomLoading(false);
    if (error) return toast.error("Falha ao processar");
    toast.success(`+${formatCoins(coinsAmount)} coins adicionados! 🎉`);
    refresh();
    load();
  };

  const customCoins = useMemo(() => {
    const brl = parseFloat((customBRL || "0").replace(",", "."));
    return isNaN(brl) ? 0 : brlToCoins(brl);
  }, [customBRL]);

  const coins = profile?.credits ?? 0;
  const reach = coinsToDms(coins);

  const { totalSpent, totalBought, last7d } = useMemo(() => {
    let spent = 0, bought = 0, recent = 0;
    const now = Date.now();
    txs.forEach((t) => {
      if (t.amount > 0) bought += t.amount;
      else spent += -t.amount;
      if (now - new Date(t.created_at).getTime() < 7 * 86400000) recent += Math.abs(t.amount);
    });
    return { totalSpent: spent, totalBought: bought, last7d: recent };
  }, [txs]);

  return (
    <div className="max-w-[1280px] mx-auto pb-12">
      {/* ================= HERO BALANCE ================= */}
      <div className="relative mb-8 rounded-3xl overflow-hidden border border-border bg-gradient-to-br from-card via-card to-secondary/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative grid md:grid-cols-[1.2fr,1fr,1fr,1fr] gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
          <div className="p-6 md:p-7 flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-glow shrink-0">
              <Coins className="h-8 w-8 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Saldo disponível</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-5xl font-black tracking-tighter tabular-nums">{formatCoins(coins)}</span>
                <span className="text-sm text-muted-foreground font-bold">coins</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ≈ <b className="text-foreground">{reach.toLocaleString("pt-BR")}</b> DMs · vale <b className="text-foreground">{formatBRL(coinsToBRL(coins))}</b>
              </div>
            </div>
          </div>

          {[
            { icon: ArrowUp, label: "Comprado", value: totalBought, color: "text-success" },
            { icon: ArrowDown, label: "Gasto", value: totalSpent, color: "text-destructive" },
            { icon: Activity, label: "7 dias", value: last7d, color: "text-primary" },
          ].map((s) => {
            const I = s.icon;
            return (
              <div key={s.label} className="p-6 md:p-7 flex flex-col justify-center">
                <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold ${s.color}`}>
                  <I className="h-3 w-3" /> {s.label}
                </div>
                <div className="text-3xl font-black tabular-nums mt-1.5">{formatCoins(s.value)}</div>
                <div className="text-[10px] text-muted-foreground">coins</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex items-center gap-1 mb-8 p-1 rounded-xl bg-secondary/50 border border-border w-fit mx-auto md:mx-0">
        <button
          onClick={() => setTab("shop")}
          className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
            tab === "shop" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" /> Comprar coins
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
            tab === "history" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="h-3.5 w-3.5" /> Histórico
          {txs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-primary/20 text-primary text-[10px]">{txs.length}</span>
          )}
        </button>
      </div>

      {tab === "shop" && (
        <>
          {/* ================= TÍTULO SEÇÃO ================= */}
          <div className="text-center mb-10 px-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/15 text-warning text-[10px] font-black uppercase tracking-widest mb-4">
              🧪 Modo teste · adição grátis
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Escolha seu pacote</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Pague uma vez, use quando quiser. Coins não expiram e podem ser usadas em qualquer campanha.
            </p>
          </div>

          {/* ================= CARDS PREMIUM ================= */}
          <div className="grid md:grid-cols-3 gap-5 md:gap-6 px-2 md:px-0">
            {PACKAGES.map((p) => {
              const I = p.icon;
              const total = p.coins + p.bonus;
              const reachPkg = coinsToDms(total);
              return (
                <div
                  key={p.coins}
                  className={`group relative rounded-3xl bg-card border-2 p-6 md:p-7 transition-all duration-300 hover:-translate-y-2 ${
                    p.popular
                      ? `border-primary ${p.glow} md:scale-105`
                      : "border-border hover:border-primary/40 hover:shadow-xl"
                  }`}
                >
                  {/* Badge popular */}
                  {p.tag && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r ${p.accent} shadow-lg flex items-center gap-1`}>
                        {p.popular && <Star className="h-3 w-3 fill-white" />}
                        {p.tag}
                      </div>
                    </div>
                  )}

                  {/* Decoração */}
                  <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${p.accent} opacity-10 blur-2xl group-hover:opacity-20 transition`} />

                  {/* Ícone + Label */}
                  <div className="relative flex items-center gap-3 mb-5">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${p.accent} grid place-items-center shadow-lg`}>
                      <I className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Plano</div>
                      <div className="text-xl font-black">{p.label}</div>
                    </div>
                  </div>

                  {/* Quantidade + preço */}
                  <div className="relative mb-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl md:text-5xl font-black tracking-tighter tabular-nums">{formatCoins(p.coins)}</span>
                      <span className="text-base font-bold text-muted-foreground">coins</span>
                    </div>
                    {p.bonus > 0 && (
                      <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-success/15 text-success text-[11px] font-black">
                        <Gift className="h-3 w-3" /> +{formatCoins(p.bonus)} de bônus
                      </div>
                    )}
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl font-black tracking-tight">{formatBRL(p.priceBRL)}</span>
                      <span className="text-xs text-muted-foreground">único</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                  </div>

                  {/* Benefícios */}
                  <ul className="space-y-2 mb-6">
                    {p.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-xs">
                        <div className={`h-4 w-4 rounded-full bg-gradient-to-br ${p.accent} grid place-items-center shrink-0`}>
                          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                        </div>
                        <span className="font-medium">{perk}</span>
                      </li>
                    ))}
                    <li className="flex items-center gap-2 text-xs pt-1 border-t border-border/50 mt-3">
                      <Bolt className="h-3.5 w-3.5 text-primary" />
                      <span className="font-bold text-foreground">{reachPkg.toLocaleString("pt-BR")} DMs</span>
                      <span className="text-muted-foreground">de alcance total</span>
                    </li>
                  </ul>

                  {/* CTA */}
                  <Button
                    onClick={() => buy(p.coins, p.bonus)}
                    disabled={buying !== null}
                    variant={p.popular ? "discord" : "outline"}
                    size="lg"
                    className={`w-full font-black text-sm transition-all ${
                      !p.popular && "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    }`}
                  >
                    {buying === p.coins ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Comprar agora
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* ================= VALOR PERSONALIZADO ================= */}
          <div className="mt-8 rounded-3xl border-2 border-dashed border-border bg-card/50 p-6 md:p-8">
            <div className="grid md:grid-cols-[auto,1fr,auto] gap-6 items-center">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center shadow-lg">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Personalizado</div>
                  <div className="text-lg font-black">Escolha seu valor</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Valor em R$</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      min="5"
                      step="1"
                      value={customBRL}
                      onChange={(e) => setCustomBRL(e.target.value)}
                      className="pl-10 h-12 text-xl font-black tabular-nums"
                      placeholder="25"
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">Mínimo R$ 5,00</div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary-glow/10 border border-primary/20 p-4">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Você receberá</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-black tabular-nums">{formatCoins(customCoins)}</span>
                    <span className="text-xs font-bold text-muted-foreground">coins</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    ≈ {coinsToDms(customCoins).toLocaleString("pt-BR")} DMs entregues
                  </div>
                </div>
              </div>

              <Button
                onClick={buyCustom}
                disabled={customLoading || customCoins === 0}
                variant="discord"
                size="lg"
                className="font-black w-full md:w-auto md:min-w-[160px]"
              >
                {customLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Adicionar</>}
              </Button>
            </div>
          </div>

          {/* ================= SEÇÃO DE CONFIANÇA ================= */}
          <div className="mt-10">
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: ShieldCheck, title: "Pagamento seguro", desc: "Criptografia de ponta a ponta", color: "from-emerald-500 to-green-600" },
                { icon: Bolt, title: "Entrega instantânea", desc: "Coins em segundos na conta", color: "from-amber-500 to-orange-500" },
                { icon: Lock, title: "100% protegido", desc: "Dados nunca compartilhados", color: "from-sky-500 to-blue-600" },
                { icon: TrendingUp, title: "Sem expiração", desc: "Use quando quiser, sem prazo", color: "from-fuchsia-500 to-pink-500" },
              ].map((it) => {
                const I = it.icon;
                return (
                  <div key={it.title} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3 hover:border-primary/30 transition">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${it.color} grid place-items-center shrink-0 shadow-md`}>
                      <I className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black">{it.title}</div>
                      <div className="text-[11px] text-muted-foreground leading-snug">{it.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Métodos de pagamento */}
            <div className="mt-5 flex items-center justify-center gap-3 flex-wrap text-xs text-muted-foreground">
              <span className="font-bold">Aceitamos:</span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-card border border-border font-black text-[11px] flex items-center gap-1">
                  <span className="text-success">●</span> PIX
                </span>
                <span className="px-2.5 py-1 rounded-md bg-card border border-border font-black text-[11px] flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Crédito
                </span>
                <span className="px-2.5 py-1 rounded-md bg-card border border-border font-black text-[11px] flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Débito
                </span>
                <span className="px-2.5 py-1 rounded-md bg-card border border-border font-black text-[11px]">
                  Boleto
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "history" && (
        <div>
          {txs.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
              <Coins className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-base font-bold">Nenhuma transação ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Vá para a Loja e compre seu primeiro pacote</p>
              <Button onClick={() => setTab("shop")} variant="discord" size="sm" className="mt-4 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Ir para a Loja
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="hidden md:grid grid-cols-[auto,1fr,140px,140px,160px] gap-4 px-5 py-3 bg-secondary/30 border-b border-border text-[10px] uppercase tracking-widest font-black text-muted-foreground">
                <div className="w-10">Tipo</div>
                <div>Descrição</div>
                <div className="text-right">Valor</div>
                <div className="text-right">Saldo após</div>
                <div className="text-right">Data</div>
              </div>
              <div className="divide-y divide-border">
                {txs.map((t) => {
                  const isCredit = t.amount > 0;
                  return (
                    <div key={t.id} className="grid md:grid-cols-[auto,1fr,140px,140px,160px] gap-3 md:gap-4 px-4 md:px-5 py-3 items-center hover:bg-secondary/30 transition">
                      <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${
                        isCredit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                      }`}>
                        {isCredit ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{t.description || t.type}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.type}</div>
                      </div>
                      <div className={`text-right font-black tabular-nums text-base ${isCredit ? "text-success" : "text-destructive"}`}>
                        {isCredit ? "+" : ""}{formatCoins(t.amount)}
                      </div>
                      <div className="text-right tabular-nums text-sm font-bold text-muted-foreground">
                        {formatCoins(t.balance_after)}
                      </div>
                      <div className="text-right text-[11px] text-muted-foreground">
                        {new Date(t.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Credits;
