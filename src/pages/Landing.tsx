import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DiscordIcon } from "@/components/DiscordIcon";
import { SupportFab } from "@/components/SupportFab";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  Check,
  Crown,
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
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0A0A]/80 border-b border-gold/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-gold to-gold-dark grid place-items-center shadow-[0_0_18px_rgba(255,215,0,0.45)]">
              <Crown className="h-5 w-5 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-display font-black text-lg tracking-tight">
              ORG<span className="text-gold">BOOST</span>
            </span>
          </div>
          <button
            onClick={connectDiscord}
            disabled={busy}
            className="group inline-flex items-center gap-2 px-4 md:px-5 h-10 rounded-lg bg-gold text-black font-bold text-xs md:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(255,215,0,0.35)] hover:bg-red-glow hover:text-white hover:shadow-[0_0_28px_rgba(255,42,42,0.55)] transition-all disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <DiscordIcon className="h-4 w-4" />}
            <span>Entrar com Discord</span>
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-12 md:pt-20 pb-20 md:pb-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full bg-gold/[0.07] blur-[140px]" />
          <div className="absolute bottom-0 right-[-100px] w-[500px] h-[500px] rounded-full bg-red-glow/[0.08] blur-[140px]" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* LEFT — TEXT */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 bg-gold/5 text-gold text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Para orgs de Free Fire
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black leading-[0.95] tracking-tight mb-6">
                SUA ORG NÃO PRECISA DE{" "}
                <span className="bg-gradient-to-r from-gold via-yellow-200 to-gold-dark bg-clip-text text-transparent">
                  SORTE
                </span>{" "}
                PRA CRESCER
              </h1>

              <p className="text-base md:text-lg text-white/65 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                Coloque seu servidor na frente de jogadores que já apostam em{" "}
                <span className="text-white font-semibold">Free Fire</span> — todos os dias, no automático.
              </p>

              <div className="flex flex-col items-center lg:items-start gap-2">
                <button
                  onClick={connectDiscord}
                  disabled={busy}
                  className="group inline-flex items-center gap-3 px-8 md:px-10 h-14 md:h-16 rounded-xl bg-gradient-to-r from-gold via-yellow-200 to-gold-dark text-black font-black text-base md:text-lg uppercase tracking-wider shadow-[0_0_45px_rgba(255,215,0,0.45)] hover:shadow-[0_0_70px_rgba(255,215,0,0.75)] transition-all hover:scale-[1.03] disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <DiscordIcon className="h-5 w-5 md:h-6 md:w-6" />}
                  Entrar com Discord
                  <ArrowRight className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-xs text-white/45 mt-1">Acesse o painel e comece em segundos</p>
              </div>
            </div>

            {/* RIGHT — DASHBOARD MOCK */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-gold/30 via-transparent to-red-glow/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-gold/20 bg-gradient-to-br from-[#141414] to-[#0A0A0A] p-5 md:p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
                {/* Window bar */}
                <div className="flex items-center gap-1.5 mb-5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-glow/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-gold/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <div className="ml-3 text-[10px] text-white/40 font-mono">painel.orgboost.gg</div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl border border-gold/15 bg-black/40 p-4">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase text-white/45 font-bold tracking-wider mb-2">
                      <Users className="h-3 w-3 text-gold" /> Entradas hoje
                    </div>
                    <div className="font-display text-3xl font-black text-gold">+27</div>
                    <div className="text-[10px] text-emerald-400 mt-1 font-semibold">▲ 18% vs ontem</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase text-white/45 font-bold tracking-wider mb-2">
                      <MousePointerClick className="h-3 w-3 text-white/60" /> Cliques
                    </div>
                    <div className="font-display text-3xl font-black text-white">142</div>
                    <div className="text-[10px] text-white/40 mt-1">últimas 24h</div>
                  </div>
                </div>

                {/* Chart */}
                <div className="rounded-xl border border-white/10 bg-black/40 p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase text-white/45 font-bold tracking-wider">Crescimento 7d</span>
                    <span className="text-[10px] text-gold font-bold">+ 184 membros</span>
                  </div>
                  <svg viewBox="0 0 200 60" className="w-full h-14">
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,50 L25,42 L50,38 L75,30 L100,28 L125,18 L150,14 L175,8 L200,4 L200,60 L0,60 Z" fill="url(#g)" />
                    <path d="M0,50 L25,42 L50,38 L75,30 L100,28 L125,18 L150,14 L175,8 L200,4" fill="none" stroke="#FFD700" strokeWidth="1.8" />
                  </svg>
                </div>

                {/* Active campaign */}
                <div className="flex items-center justify-between rounded-xl border border-gold/25 bg-gold/5 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    <span className="text-sm font-semibold">Campanha PRO ativa</span>
                  </div>
                  <span className="text-[10px] uppercase text-gold font-bold tracking-wider">enviando</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — STATUS / DIFERENÇA */}
      <section className="relative py-20 md:py-28 border-y border-gold/10 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.05),transparent_70%)]">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <p className="text-2xl md:text-4xl font-display font-bold leading-tight text-white/80">
            Enquanto alguns servidores ficam parados…
            <br />
            outros estão sempre com gente entrando.
          </p>
          <p className="mt-8 text-2xl md:text-4xl font-display font-black text-gold drop-shadow-[0_0_30px_rgba(255,215,0,0.4)]">
            A diferença está no sistema que usam.
          </p>
        </div>
      </section>

      {/* SECTION 3 — COMO FUNCIONA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-[0.3em] text-gold font-bold mb-3">Como funciona</div>
            <h2 className="font-display text-3xl md:text-5xl font-black">3 passos. Zero esforço.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { icon: Settings2, title: "Configure", desc: "Escolha o alcance e o público" },
              { icon: Zap, title: "Ative", desc: "Seu servidor começa a ser distribuído automaticamente" },
              { icon: TrendingUp, title: "Cresça", desc: "Novos jogadores chegam todos os dias" },
            ].map((s, i) => (
              <div
                key={s.title}
                className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#141414] to-[#0A0A0A] p-6 md:p-8 hover:border-gold/40 transition-all"
              >
                <div className="absolute top-5 right-5 font-display text-5xl font-black text-white/[0.04] group-hover:text-gold/10 transition-colors">
                  0{i + 1}
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 grid place-items-center mb-5 group-hover:shadow-[0_0_25px_rgba(255,215,0,0.3)] transition-all">
                  <s.icon className="h-6 w-6 text-gold" />
                </div>
                <h3 className="font-display text-xl font-black mb-2">{s.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — PAINEL */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-transparent via-gold/[0.02] to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-[0.3em] text-gold font-bold mb-3">Painel</div>
            <h2 className="font-display text-3xl md:text-5xl font-black">
              Controle total em <span className="text-gold">um único painel</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {[
              {
                icon: BarChart3,
                title: "Dashboard",
                desc: "Métricas em tempo real do seu crescimento",
              },
              {
                icon: Target,
                title: "Criar campanha",
                desc: "Defina o alcance e o público em segundos",
              },
              {
                icon: Sparkles,
                title: "Comprar alcance",
                desc: "PIX rápido. Créditos liberados na hora.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-gold/15 bg-gradient-to-br from-[#141414] to-[#0A0A0A] p-6 hover:border-gold/35 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/30 grid place-items-center">
                    <p.icon className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="font-display text-lg font-black">{p.title}</h3>
                </div>
                <p className="text-white/55 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — CONFIANÇA */}
      <section className="py-16 md:py-20 border-t border-gold/10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            {[
              { icon: Zap, label: "Sistema automatizado" },
              { icon: Target, label: "Segmentado para apostas" },
              { icon: ShieldCheck, label: "Sem divulgação manual" },
            ].map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4"
              >
                <c.icon className="h-5 w-5 text-gold shrink-0" />
                <span className="text-sm font-semibold text-white/80">{c.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/35">
            Resultados podem variar conforme servidor e oferta.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gold/[0.08] blur-[150px]" />
        </div>
        <div className="container mx-auto px-4 relative text-center">
          <h2 className="font-display text-4xl md:text-6xl font-black leading-tight mb-10 max-w-3xl mx-auto">
            Quem cresce primeiro,
            <br />
            <span className="bg-gradient-to-r from-gold via-yellow-200 to-gold-dark bg-clip-text text-transparent">
              domina o jogo.
            </span>
          </h2>
          <button
            onClick={connectDiscord}
            disabled={busy}
            className="group inline-flex items-center gap-3 px-10 md:px-12 h-16 md:h-18 rounded-xl bg-gradient-to-r from-gold via-yellow-200 to-gold-dark text-black font-black text-base md:text-lg uppercase tracking-wider shadow-[0_0_60px_rgba(255,215,0,0.55)] hover:shadow-[0_0_90px_rgba(255,215,0,0.85)] transition-all hover:scale-[1.04] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <DiscordIcon className="h-6 w-6" />}
            Entrar com Discord
            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gold/10 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-gold" />
            <span className="font-display font-black tracking-tight">ORG<span className="text-gold">BOOST</span></span>
          </div>
          <span>© {new Date().getFullYear()} OrgBoost — Todos os direitos reservados</span>
        </div>
      </footer>

      <SupportFab />
    </div>
  );
};

export default Landing;
