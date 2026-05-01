import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DiscordIcon } from "@/components/DiscordIcon";
import { SupportFab } from "@/components/SupportFab";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  Rocket,
  Settings2,
  Zap,
  TrendingUp,
  BarChart3,
  Users,
  MousePointerClick,
  ShieldCheck,
  Target,
  Sparkles,
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Landing = () => {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.functions
      .invoke("discord-config")
      .then(({ data }) => {
        if (data?.client_id) setClientId(data.client_id);
      })
      .catch(() => {});
  }, []);

  const connectDiscord = () => {
    if (!clientId) {
      toast.error("Carregando configuração... tenta de novo em 2s");
      return;
    }
    setBusy(true);
    const state = btoa(
      JSON.stringify({ origin: window.location.origin, redirect: "/app", nonce: crypto.randomUUID() }),
    );
    const redirectUri = encodeURIComponent(`${SUPABASE_URL}/functions/v1/discord-oauth-callback`);
    const scope = encodeURIComponent("identify email guilds");
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&prompt=consent`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
              <Rocket className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display font-black text-lg tracking-tight">
              SERVER<span className="text-primary">BOOST</span>
            </span>
          </div>
          <button
            onClick={connectDiscord}
            disabled={busy}
            className="group inline-flex items-center gap-2 px-4 md:px-5 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-xs md:text-sm uppercase tracking-wider shadow-glow hover:bg-primary/90 hover:shadow-[0_0_28px_hsl(var(--primary)/0.55)] transition-all disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <DiscordIcon className="h-4 w-4" />}
            <span>Entrar com Discord</span>
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-12 md:pt-20 pb-20 md:pb-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full bg-primary/[0.08] blur-[140px]" />
          <div className="absolute bottom-0 right-[-100px] w-[500px] h-[500px] rounded-full bg-primary-glow/[0.07] blur-[140px]" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* LEFT — TEXT */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Crescimento automatizado para Discord
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black leading-[0.95] tracking-tight mb-6">
                LEVE SEU SERVIDOR PARA{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  MILHARES
                </span>{" "}
                DE PESSOAS NOVAS
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                Divulgação automatizada por DM no Discord — direto pra usuários reais, sem esforço manual e com métricas em tempo real.
              </p>

              <div className="flex flex-col items-center lg:items-start gap-2">
                <button
                  onClick={connectDiscord}
                  disabled={busy}
                  className="group inline-flex items-center gap-3 px-8 md:px-10 h-14 md:h-16 rounded-xl bg-gradient-primary text-primary-foreground font-black text-base md:text-lg uppercase tracking-wider shadow-glow hover:shadow-[0_0_70px_hsl(var(--primary)/0.6)] transition-all hover:scale-[1.03] disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <DiscordIcon className="h-5 w-5 md:h-6 md:w-6" />}
                  Entrar com Discord
                  <ArrowRight className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-xs text-muted-foreground mt-1">Acesse o painel e comece em segundos</p>
              </div>
            </div>

            {/* RIGHT — DASHBOARD MOCK */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/30 via-transparent to-primary-glow/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-background p-5 md:p-6 shadow-card">
                {/* Window bar */}
                <div className="flex items-center gap-1.5 mb-5">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                  <div className="ml-3 text-[10px] text-muted-foreground font-mono">painel.serverboost.gg</div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl border border-primary/15 bg-background/40 p-4">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-2">
                      <Users className="h-3 w-3 text-primary" /> Entradas hoje
                    </div>
                    <div className="font-display text-3xl font-black text-primary">+34</div>
                    <div className="text-[10px] text-success mt-1 font-semibold">▲ 22% vs ontem</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/40 p-4">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-2">
                      <MousePointerClick className="h-3 w-3 text-foreground/60" /> Cliques
                    </div>
                    <div className="font-display text-3xl font-black">218</div>
                    <div className="text-[10px] text-muted-foreground mt-1">últimas 24h</div>
                  </div>
                </div>

                {/* Chart */}
                <div className="rounded-xl border border-border bg-background/40 p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Crescimento 7d</span>
                    <span className="text-[10px] text-primary font-bold">+ 247 membros</span>
                  </div>
                  <svg viewBox="0 0 200 60" className="w-full h-14">
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(235 86% 67%)" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="hsl(235 86% 67%)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,50 L25,42 L50,38 L75,30 L100,28 L125,18 L150,14 L175,8 L200,4 L200,60 L0,60 Z" fill="url(#g)" />
                    <path d="M0,50 L25,42 L50,38 L75,30 L100,28 L125,18 L150,14 L175,8 L200,4" fill="none" stroke="hsl(235 86% 67%)" strokeWidth="1.8" />
                  </svg>
                </div>

                {/* Active campaign */}
                <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                    </span>
                    <span className="text-sm font-semibold">Campanha ativa</span>
                  </div>
                  <span className="text-[10px] uppercase text-primary font-bold tracking-wider">enviando</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — DIFERENÇA */}
      <section className="relative py-20 md:py-28 border-y border-border bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)]">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <p className="text-2xl md:text-4xl font-display font-bold leading-tight text-foreground/80">
            Enquanto alguns servidores ficam parados…
            <br />
            outros estão sempre com gente entrando.
          </p>
          <p className="mt-8 text-2xl md:text-4xl font-display font-black text-primary drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
            A diferença está no sistema que usam.
          </p>
        </div>
      </section>

      {/* SECTION 3 — COMO FUNCIONA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-3">Como funciona</div>
            <h2 className="font-display text-3xl md:text-5xl font-black">3 passos. Zero esforço.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { icon: Settings2, title: "Configure", desc: "Escolha o alcance e o público da campanha" },
              { icon: Zap, title: "Ative", desc: "Seu servidor começa a ser distribuído automaticamente" },
              { icon: TrendingUp, title: "Cresça", desc: "Novos membros chegam todos os dias" },
            ].map((s, i) => (
              <div
                key={s.title}
                className="group relative rounded-2xl border border-border bg-gradient-to-br from-card to-background p-6 md:p-8 hover:border-primary/40 transition-all"
              >
                <div className="absolute top-5 right-5 font-display text-5xl font-black text-foreground/[0.04] group-hover:text-primary/10 transition-colors">
                  0{i + 1}
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 grid place-items-center mb-5 group-hover:shadow-glow transition-all">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-black mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — PAINEL */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-3">Painel</div>
            <h2 className="font-display text-3xl md:text-5xl font-black">
              Controle total em <span className="text-primary">um único painel</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {[
              { icon: BarChart3, title: "Dashboard", desc: "Métricas em tempo real do seu crescimento" },
              { icon: Target, title: "Criar campanha", desc: "Defina o alcance e o público em segundos" },
              { icon: Sparkles, title: "Comprar alcance", desc: "PIX rápido. Créditos liberados na hora." },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-primary/15 bg-gradient-to-br from-card to-background p-6 hover:border-primary/35 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center">
                    <p.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-black">{p.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — CONFIANÇA */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            {[
              { icon: Zap, label: "Sistema automatizado" },
              { icon: Target, label: "Segmentação inteligente" },
              { icon: ShieldCheck, label: "Sem divulgação manual" },
            ].map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/40 px-4 py-4"
              >
                <c.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground/80">{c.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Resultados podem variar conforme servidor e oferta.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/[0.1] blur-[150px]" />
        </div>
        <div className="container mx-auto px-4 relative text-center">
          <h2 className="font-display text-4xl md:text-6xl font-black leading-tight mb-10 max-w-3xl mx-auto">
            Quem cresce primeiro,
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              domina o jogo.
            </span>
          </h2>
          <button
            onClick={connectDiscord}
            disabled={busy}
            className="group inline-flex items-center gap-3 px-10 md:px-12 h-16 md:h-18 rounded-xl bg-gradient-primary text-primary-foreground font-black text-base md:text-lg uppercase tracking-wider shadow-glow hover:shadow-[0_0_90px_hsl(var(--primary)/0.7)] transition-all hover:scale-[1.04] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <DiscordIcon className="h-6 w-6" />}
            Entrar com Discord
            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="font-display font-black tracking-tight">SERVER<span className="text-primary">BOOST</span></span>
          </div>
          <span>© {new Date().getFullYear()} ServerBoost — Todos os direitos reservados</span>
        </div>
      </footer>

      <SupportFab />
    </div>
  );
};

export default Landing;
