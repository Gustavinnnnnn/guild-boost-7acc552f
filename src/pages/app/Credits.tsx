import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Coins, Plus, ArrowDown, ArrowUp, Sparkles, Zap, Crown, Rocket, Loader2,
  Gift, Activity, Check, ShieldCheck, Bolt, Calculator, Copy, QrCode,
  Wallet, MessageCircle, Send, Target, Clock, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { formatCoins, coinsToDms } from "@/lib/ads";

type Tx = {
  id: string; amount: number; type: string;
  description: string | null; balance_after: number; created_at: string;
};

// 1 coin = 1 DM · 1 coin = R$ 0,05
const PRICE_PER_COIN = 0.05;
const MIN_DEPOSIT_BRL = 20;
const MIN_COINS = Math.round(MIN_DEPOSIT_BRL / PRICE_PER_COIN); // 400
const coinsToBRL = (coins: number) => coins * PRICE_PER_COIN;
const brlToCoins = (brl: number) => Math.floor(brl / PRICE_PER_COIN);

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PACKAGES = [
  {
    coins: 400, bonus: 0, priceBRL: 20, icon: Zap, label: "Starter",
    desc: "Depósito mínimo", popular: false,
    accent: "from-sky-500 to-cyan-400",
  },
  {
    coins: 1000, bonus: 100, priceBRL: 50, icon: Rocket, label: "Pro",
    desc: "O mais escolhido", popular: true,
    accent: "from-primary to-primary-glow",
  },
  {
    coins: 4000, bonus: 600, priceBRL: 200, icon: Crown, label: "Business",
    desc: "Pra campanhas grandes", popular: false,
    accent: "from-amber-400 to-orange-500",
  },
];

const HOW_STEPS = [
  { icon: Wallet, title: "Compre coins", desc: "Pague via PIX e receba os coins na hora após confirmação." },
  { icon: Target, title: "Crie sua campanha", desc: "Escreva sua mensagem, escolha o público e o número de pessoas." },
  { icon: Send, title: "Bot envia DMs", desc: "Distribuímos sua mensagem em ritmo natural pra evitar bloqueio." },
  { icon: Activity, title: "Acompanhe resultados", desc: "Veja entregas, cliques e métricas em tempo real no dashboard." },
];

type DepositInfo = {
  reference: string;
  qr_code: string;
  qr_code_base64: string;
  amount_cents: number;
  coins: number;
  expires_at?: string;
};

