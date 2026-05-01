import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Check, Crown, Loader2, Copy, MessageCircle, Sparkles, ShieldCheck, Zap,
} from "lucide-react";

type PlanKey = "basico" | "pro" | "elite";

const PLANS: { key: PlanKey; name: string; price: string; dms: number; tagline: string; perks: string[]; highlight?: boolean }[] = [
  {
    key: "basico",
    name: "Básico",
    price: "19",
    dms: 90,
    tagline: "Pra começar",
    perks: ["90 DMs no saldo", "Disparo segmentado", "Métricas no painel"],
  },
  {
    key: "pro",
    name: "PRO",
    price: "39",
    dms: 220,
    tagline: "Mais comprado",
    perks: ["220 DMs no saldo", "Melhor custo por DM", "Prioridade na fila", "Suporte rápido"],
    highlight: true,
  },
  {
    key: "elite",
    name: "Elite",
    price: "79",
    dms: 500,
    tagline: "Pra escalar",
    perks: ["500 DMs no saldo", "Custo por DM mais baixo", "Suporte VIP"],
  },
];

const Credits = () => {
  const [busy, setBusy] = useState<PlanKey | null>(null);
  const [open, setOpen] = useState(false);
  const [pix, setPix] = useState<{ code: string; ref: string; qr?: string; coins: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const [paid, setPaid] = useState(false);

  const buy = async (plan: PlanKey) => {
    setBusy(plan);
    try {
      const { data, error } = await supabase.functions.invoke("create-pix-deposit", { body: { plan } });
      if (error || !data?.success) {
        toast.error("Erro ao gerar PIX. Tenta de novo.");
        return;
      }
      setPix({ code: data.qr_code, ref: data.reference, qr: data.qr_code_base64, coins: data.coins });
      setPaid(false);
      setOpen(true);
    } finally {
      setBusy(null);
    }
  };

  const copy = () => {
    if (!pix) return;
    navigator.clipboard.writeText(pix.code);
    toast.success("PIX copiado!");
  };

  // Polling de pagamento
  useEffect(() => {
    if (!open || !pix || paid) return;
    let cancelled = false;
    const tick = async () => {
      setChecking(true);
      try {
        const { data } = await supabase.functions.invoke("check-deposit", { body: { reference: pix.ref } });
        if (!cancelled && data?.status === "paid") {
          setPaid(true);
          toast.success(`Pagamento confirmado! +${pix.coins} DMs no saldo 🎉`);
        }
      } catch {/* ignore */}
      finally { setChecking(false); }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [open, pix, paid]);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card p-6 md:p-10">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] uppercase tracking-widest font-black mb-3">
            <Sparkles className="h-3 w-3" /> Comprar DMs
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">Escolha seu plano e comece a divulgar</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-2xl">
            Pagou via PIX, as DMs caem no saldo na hora. Use quando quiser pra divulgar seu servidor.
          </p>
        </div>
      </div>

      {/* PLANOS */}
      <div className="grid md:grid-cols-3 gap-5">
        {PLANS.map((p) => (
          <div
            key={p.key}
            className={`relative rounded-3xl p-6 md:p-7 transition-all flex flex-col ${
              p.highlight
                ? "border-2 border-primary bg-gradient-to-br from-primary/10 via-card to-card shadow-[0_0_50px_-10px_hsl(var(--primary)/0.6)] md:scale-[1.04]"
                : "border border-border bg-card hover:border-primary/40"
            }`}
          >
            {p.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider shadow-glow flex items-center gap-1">
                <Crown className="h-3 w-3" /> {p.tagline}
              </div>
            )}

            <div className="text-center mb-5 mt-1">
              <div className="text-xl font-black tracking-tight">{p.name}</div>
              {!p.highlight && (
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
                  {p.tagline}
                </div>
              )}
            </div>

            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-sm text-muted-foreground">R$</span>
                <span className={`text-5xl font-black ${p.highlight ? "text-primary" : ""}`}>{p.price}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">pagamento único · PIX</div>
            </div>

            <div className="rounded-xl bg-background/40 border border-border p-3 mb-5 text-center">
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Você recebe</div>
              <div className={`text-2xl font-black mt-0.5 ${p.highlight ? "text-primary" : ""}`}>
                {p.dms.toLocaleString("pt-BR")} <span className="text-sm font-bold text-muted-foreground">DMs</span>
              </div>
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm">
                  <Check className={`h-4 w-4 mt-0.5 shrink-0 ${p.highlight ? "text-primary" : "text-muted-foreground"}`} />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => buy(p.key)}
              disabled={busy !== null}
              variant={p.highlight ? "discord" : "outline"}
              className="w-full h-12 font-black uppercase tracking-wider"
            >
              {busy === p.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Comprar agora
            </Button>
          </div>
        ))}
      </div>

      {/* GARANTIA */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { i: ShieldCheck, t: "Pagamento seguro", d: "PIX direto, sem cartão" },
          { i: Zap, t: "Liberação na hora", d: "DMs caem em segundos" },
          { i: MessageCircle, t: "Use quando quiser", d: "Saldo nunca expira" },
        ].map((c) => (
          <div key={c.t} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="h-9 w-9 rounded-lg bg-primary/15 grid place-items-center"><c.i className="h-4 w-4 text-primary" /></div>
            <div>
              <div className="font-bold text-sm">{c.t}</div>
              <div className="text-[11px] text-muted-foreground">{c.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* DIALOG PIX */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{paid ? "Pagamento confirmado! 🎉" : "Pague com PIX"}</DialogTitle>
            <DialogDescription>
              {paid
                ? `+${pix?.coins ?? 0} DMs já estão no seu saldo.`
                : "Escaneie o QR Code ou copie o código abaixo. As DMs caem automaticamente após o pagamento."}
            </DialogDescription>
          </DialogHeader>

          {!paid && pix && (
            <div className="space-y-4">
              {pix.qr ? (
                <img src={`data:image/png;base64,${pix.qr}`} alt="QR PIX" className="mx-auto h-56 w-56 rounded-xl border border-border bg-white p-2" />
              ) : (
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pix.code)}`} alt="QR PIX" className="mx-auto h-56 w-56 rounded-xl border border-border bg-white p-2" />
              )}

              <div className="rounded-xl border border-dashed border-primary/40 bg-background/40 p-3">
                <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1">Código copia e cola</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono break-all line-clamp-3">{pix.code}</code>
                  <Button size="icon" variant="outline" onClick={copy}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                Aguardando pagamento...
              </div>
            </div>
          )}

          {paid && (
            <Button onClick={() => setOpen(false)} variant="discord" className="w-full h-12 font-black">
              Fechar
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Credits;
