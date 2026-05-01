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
  CheckCircle2,
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

  const steps = [
    { icon: Settings2, title: "Conecte", desc: "Entre com Discord e escolha o servidor que você quer movimentar." },
    { icon: Zap, title: "Dispare", desc: "Crie a campanha pelo painel e defina quantas DMs quer enviar." },
    { icon: TrendingUp, title: "Acompanhe", desc: "Veja saldo, envios e resultado sem depender de bot ou planilha." },
  ];

  const panelItems = [
    { icon: BarChart3, title: "Números claros", desc: "Saldo, campanhas e desempenho em uma tela só." },
    { icon: Target, title: "Campanha rápida", desc: "Texto, destino e quantidade configurados sem enrolação." },
    { icon: Sparkles, title: "Recarga direta", desc: "Comprou plano, as DMs entram no saldo da conta." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      <header className="sticky top-0 z-50 bg-background/95 border-b border-border">
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
        <section className="relative border-b border-border bg-background">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-normal text-primary mb-5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Divulgação pra servidor parado
                </div>

                <h1 className="font-display text-[2.45rem] sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-normal mb-6 max-w-4xl mx-auto lg:mx-0">
                  Seu servidor não precisa morrer no silêncio.
                </h1>

                <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                  Pare de implorar divulgação em grupo. Compre DMs, crie campanhas pelo site e leve gente nova para a sua comunidade com controle total do saldo.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-6">
                  <button
                    onClick={connectDiscord}
                    disabled={busy}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 h-14 px-6 md:px-8 rounded-lg bg-primary text-primary-foreground font-black text-sm md:text-base uppercase tracking-normal transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <DiscordIcon className="h-5 w-5" />}
                    Começar agora
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <div className="text-xs text-muted-foreground text-center sm:text-left">
                    Sem cartão no cadastro<br className="hidden sm:block" /> saldo liberado após pagamento
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-2xl mx-auto lg:mx-0">
                  {["Campanhas pelo site", "Compra de DMs", "Painel responsivo"].map((item) => (
                    <div key={item} className="flex items-center justify-center sm:justify-start gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-normal text-muted-foreground font-black">Painel</p>
                    <p className="text-sm font-bold">Resumo da campanha</p>
                  </div>
                  <span className="rounded-full bg-success/10 text-success border border-success/20 px-3 py-1 text-[10px] font-black uppercase">
                    ativo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground font-black tracking-normal mb-2">
                      <Users className="h-3 w-3 text-primary" /> DMs no saldo
                    </div>
                    <div className="font-display text-3xl md:text-4xl font-black text-primary">1.250</div>
                    <div className="text-[10px] text-success mt-1 font-semibold">prontas pra usar</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground font-black tracking-normal mb-2">
                      <MousePointerClick className="h-3 w-3 text-primary" /> Envios hoje
                    </div>
                    <div className="font-display text-3xl md:text-4xl font-black">218</div>
                    <div className="text-[10px] text-muted-foreground mt-1">campanha rodando</div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 mb-3">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-[10px] uppercase text-muted-foreground font-black tracking-normal">Progresso da campanha</span>
                    <span className="text-[10px] text-primary font-black">62%</span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full w-[62%] rounded-full bg-primary" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      ["500", "fila"],
                      ["312", "enviadas"],
                      ["42", "cliques"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-lg border border-border bg-card p-2">
                        <div className="font-display text-lg font-black">{value}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <span className="text-sm font-semibold">Próximo envio</span>
                  <span className="text-[10px] uppercase text-primary font-black tracking-normal">automático</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 border-b border-border bg-card/35">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <p className="text-2xl md:text-5xl font-display font-black leading-tight">
              Divulgação sem constância vira sorte. Aqui vira processo.
            </p>
            <p className="mt-5 text-base md:text-lg text-muted-foreground">
              O foco é simples: comprar saldo, criar campanha e acompanhar o resultado sem depender de bot no chat.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 md:mb-14">
              <div className="text-xs uppercase tracking-normal text-primary font-black mb-3">Como funciona</div>
              <h2 className="font-display text-3xl md:text-5xl font-black">Três passos, tudo pelo site</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto">
              {steps.map((s, i) => (
                <div key={s.title} className="rounded-2xl border border-border bg-card p-6 md:p-7">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center mb-5">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground font-black mb-2">0{i + 1}</div>
                  <h3 className="font-display text-xl font-black mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 border-y border-border bg-card/35">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 md:mb-14">
              <div className="text-xs uppercase tracking-normal text-primary font-black mb-3">Painel</div>
              <h2 className="font-display text-3xl md:text-5xl font-black">Feito pra vender e controlar DMs</h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-4 md:gap-5 max-w-6xl mx-auto">
              {panelItems.map((p) => (
                <div key={p.title} className="rounded-2xl border border-border bg-background p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
                      <p.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-black leading-tight">{p.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20 border-b border-border">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid sm:grid-cols-3 gap-3 md:gap-5">
              {[
                { icon: Zap, label: "Sistema disponível 24h" },
                { icon: Target, label: "Campanhas criadas no painel" },
                { icon: ShieldCheck, label: "Saldo controlado por conta" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4">
                  <c.icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-foreground/80">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-6xl font-black leading-tight mb-5 max-w-3xl mx-auto">
              Comece antes que seu servidor esfrie de vez.
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Entre com Discord, compre seu plano e rode a primeira campanha pelo painel.
            </p>
            <button
              onClick={connectDiscord}
              disabled={busy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 h-14 md:h-16 px-6 md:px-10 rounded-lg bg-primary text-primary-foreground font-black text-sm md:text-base uppercase tracking-normal transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <DiscordIcon className="h-6 w-6" />}
              Conectar com Discord
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
          <span>© {new Date().getFullYear()} ServerBoost — Todos os direitos reservados</span>
        </div>
      </footer>

      <SupportFab />
    </div>
  );
};

export default Landing;
