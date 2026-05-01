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
  Flame,
  TrendingUp,
  Zap,
  Target,
  DollarSign,
  Trophy,
  Rocket,
  ShieldCheck,
  MousePointerClick,
  Send,
  BarChart3,
  Sparkles,
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const plans = [
  {
    name: "TESTE",
    dms: 100,
    price: 49,
    desc: "Entrada barata pra sentir o sistema",
    badge: null,
    cta: "COMEÇAR AGORA",
  },
  {
    name: "PRO",
    dms: 300,
    price: 129,
    desc: "Para quem já quer ver o servidor enchendo",
    badge: "MAIS ESCOLHIDO",
    cta: "COMEÇAR AGORA",
  },
  {
    name: "ELITE",
    dms: 1000,
    price: 379,
    desc: "Melhor custo por DM. Para dominar.",
    badge: "MELHOR CUSTO",
    cta: "COMEÇAR AGORA",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.functions.invoke("discord-config").then(({ data }) => {
      if (data?.client_id) setClientId(data.client_id);
    }).catch(() => {});
  }, []);

  const connectDiscord = () => {
    if (!clientId) {
      toast.error("Carregando configuração... tenta de novo em 2s");
      return;
    }
    setBusy(true);
    const state = btoa(JSON.stringify({ origin: window.location.origin, redirect: "/app", nonce: crypto.randomUUID() }));
    const redirectUri = encodeURIComponent(`${SUPABASE_URL}/functions/v1/discord-oauth-callback`);
    const scope = encodeURIComponent("identify email guilds");
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&prompt=consent`;
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-gold/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-gold to-gold-dark grid place-items-center shadow-[0_0_20px_rgba(255,215,0,0.5)]">
              <Crown className="h-5 w-5 text-black" />
            </div>
            <span className="font-display font-black text-lg tracking-tight">
              ORG<span className="text-gold">BOOST</span>
            </span>
          </div>
          <button
            onClick={connectDiscord}
            disabled={busy}
            className="group relative inline-flex items-center gap-2 px-4 md:px-6 h-10 md:h-11 rounded-lg bg-gradient-to-r from-gold to-gold-dark text-black font-black text-xs md:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(255,215,0,0.4)] hover:shadow-[0_0_40px_rgba(255,215,0,0.7)] transition-all hover:scale-[1.03] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <DiscordIcon className="h-4 w-4" />}
            <span className="hidden sm:inline">Conectar Discord</span>
            <span className="sm:hidden">Conectar</span>
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-12 md:pt-20 pb-16 md:pb-28">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gold/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-red-glow/15 blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/40 bg-gold/5 text-gold text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6 md:mb-8 animate-fade-in">
              <Flame className="h-3.5 w-3.5" />
              Exclusivo para orgs de apostas Free Fire
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-black leading-[0.95] tracking-tight mb-6 md:mb-8">
              TRANSFORME SUA ORG DE{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-gold via-yellow-300 to-gold-dark bg-clip-text text-transparent">
                  APOSTAS
                </span>
              </span>{" "}
              EM UMA{" "}
              <span className="text-red-glow">MÁQUINA</span> DE ENTRADA DE JOGADORES
            </h1>

            <p className="text-base md:text-xl text-white/70 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
              Sistema automático que coloca seu Discord{" "}
              <span className="text-gold font-bold">na frente de quem já aposta em Free Fire</span> — todos os dias.
            </p>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={connectDiscord}
                disabled={busy}
                className="group relative inline-flex items-center gap-3 px-8 md:px-10 h-14 md:h-16 rounded-xl bg-gradient-to-r from-gold via-yellow-300 to-gold-dark text-black font-black text-base md:text-lg uppercase tracking-wider shadow-[0_0_50px_rgba(255,215,0,0.5)] hover:shadow-[0_0_80px_rgba(255,215,0,0.8)] transition-all hover:scale-[1.04] disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <DiscordIcon className="h-5 w-5 md:h-6 md:w-6" />}
                Conectar com Discord
                <ArrowRight className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-xs text-white/50 mt-1">Sem cadastro • Sem cartão • 1 clique</p>
            </div>

            {/* DASHBOARD MOCK */}
            <div className="mt-12 md:mt-20 relative max-w-3xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold via-red-glow to-gold rounded-2xl blur-xl opacity-40" />
              <div className="relative rounded-2xl border border-gold/30 bg-gradient-to-br from-zinc-950 to-black p-4 md:p-6 shadow-2xl">
                {/* Window bar */}
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                  <div className="ml-3 text-[10px] text-white/40 font-mono">orgboost.app/painel</div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
                  {[
                    { icon: Send, label: "DMs Enviadas", value: "12.847", color: "text-gold" },
                    { icon: MousePointerClick, label: "Cliques", value: "3.421", color: "text-red-glow" },
                    { icon: TrendingUp, label: "Novos Membros", value: "+1.892", color: "text-emerald-400" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl bg-black/60 border border-white/5 p-3 md:p-4 text-left">
                      <s.icon className={`h-4 w-4 md:h-5 md:w-5 ${s.color} mb-2`} />
                      <div className={`text-lg md:text-2xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-white/40 font-bold">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Fake notifications */}
                <div className="space-y-1.5 text-left">
                  {[
                    { user: "carlos_aposta", action: "entrou no servidor", time: "agora" },
                    { user: "ff_bet_king", action: "clicou no link", time: "1s" },
                    { user: "rumble_master", action: "entrou no servidor", time: "3s" },
                  ].map((n, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-gold/10 text-xs animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-gold to-gold-dark grid place-items-center text-black font-black text-[10px]">
                        {n.user[0].toUpperCase()}
                      </div>
                      <span className="text-white/80"><b className="text-gold">@{n.user}</b> {n.action}</span>
                      <span className="ml-auto text-white/30 text-[10px]">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT BLOCK */}
      <section className="py-16 md:py-24 border-y border-gold/20 bg-gradient-to-b from-black via-zinc-950 to-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.06),transparent_70%)]" />
        <div className="container mx-auto px-4 relative text-center">
          <p className="text-base md:text-lg text-white/50 uppercase tracking-[0.3em] mb-4 font-bold">A real é essa</p>
          <h2 className="font-display text-3xl md:text-6xl font-black leading-tight mb-6 max-w-4xl mx-auto">
            Enquanto algumas orgs ficam <span className="text-red-glow line-through opacity-70">paradas</span>…
            <br />
            outras estão crescendo <span className="text-gold">TODOS OS DIAS</span>
          </h2>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 border-gold/40 bg-gold/5 mt-4">
            <Trophy className="h-5 w-5 text-gold" />
            <p className="text-base md:text-xl font-black tracking-wide">
              Diferença? <span className="text-gold">Elas usam sistema.</span>
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <p className="text-gold uppercase tracking-[0.3em] text-xs font-bold mb-3">Como funciona</p>
            <h2 className="font-display text-3xl md:text-5xl font-black leading-tight">
              Você não precisa divulgar manualmente <span className="text-gold">nunca mais.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {[
              {
                n: "01",
                icon: Target,
                title: "Escolhe quantas DMs quer",
                desc: "100, 300, 1000... você decide o tamanho do disparo.",
              },
              {
                n: "02",
                icon: Flame,
                title: "Define o público",
                desc: "Apostas, Free Fire, e-sports. A IA encontra os jogadores certos.",
              },
              {
                n: "03",
                icon: Rocket,
                title: "Sistema entrega no privado",
                desc: "Sua oferta cai direto no DM. Sem você mexer um dedo.",
              },
            ].map((step, i) => (
              <div key={i} className="group relative rounded-2xl border border-gold/20 bg-gradient-to-br from-zinc-950 to-black p-6 md:p-8 hover:border-gold/60 transition-all hover:-translate-y-1">
                <div className="absolute top-4 right-4 font-display text-5xl md:text-6xl font-black text-gold/10 group-hover:text-gold/20 transition-colors">{step.n}</div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold to-gold-dark grid place-items-center mb-4 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                  <step.icon className="h-6 w-6 text-black" />
                </div>
                <h3 className="font-display font-black text-xl md:text-2xl mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gold/10 border border-gold/30">
              <Sparkles className="h-4 w-4 text-gold" />
              <span className="font-bold text-gold text-sm md:text-base">Tudo automático.</span>
            </div>
          </div>
        </div>
      </section>

      {/* PANEL PREVIEW */}
      <section className="py-16 md:py-28 border-y border-gold/20 bg-gradient-to-b from-black to-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-gold uppercase tracking-[0.3em] text-xs font-bold mb-3">Painel exclusivo</p>
            <h2 className="font-display text-3xl md:text-5xl font-black leading-tight">
              Conectou o Discord. <span className="text-gold">Acesso liberado.</span>
            </h2>
            <p className="text-white/60 mt-4 text-base md:text-lg">Tudo que você precisa pra dominar o jogo, num só lugar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-5 max-w-6xl mx-auto">
            {[
              {
                icon: BarChart3,
                title: "DASHBOARD",
                items: ["DMs enviadas em tempo real", "Cliques recebidos", "Crescimento do servidor"],
              },
              {
                icon: Send,
                title: "CRIAR CAMPANHA",
                items: ["Escolher quantidade de DMs", "Definir público (apostas / FF)", "Ativar com 1 clique"],
              },
              {
                icon: DollarSign,
                title: "COMPRAR DMs",
                items: ["Planos rápidos", "Checkout PIX", "Crédito instantâneo"],
              },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl border-2 border-gold/20 bg-black p-6 md:p-7 hover:border-gold/50 transition-all">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
                  <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/30 grid place-items-center">
                    <card.icon className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="font-display font-black text-base md:text-lg tracking-wide">{card.title}</h3>
                </div>
                <ul className="space-y-3">
                  {card.items.map((it, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-white/80">
                      <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF / GROWTH */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto rounded-3xl border border-gold/30 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-6 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,215,0,0.1),transparent_60%)]" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-gold uppercase tracking-[0.3em] text-xs font-bold mb-3">Resultado real</p>
                <h2 className="font-display text-3xl md:text-5xl font-black leading-tight mb-4">
                  Movimento <span className="text-gold">constante.</span><br />
                  Servidor <span className="text-red-glow">cheio.</span>
                </h2>
                <p className="text-white/60 text-base md:text-lg leading-relaxed">
                  Enquanto o concorrente posta no story esperando "viralizar", o seu Discord tá recebendo apostadores reais — minuto após minuto.
                </p>
              </div>

              {/* Fake chart */}
              <div className="rounded-2xl bg-black/60 border border-gold/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Membros / dia</div>
                    <div className="text-3xl font-black text-gold">+247%</div>
                  </div>
                  <div className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">▲ ATIVO</div>
                </div>
                <div className="flex items-end gap-1.5 h-32">
                  {[15, 22, 18, 35, 28, 48, 42, 65, 58, 78, 72, 95].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-gold/40 to-gold relative overflow-hidden" style={{ height: `${h}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-white/30 font-mono">
                  <span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SAB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-16 md:py-28 border-y border-gold/20 bg-gradient-to-b from-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <p className="text-gold uppercase tracking-[0.3em] text-xs font-bold mb-3">Planos</p>
            <h2 className="font-display text-3xl md:text-5xl font-black leading-tight">
              Escolhe o tamanho do <span className="text-gold">disparo.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {plans.map((p, i) => {
              const featured = p.name === "PRO";
              return (
                <div
                  key={i}
                  className={`relative rounded-2xl p-6 md:p-8 transition-all hover:-translate-y-1 ${
                    featured
                      ? "border-2 border-gold bg-gradient-to-br from-gold/10 via-zinc-950 to-black shadow-[0_0_40px_rgba(255,215,0,0.3)] md:scale-105"
                      : "border border-gold/20 bg-black hover:border-gold/50"
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-gold to-gold-dark text-black text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      {p.badge}
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="font-display font-black text-2xl md:text-3xl tracking-tight mb-1">{p.name}</h3>
                    <p className="text-xs text-white/50 mb-6">{p.desc}</p>
                    <div className="mb-6">
                      <div className="text-5xl md:text-6xl font-display font-black text-gold leading-none">
                        {p.dms.toLocaleString("pt-BR")}
                      </div>
                      <div className="text-xs uppercase tracking-widest text-white/40 font-bold mt-1">DMs</div>
                    </div>
                    <div className="mb-6">
                      <div className="text-3xl font-black">
                        R$ {p.price}
                      </div>
                      <div className="text-[11px] text-white/40">pagamento único · PIX</div>
                    </div>
                    <button
                      onClick={connectDiscord}
                      disabled={busy}
                      className={`w-full h-12 rounded-xl font-black uppercase tracking-wider text-sm transition-all ${
                        featured
                          ? "bg-gradient-to-r from-gold to-gold-dark text-black shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:shadow-[0_0_50px_rgba(255,215,0,0.8)] hover:scale-[1.03]"
                          : "bg-white/5 border border-gold/30 text-gold hover:bg-gold hover:text-black"
                      }`}
                    >
                      {p.cta}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* OBJECTIONS */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
            {[
              { icon: Zap, t: "100% automático", d: "Você não mexe em nada" },
              { icon: Target, t: "Foco em apostas FF", d: "Público filtrado" },
              { icon: ShieldCheck, t: "Sem esforço manual", d: "Configura e esquece" },
              { icon: Rocket, t: "Resultados rápidos", d: "Sente em horas" },
            ].map((o, i) => (
              <div key={i} className="rounded-xl border border-gold/20 bg-zinc-950 p-5 text-center hover:border-gold/50 transition-colors">
                <o.icon className="h-7 w-7 text-gold mx-auto mb-3" />
                <div className="font-black text-sm md:text-base mb-1">{o.t}</div>
                <div className="text-xs text-white/50">{o.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.15),transparent_60%)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-glow/10 blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative text-center">
          <Crown className="h-12 w-12 md:h-16 md:w-16 text-gold mx-auto mb-6 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" />
          <h2 className="font-display text-4xl md:text-7xl font-black leading-[0.95] tracking-tight mb-8 max-w-4xl mx-auto">
            Quem cresce primeiro,<br />
            <span className="bg-gradient-to-r from-gold via-yellow-300 to-gold-dark bg-clip-text text-transparent">domina o jogo.</span>
          </h2>
          <button
            onClick={connectDiscord}
            disabled={busy}
            className="group inline-flex items-center gap-3 px-10 md:px-14 h-16 md:h-20 rounded-2xl bg-gradient-to-r from-gold via-yellow-300 to-gold-dark text-black font-black text-base md:text-xl uppercase tracking-wider shadow-[0_0_60px_rgba(255,215,0,0.6)] hover:shadow-[0_0_100px_rgba(255,215,0,0.9)] transition-all hover:scale-[1.04] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <DiscordIcon className="h-6 w-6 md:h-7 md:w-7" />}
            Conectar com Discord
            <ArrowRight className="h-6 w-6 md:h-7 md:w-7 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-xs text-white/40 mt-5">Sem cadastro chato. 1 clique. Painel liberado na hora.</p>
        </div>
      </section>

      <footer className="border-t border-gold/10 py-8 text-center text-xs text-white/30">
        © {new Date().getFullYear()} OrgBoost — Sistema exclusivo para orgs de apostas Free Fire
      </footer>

      <SupportFab />
    </div>
  );
};

export default Landing;