const Credits = () => {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [tab, setTab] = useState<"shop" | "history">("shop");
  const [customBRL, setCustomBRL] = useState<string>("20");
  const [deposit, setDeposit] = useState<DepositInfo | null>(null);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<number | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("credit_transactions").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
    setTxs((data ?? []) as Tx[]);
  };

  useEffect(() => { load(); }, [user]);

  // Polling do status do pagamento
  useEffect(() => {
    if (!deposit || paid) {
      if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = window.setInterval(async () => {
      const { data } = await supabase.functions.invoke("check-deposit", {
        body: { reference: deposit.reference },
      });
      if (data?.status === "approved") {
        setPaid(true);
        toast.success(`+${formatCoins(deposit.coins)} coins creditados! 🎉`);
        refresh();
        load();
      } else if (data?.status === "failed" || data?.status === "expired") {
        toast.error("Pagamento expirou ou falhou");
        setDeposit(null);
      }
    }, 3500);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [deposit, paid, refresh]);

  const startDeposit = async (coins: number, bonus: number, key: string) => {
    setBuying(key);
    setPaid(false);
    const { data, error } = await supabase.functions.invoke("create-pix-deposit", {
      body: { coins, bonus },
    });
    setBuying(null);
    if (error || !data?.success) {
      console.error(error, data);
      return toast.error("Falha ao gerar PIX. Tente novamente.");
    }
    setDeposit(data as DepositInfo);
  };

  const buyCustom = async () => {
    const brl = parseFloat(customBRL.replace(",", "."));
    if (!brl || brl < MIN_DEPOSIT_BRL) return toast.error(`Valor mínimo: ${formatBRL(MIN_DEPOSIT_BRL)}`);
    const coins = brlToCoins(brl);
    await startDeposit(coins, 0, "custom");
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

  const copyPix = () => {
    if (!deposit) return;
    navigator.clipboard.writeText(deposit.qr_code);
    toast.success("Código PIX copiado!");
  };

  return (
    <div className="max-w-[1280px] mx-auto pb-12">
      {/* HERO COMPACTO */}
      <div className="relative mb-6 rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-card via-card to-secondary/30">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/60">
          <div className="col-span-2 p-5 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-glow shrink-0">
              <Coins className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Saldo</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter tabular-nums">{formatCoins(coins)}</span>
                <span className="text-xs text-muted-foreground font-bold">coins</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                ≈ <b className="text-foreground">{reach.toLocaleString("pt-BR")}</b> DMs · {formatBRL(coinsToBRL(coins))}
              </div>
            </div>
          </div>
          {[
            { icon: ArrowUp, label: "Comprado", value: totalBought, color: "text-success" },
            { icon: ArrowDown, label: "Gasto", value: totalSpent, color: "text-destructive" },
          ].map((s) => {
            const I = s.icon;
            return (
              <div key={s.label} className="p-5 flex flex-col justify-center">
                <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold ${s.color}`}>
                  <I className="h-3 w-3" /> {s.label}
                </div>
                <div className="text-2xl font-black tabular-nums mt-1">{formatCoins(s.value)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-secondary/50 border border-border w-fit">
        <button
          onClick={() => setTab("shop")}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
            tab === "shop" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" /> Comprar
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
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
          {/* GRID PRINCIPAL: pacotes + custom */}
          <div className="grid lg:grid-cols-[1fr,360px] gap-5">
            {/* Pacotes em grid compacto */}
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black tracking-tight">Pacotes</h2>
                <p className="text-xs text-muted-foreground">Pagamento via PIX · liberação automática</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {PACKAGES.map((p) => {
                  const I = p.icon;
                  const total = p.coins + p.bonus;
                  const key = String(p.coins);
                  return (
                    <button
                      key={key}
                      onClick={() => startDeposit(p.coins, p.bonus, key)}
                      disabled={buying !== null}
                      className={`relative text-left rounded-2xl border-2 p-4 transition-all hover:-translate-y-0.5 ${
                        p.popular
                          ? "border-primary bg-gradient-to-br from-primary/5 to-transparent shadow-[0_0_30px_-12px_hsl(var(--primary)/0.6)]"
                          : "border-border bg-card hover:border-primary/40"
                      } disabled:opacity-50 disabled:cursor-wait`}
                    >
                      {p.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-primary to-primary-glow shadow">
                          Popular
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${p.accent} grid place-items-center shadow`}>
                          <I className="h-4.5 w-4.5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-black">{p.label}</div>
                          <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black tabular-nums">{formatCoins(p.coins)}</span>
                        <span className="text-[11px] text-muted-foreground font-bold">coins</span>
                      </div>
                      {p.bonus > 0 && (
                        <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-success/15 text-success text-[10px] font-black">
                          <Gift className="h-2.5 w-2.5" /> +{formatCoins(p.bonus)} bônus
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                        <div>
                          <div className="text-lg font-black">{formatBRL(p.priceBRL)}</div>
                          <div className="text-[10px] text-muted-foreground">{coinsToDms(total).toLocaleString("pt-BR")} DMs</div>
                        </div>
                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${p.accent} grid place-items-center`}>
                          {buying === key ? (
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* VALOR PERSONALIZADO */}
              <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center shadow">
                    <Calculator className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-black">Valor personalizado</div>
                    <div className="text-[11px] text-muted-foreground">Escolha exatamente quanto quer depositar</div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-[1fr,1fr,auto] gap-3 items-end">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Valor</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">R$</span>
                      <Input
                        type="number" min={MIN_DEPOSIT_BRL} step="1"
                        value={customBRL}
                        onChange={(e) => setCustomBRL(e.target.value)}
                        className="pl-10 h-11 text-lg font-black tabular-nums"
                        placeholder="20"
                      />
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary-glow/10 border border-primary/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Receberá</div>
                    <div className="flex items-baseline gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-primary" />
                      <span className="text-lg font-black tabular-nums">{formatCoins(customCoins)}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">coins</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {coinsToDms(customCoins).toLocaleString("pt-BR")} DMs
                    </div>
                  </div>
                  <Button
                    onClick={buyCustom}
                    disabled={buying !== null || customCoins === 0}
                    variant="discord"
                    className="h-11 font-black"
                  >
                    {buying === "custom" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><QrCode className="h-4 w-4" /> Gerar PIX</>}
                  </Button>
                </div>
                <div className="text-[10px] text-muted-foreground mt-2">Mínimo {formatBRL(MIN_DEPOSIT_BRL)} ({formatCoins(MIN_COINS)} coins)</div>
              </div>
            </div>

            {/* SIDEBAR: COMO FUNCIONA */}
            <aside className="space-y-3">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/20 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Como funciona</h3>
                </div>
                <ol className="space-y-3">
                  {HOW_STEPS.map((step, i) => {
                    const I = step.icon;
                    return (
                      <li key={step.title} className="flex gap-3">
                        <div className="relative shrink-0">
                          <div className="h-8 w-8 rounded-lg bg-card border border-border grid place-items-center">
                            <I className="h-4 w-4 text-primary" />
                          </div>
                          <div className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black grid place-items-center">
                            {i + 1}
                          </div>
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <div className="text-xs font-black">{step.title}</div>
                          <div className="text-[11px] text-muted-foreground leading-snug">{step.desc}</div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span className="text-xs font-bold">Pagamento via PIX</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bolt className="h-4 w-4 text-warning" />
                  <span className="text-xs font-bold">Liberação instantânea</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold">1 coin = 1 DM (R$ 0,05)</span>
                </div>
              </div>

              <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 text-[11px] text-warning-foreground">
                <b>💡 Dica:</b> Pacotes maiores têm mais bônus de coins.
              </div>
            </aside>
          </div>
        </>
      )}

      {/* HISTÓRICO */}
      {tab === "history" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {txs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">Nenhuma transação ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {txs.map((t) => {
                const isCredit = t.amount > 0;
                return (
                  <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-secondary/30 transition">
                    <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${
                      isCredit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                    }`}>
                      {isCredit ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate">{t.description ?? t.type}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(t.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-black tabular-nums ${isCredit ? "text-success" : "text-destructive"}`}>
                        {isCredit ? "+" : ""}{formatCoins(t.amount)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">saldo: {formatCoins(t.balance_after)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL PIX */}
      <Dialog open={!!deposit} onOpenChange={(open) => { if (!open) { setDeposit(null); setPaid(false); } }}>
        <DialogContent className="max-w-md">
          {paid ? (
            <div className="py-6 text-center">
              <div className="h-16 w-16 rounded-full bg-success/15 grid place-items-center mx-auto mb-4">
                <CheckCircle2 className="h-9 w-9 text-success" />
              </div>
              <DialogTitle className="text-xl font-black">Pagamento confirmado! 🎉</DialogTitle>
              <DialogDescription className="mt-2">
                <span className="text-foreground font-bold">+{formatCoins(deposit?.coins ?? 0)} coins</span> creditados na sua conta.
              </DialogDescription>
              <Button
                className="mt-5 w-full font-black"
                variant="discord"
                onClick={() => { setDeposit(null); setPaid(false); }}
              >
                Continuar
              </Button>
            </div>
          ) : deposit && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg font-black">
                  <QrCode className="h-5 w-5" /> Pague com PIX
                </DialogTitle>
                <DialogDescription>
                  Escaneie o QR Code ou copie o código abaixo. Liberação automática.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 my-2">
                <div className="rounded-xl bg-secondary/50 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Valor</div>
                  <div className="text-lg font-black">{formatBRL(deposit.amount_cents / 100)}</div>
                </div>
                <div className="rounded-xl bg-primary/10 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Você recebe</div>
                  <div className="text-lg font-black">{formatCoins(deposit.coins)} <span className="text-xs">coins</span></div>
                </div>
              </div>

              <div className="rounded-xl border-2 border-border bg-white p-4 grid place-items-center">
                {deposit.qr_code_base64 ? (
                  <img src={deposit.qr_code_base64} alt="QR Code PIX" className="h-56 w-56" />
                ) : (
                  <div className="h-56 w-56 grid place-items-center text-muted-foreground text-xs">
                    QR Code indisponível
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Código PIX (copia e cola)</label>
                <div className="flex gap-2 mt-1">
                  <Input value={deposit.qr_code} readOnly className="font-mono text-xs" />
                  <Button onClick={copyPix} variant="outline" size="icon" className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span>Aguardando pagamento... os coins aparecem automaticamente após confirmação.</span>
              </div>

              {deposit.expires_at && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Expira em {new Date(deposit.expires_at).toLocaleString("pt-BR")}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Credits;
