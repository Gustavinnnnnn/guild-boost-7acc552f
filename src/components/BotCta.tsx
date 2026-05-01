import { Bot, MessageCircle, Megaphone, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  variant: "buy" | "campaign";
};

const COPY = {
  buy: {
    icon: MessageCircle,
    title: "Compre DMs pelo bot Discord",
    subtitle: "A compra de DMs agora é feita 100% pelo nosso bot. Mais rápido, com PIX no DM.",
    command: "/comprar 200",
    description: "Use o comando acima no Discord para gerar o PIX. Você recebe o copia-e-cola e o QR Code direto no DM, e as DMs caem no saldo na hora que o pagamento é confirmado.",
  },
  campaign: {
    icon: Megaphone,
    title: "Crie campanhas pelo bot Discord",
    subtitle: "A criação de campanhas agora é feita pelo bot — mais rápido e direto.",
    command: "/divulgar 500",
    description: "Use o comando acima no Discord. O bot abre um formulário onde você configura mensagem, imagem, botão e dispara. As métricas continuam aparecendo aqui no painel.",
  },
} as const;

export const BotCta = ({ variant }: Props) => {
  const cfg = COPY[variant];
  const I = cfg.icon;

  const copyCmd = () => {
    navigator.clipboard.writeText(cfg.command);
    toast.success("Comando copiado!");
  };

  return (
    <div className="max-w-2xl mx-auto pt-4 md:pt-12">
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card p-6 md:p-10 shadow-[0_0_60px_-20px_hsl(var(--primary)/0.5)]">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-glow shrink-0">
              <I className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] uppercase tracking-widest font-black mb-2">
                <Bot className="h-3 w-3" /> Agora pelo Discord
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{cfg.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{cfg.subtitle}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-background/60 border-2 border-dashed border-primary/30 p-5">
            <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Use este comando no Discord</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 rounded-xl bg-card border border-border font-mono text-lg font-bold text-primary">
                {cfg.command}
              </code>
              <Button size="icon" variant="outline" onClick={copyCmd} title="Copiar">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{cfg.description}</p>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-4 text-xs text-muted-foreground">
            <b className="text-foreground">Não tem o bot no seu servidor?</b> Acesse o servidor oficial pra usar — o link tá fixado no canal de boas-vindas.
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="discord" className="flex-1 h-12 font-black" asChild>
              <a href="https://discord.gg/lovable-dev" target="_blank" rel="noreferrer">
                <Bot className="h-4 w-4 mr-2" /> Abrir Discord
                <ExternalLink className="h-3.5 w-3.5 ml-2 opacity-70" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
