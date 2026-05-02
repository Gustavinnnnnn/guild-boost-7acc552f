import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import QRCode from "qrcode";
import {
  Check, Crown, Loader2, Copy, MessageCircle, Sparkles, ShieldCheck, Zap,
  X, QrCode, Clock, CheckCircle2, Target, TrendingUp, Radio,
} from "lucide-react";

type PlanKey = "basico" | "pro" | "elite";
type PixState = { code: string; ref: string; qr?: string; qrDataUrl?: string; coins: number; price: string; planName: string; planKey: PlanKey; expiresAt?: string | null };

const PLANS: { key: PlanKey; name: string; price: string; dms: number; tagline: string; angle: string; badge: string; perks: string[]; highlight?: boolean }[] = [
  {
    key: "basico",
    name: "Básico",
    price: "19",
    dms: 90,
    tagline: "Pra começar",
    angle: "Teste rápido de audiência",
    badge: "Entrada",
    perks: ["Saldo liberado após confirmação", "Campanha com métrica", "Ideal pra validar oferta"],
  },
  {
    key: "pro",
    name: "PRO",
    price: "39",
    dms: 220,
    tagline: "Mais comprado",
    angle: "Volume forte pra conversão",
    badge: "Melhor escala",
    perks: ["Maior volume por recarga", "Custo por DM mais agressivo", "Prioridade na fila", "Suporte rápido"],
    highlight: true,
  },
  {
    key: "elite",
    name: "Elite",
    price: "79",
    dms: 500,
    tagline: "Pra escalar",
    angle: "Disparo pesado de tráfego",
    badge: "Máxima força",
    perks: ["Maior poder de disparo", "Menor custo por DM", "Suporte VIP", "Feito pra escalar servidor"],
  },
];

const callPaymentFunction = async <T,>(functionName: string, payload: Record<string, unknown>): Promise<T> => {
  const { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session;

  if (!session) throw new Error("auth_required");

  const expSec = session.expires_at ?? 0;
  if (expSec * 1000 - Date.now() < 60_000) {
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error || !refreshed.session) throw new Error("auth_required");
    session = refreshed.session;
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const result = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = result?.message || result?.error || `payment_function_${response.status}`;
    throw new Error(message);
  }
  return result as T;
};

