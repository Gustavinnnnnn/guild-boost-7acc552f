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
  Zap,
  TrendingUp,
  BarChart3,
  Users,
  MousePointerClick,
  ShieldCheck,
  Target,
  CheckCircle2,
  Crosshair,
  Megaphone,
  Flame,
  Lock,
  XCircle,
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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary grid place-items-center shrink-0">
              <Rocket className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display font-black text-base md:text-lg tracking-normal truncate">
              SERVER<span className="text-primary">BOOST</span>
            </span>
          </div>
          <button
            onClick={connectDiscord}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 h-9 px-3 md:px-5 rounded-lg bg-primary text-primary-foreground font-black text-[11px] md:text-sm uppercase tracking-normal transition-colors hover:bg-primary/90 disabled:opacity-50 shrink-0"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <DiscordIcon className="h-4 w-4" />}
            <span className="hidden sm:inline">Entrar com Discord</span>
            <span className="sm:hidden">Entrar</span>
          </button>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative border-b border-border bg-background">
          <div className="container mx-auto px-4 py-14 md:py-24">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-wider text-primary mb-6">
                <Flame className="h-3.5 w-3.5" />
                A primeira plataforma de ads pra Discord
              </div>

              <h1 className="font-display text-[2.5rem] sm:text-5xl md:text-7xl lg:text-[5.5rem] font-black leading-[0.9] tracking-tight mb-6">
                Se o Facebook tem Ads,<br className="hidden sm:block" />{" "}
                <span className="text-primary">o Discord agora também.</span>
              </h1>

              <p className="text-base md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4 leading-relaxed">
                Pare de torrar grana em tráfego que ninguém vê.
              </p>
              <p className="text-base md:text-xl text-foreground/90 max-w-3xl mx-auto mb-10 leading-relaxed font-semibold">
                A gente coloca seu servidor na <span className="text-primary">DM de gente real</span>, com campanha, métrica e controle de saldo — igualzinho Facebook Ads, só que dentro do Discord.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
                <button
                  onClick={connectDiscord}
                  disabled={busy}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 h-14 md:h-16 px-6 md:px-10 rounded-lg bg-primary text-primary-foreground font-black text-sm md:text-base uppercase tracking-wider transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <DiscordIcon className="h-5 w-5" />}
                  Lançar minha primeira campanha
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs md:text-sm text-muted-foreground">
                {["Sem cartão no cadastro", "Saldo liberado na hora", "Cancela quando quiser"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PAINEL DEMO */}
            <div className="mt-14 md:mt-20 max-w-4xl mx-auto rounded-2xl border border-border bg-card p-4 md:p-6 shadow-2xl shadow-primary/5">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-black">Campanha ao vivo</p>
                  <p className="text-sm md:text-base font-bold">Boost — Servidor de Trade</p>
                </div>
                <span className="rounded-full bg-success/10 text-success border border-success/30 px-3 py-1 text-[10px] font-black uppercase">
                  ● rodando
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="rounded-xl border border-border bg-background p-3 md:p-4">
                  <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] uppercase text-muted-foreground font-black tracking-wider mb-2">
                    <Users className="h-3 w-3 text-primary" /> Saldo
                  </div>
                  <div className="font-display text-2xl md:text-4xl font-black text-primary">1.250</div>
                  <div className="text-[10px] text-success mt-1 font-semibold">DMs</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3 md:p-4">
                  <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] uppercase text-muted-foreground font-black tracking-wider mb-2">
                    <MousePointerClick className="h-3 w-3 text-primary" /> Enviadas
                  </div>
                  <div className="font-display text-2xl md:text-4xl font-black">812</div>
                  <div className="text-[10px] text-muted-foreground mt-1">hoje</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3 md:p-4">
                  <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] uppercase text-muted-foreground font-black tracking-wider mb-2">
                    <TrendingUp className="h-3 w-3 text-primary" /> Entradas
                  </div>
                  <div className="font-display text-2xl md:text-4xl font-black text-success">+184</div>
                  <div className="text-[10px] text-muted-foreground mt-1">no servidor</div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-[10px] uppercase text-muted-foreground font-black tracking-wider">Progresso</span>
                  <span className="text-[10px] text-primary font-black">65%</span>
                </div>
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full w-[65%] rounded-full bg-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DOR */}
        <section className="py-16 md:py-24 border-b border-border bg-card/40">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-10 md:mb-14">
              <div className="text-xs uppercase tracking-wider text-destructive font-black mb-3">A real</div>
              <h2 className="font-display text-3xl md:text-5xl font-black leading-tight">
                Você já tentou de tudo.<br className="hidden sm:block" /> E nada move o servidor.
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 md:gap-4">
              {[
                "Pagou bot de divulgação e ninguém entrou.",
                "Trocou divulgação em grupo e só apareceu fake.",
                "Rodou anúncio fora do Discord e o público não converte.",
              ].map((p) => (
                <div key={p} className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm md:text-base text-foreground/90 leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
            <p className="text-center mt-10 text-base md:text-xl text-muted-foreground max-w-3xl mx-auto">
              O problema não é seu servidor. <span className="text-foreground font-bold">É o canal.</span> Sua audiência tá no Discord — e até hoje ninguém montou um sistema sério pra falar com ela.
            </p>
          </div>
        </section>

        {/* SOLUÇÃO — DISCORD ADS */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12 md:mb-16">
              <div className="text-xs uppercase tracking-wider text-primary font-black mb-3">A virada</div>
              <h2 className="font-display text-3xl md:text-6xl font-black leading-[0.95] max-w-4xl mx-auto">
                Tráfego pago. Mas dentro do <span className="text-primary">Discord</span>.
              </h2>
              <p className="mt-5 text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Único sistema do mercado que entrega mensagem direta pra usuário real, com controle igual gerenciador de anúncios.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-5">
              {[
                {
                  icon: Crosshair,
                  title: "Mira certa",
                  desc: "Sua mensagem chega no privado de quem realmente usa Discord — não em fake, não em bot.",
                },
                {
                  icon: Megaphone,
                  title: "Volume de verdade",
                  desc: "Dispare centenas ou milhares de DMs por campanha. Você define o tamanho do tiro.",
                },
                {
                  icon: BarChart3,
                  title: "Métrica no painel",
                  desc: "Saldo, enviadas, progresso e resultado. Igual gerenciador de Ads, sem planilha.",
                },
              ].map((f) => (
                <div key={f.title} className="rounded-2xl border border-border bg-card p-6 md:p-7 hover:border-primary/40 transition-colors">
                  <div className="h-12 w-12 rounded-xl bg-primary grid place-items-center mb-5">
                    <f.icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-display text-xl md:text-2xl font-black mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARATIVO FB ADS vs SERVERBOOST */}
        <section className="py-16 md:py-24 border-b border-border bg-card/40">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-10 md:mb-14">
              <div className="text-xs uppercase tracking-wider text-primary font-black mb-3">Compara aí</div>
              <h2 className="font-display text-3xl md:text-5xl font-black leading-tight">
                Mesmo poder do Facebook Ads.<br className="hidden sm:block" /> Outro território.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              <div className="rounded-2xl border border-border bg-background p-6 md:p-7">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-black mb-3">Facebook Ads</div>
                <div className="font-display text-2xl font-black mb-5">Anuncia no feed</div>
                <ul className="space-y-3 text-sm md:text-base">
                  {[
                    "Campanha por gerenciador",
                    "Segmentação de público",
                    "Métricas em tempo real",
                    "Saldo gerenciado por conta",
                  ].map((i) => (
                    <li key={i} className="flex items-center gap-2 text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" /> {i}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border-2 border-primary bg-primary/5 p-6 md:p-7 relative">
                <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider">
                  ServerBoost
                </span>
                <div className="text-[10px] uppercase tracking-wider text-primary font-black mb-3">Discord Ads</div>
                <div className="font-display text-2xl font-black mb-5">Entrega na DM</div>
                <ul className="space-y-3 text-sm md:text-base">
                  {[
                    "Campanha por painel próprio",
                    "Mensagem direta em quem importa",
                    "Saldo, envios e cliques no dashboard",
                    "Recarga instantânea no plano",
                  ].map((i) => (
                    <li key={i} className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> <span className="font-semibold">{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-10 md:mb-14">
              <div className="text-xs uppercase tracking-wider text-primary font-black mb-3">Como funciona</div>
              <h2 className="font-display text-3xl md:text-5xl font-black">3 passos. Tudo pelo painel.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4 md:gap-5">
              {[
                { icon: DiscordIcon, title: "Conecta", desc: "Login com Discord, escolhe o servidor que vai receber tráfego." },
                { icon: Zap, title: "Carrega o saldo", desc: "Compra um plano, suas DMs caem na conta na hora." },
                { icon: Target, title: "Dispara a campanha", desc: "Escreve a mensagem, define quantidade e acompanha o resultado." },
              ].map((s, i) => (
                <div key={s.title} className="rounded-2xl border border-border bg-card p-6 md:p-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-[10px] uppercase text-muted-foreground font-black tracking-wider">Passo 0{i + 1}</div>
                  </div>
                  <h3 className="font-display text-xl font-black mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RAREZA */}
        <section className="py-16 md:py-24 border-b border-border bg-card/40">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <Lock className="h-10 w-10 text-primary mx-auto mb-5" />
            <h2 className="font-display text-3xl md:text-5xl font-black leading-tight mb-5">
              Esse sistema não existe em mais lugar nenhum.
            </h2>
            <p className="text-base md:text-xl text-muted-foreground leading-relaxed">
              Discord Ads é raro. Quem entra agora pega o canal limpo, audiência fria e custo baixo — antes do mercado descobrir.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mt-10">
              {[
                { icon: Zap, label: "Plataforma 24h no ar" },
                { icon: ShieldCheck, label: "Saldo separado por conta" },
                { icon: Flame, label: "Único no mercado" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-4">
                  <c.icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-foreground/80 text-left">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-16 md:py-28">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="font-display text-3xl md:text-6xl font-black leading-[0.95] mb-5">
              Enquanto você lê, alguém tá lançando ads pra <span className="text-primary">sua audiência</span>.
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Conecta o Discord, escolhe o plano e dispara a primeira campanha em minutos.
            </p>
            <button
              onClick={connectDiscord}
              disabled={busy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 h-14 md:h-16 px-6 md:px-10 rounded-lg bg-primary text-primary-foreground font-black text-sm md:text-base uppercase tracking-wider transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <DiscordIcon className="h-6 w-6" />}
              Quero meu Discord Ads
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground text-center md:text-left">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="font-display font-black tracking-normal">SERVER<span className="text-primary">BOOST</span></span>
          </div>
          <span>© {new Date().getFullYear()} ServerBoost — Discord Ads. Todos os direitos reservados.</span>
        </div>
      </footer>

      <SupportFab />
    </div>
  );
};

export default Landing;