const Credits = () => {
  const [busy, setBusy] = useState<PlanKey | null>(null);
  const [open, setOpen] = useState(false);
  const [pix, setPix] = useState<PixState | null>(null);
  const [checking, setChecking] = useState(false);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  const buy = async (planKey: PlanKey) => {
    setBusy(planKey);
    const planMeta = PLANS.find((p) => p.key === planKey)!;
    let lastError: unknown = null;

    // Tenta até 3x antes de desistir — Paradise às vezes responde lento/falha em 1 tentativa
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const data = await callPaymentFunction<{
          success?: boolean;
          message?: string;
          qr_code?: string;
          reference?: string;
          qr_code_base64?: string;
          coins?: number;
          expires_at?: string | null;
        }>("create-pix-deposit", { plan: planKey });

        if (!data?.success || !data.qr_code) {
          lastError = new Error(data?.message || "no_qr");
          if (attempt < 3) { await new Promise(r => setTimeout(r, 800 * attempt)); continue; }
          toast.error("Gateway PIX instável. Tente em 30 segundos ou troque de plano.", { duration: 6000 });
          return;
        }
        setPix({
          code: data.qr_code,
          ref: data.reference || "",
          qr: data.qr_code_base64,
          coins: data.coins || planMeta.dms,
          price: planMeta.price,
          planName: planMeta.name,
          planKey,
          expiresAt: data.expires_at,
        });
        setPaid(false);
        setCopied(false);
        setPaymentNotice(null);
        setOpen(true);
        return;
      } catch (e) {
        lastError = e;
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("auth") || msg.includes("Unauthorized") || msg.includes("401")) {
          toast.error("Sessão expirada. Entre novamente.");
          window.location.href = "/auth";
          return;
        }
        if (attempt < 3) await new Promise(r => setTimeout(r, 800 * attempt));
      } finally {
        if (attempt === 3) setBusy(null);
      }
    }

    console.error("PIX failed after 3 attempts:", lastError);
    toast.error("Não conseguimos gerar o PIX agora. Aguarde 30s e tente de novo.", { duration: 6000 });
    setBusy(null);
  };

  const copy = async () => {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.code);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não consegui copiar. Selecione e copie manualmente.");
    }
  };

  useEffect(() => {
    if (!pix?.code || pix.qrDataUrl || pix.qr) return;
    let cancelled = false;
    QRCode.toDataURL(pix.code, { width: 320, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setPix((current) => current?.ref === pix.ref ? { ...current, qrDataUrl: url } : current);
      })
      .catch(() => {
        if (!cancelled) setPaymentNotice("O QR visual não carregou, mas o código copia e cola abaixo continua válido.");
      });
    return () => { cancelled = true; };
  }, [pix?.code, pix?.qr, pix?.qrDataUrl, pix?.ref]);

  // Polling de pagamento
  useEffect(() => {
    if (!open || !pix || paid) return;
    let cancelled = false;
    const tick = async () => {
      setChecking(true);
      try {
        const data = await callPaymentFunction<{ status?: string; coins?: number; error?: string }>("check-deposit", { reference: pix.ref });
        if (!cancelled && (data?.status === "paid" || data?.status === "approved")) {
          setPaid(true);
          window.dispatchEvent(new Event("profile:refresh"));
          toast.success(`Pagamento confirmado! +${pix.coins} DMs no saldo 🎉`);
        } else if (!cancelled && ["expired", "cancelled", "canceled", "failed"].includes(data?.status || "")) {
          setPaymentNotice("Esse PIX ficou inativo. Gere outro pagamento para receber um QR novo.");
        }
      } catch {
        if (!cancelled) setPaymentNotice("Não consegui verificar agora, mas o QR e o copia e cola continuam na tela para pagamento.");
      }
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
      <div className="grid md:grid-cols-3 gap-4 md:gap-5 items-stretch">
        {PLANS.map((p) => {
          const PlanIcon = p.key === "basico" ? Target : p.key === "pro" ? TrendingUp : Radio;
          return (
            <div
              key={p.key}
              className={`relative overflow-hidden rounded-lg border p-5 md:p-6 transition-all flex flex-col min-h-[430px] ${
                p.highlight
                  ? "border-primary bg-gradient-to-b from-primary/18 via-card to-card md:-translate-y-2"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className={`h-12 w-12 rounded-lg grid place-items-center ${p.highlight ? "bg-primary text-primary-foreground" : "bg-primary/12 text-primary"}`}>
                  <PlanIcon className="h-5 w-5" />
                </div>
                <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${p.highlight ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {p.badge}
                </div>
              </div>

              <div className="mb-5">
                <div className="text-2xl font-black tracking-tight">{p.name}</div>
                <div className="text-sm font-semibold text-muted-foreground mt-1">{p.angle}</div>
              </div>

              <div className="rounded-lg border border-border bg-background/55 p-4 mb-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Investimento</div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className={`text-5xl font-black leading-none ${p.highlight ? "text-primary" : "text-foreground"}`}>{p.price}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Entrega</div>
                    <div className={`text-2xl font-black mt-1 ${p.highlight ? "text-primary" : "text-foreground"}`}>{p.dms.toLocaleString("pt-BR")}</div>
                    <div className="text-[10px] font-bold text-muted-foreground">DMs</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="rounded-lg bg-secondary/70 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">PIX</div>
                  <div className="text-sm font-black mt-1">Na hora</div>
                </div>
                <div className="rounded-lg bg-secondary/70 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Saldo</div>
                  <div className="text-sm font-black mt-1">Não expira</div>
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
                Gerar PIX
              </Button>
            </div>
          );
        })}
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

      {/* DIALOG PIX — REDESIGN MOBILE-FIRST */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md max-h-[92svh] overflow-y-auto p-0 gap-0 border border-primary/40 bg-card rounded-lg">
          {/* Botão fechar */}
          <button
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-20 h-8 w-8 rounded-full bg-background/90 grid place-items-center hover:bg-background transition"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          {!paid && pix && (
            <div className="flex flex-col">
              {/* HEADER */}
              <div className="bg-primary p-5 pb-8 text-primary-foreground">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-foreground/20 text-[10px] uppercase tracking-widest font-black mb-2">
                    <QrCode className="h-3 w-3" /> Pague com PIX
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[11px] opacity-80 font-bold uppercase tracking-wider">{pix.planName}</div>
                      <div className="text-3xl font-black mt-0.5">R$ {pix.price}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] opacity-80 font-bold uppercase tracking-wider">Você recebe</div>
                      <div className="text-2xl font-black mt-0.5">{pix.coins} <span className="text-xs opacity-90">DMs</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR CODE — gerado localmente para não sumir */}
              <div className="px-5 -mt-5 relative z-10">
                <div className="rounded-2xl bg-white p-3 shadow-xl mx-auto w-fit">
                  {pix.qr ? (
                    <img src={`data:image/png;base64,${pix.qr}`} alt="QR Code PIX" className="h-48 w-48 block" />
                  ) : pix.qrDataUrl ? (
                    <img src={pix.qrDataUrl} alt="QR Code PIX" className="h-48 w-48 block" />
                  ) : (
                    <div className="h-48 w-48 grid place-items-center text-background">
                      <Loader2 className="h-7 w-7 animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-3 px-4">
                  Aponte a câmera do app do seu banco para o QR acima
                </p>
              </div>

              {paymentNotice && (
                <div className="px-5 mt-3">
                  <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs font-semibold text-warning">
                    {paymentNotice}
                  </div>
                </div>
              )}

              {/* DIVISOR "OU" */}
              <div className="flex items-center gap-3 px-5 my-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">ou copie o código</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* CÓDIGO COPIA E COLA */}
              <div className="px-5 pb-4">
                <div className="rounded-xl border-2 border-dashed border-primary/40 bg-background/50 p-3">
                  <code className="block text-[11px] font-mono break-all text-foreground/80 max-h-16 overflow-y-auto leading-relaxed">
                    {pix.code}
                  </code>
                </div>
                <Button
                  onClick={copy}
                  variant={copied ? "outline" : "discord"}
                  className="w-full h-12 mt-3 font-black uppercase tracking-wider"
                >
                  {copied ? (
                    <><CheckCircle2 className="h-4 w-4 mr-1" /> Copiado!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-1" /> Copiar código PIX</>
                  )}
                </Button>
                {paymentNotice?.includes("inativo") && (
                  <Button
                    onClick={() => buy(pix.planKey)}
                    disabled={busy !== null}
                    variant="outline"
                    className="w-full h-11 mt-2 font-black uppercase tracking-wider"
                  >
                    {busy === pix.planKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                    Gerar novo PIX
                  </Button>
                )}
              </div>

              {/* STATUS DE PAGAMENTO */}
              <div className="px-5 pb-5">
                <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 flex items-center gap-3">
                  <div className="relative">
                    <Clock className="h-5 w-5 text-primary" />
                    {checking && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-ping" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">Aguardando pagamento...</div>
                    <div className="text-[11px] text-muted-foreground">As DMs caem automaticamente após o pagamento</div>
                  </div>
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
              </div>
            </div>
          )}

          {paid && (
            <div className="p-6 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/20 grid place-items-center mb-4">
                <CheckCircle2 className="h-9 w-9 text-primary" />
              </div>
              <h3 className="text-2xl font-black">Pagamento confirmado!</h3>
              <p className="text-muted-foreground mt-1">
                <span className="text-primary font-black">+{pix?.coins ?? 0} DMs</span> já estão no seu saldo.
              </p>
              <Button onClick={() => setOpen(false)} variant="discord" className="w-full h-12 font-black mt-5">
                Ir para o painel
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Credits;
