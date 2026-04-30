import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import {
  Plus, Send, Trash2, CheckCircle2, XCircle, Clock, Users, MousePointerClick,
  Loader2, Ban, MailX, UserX, Pencil, Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { findNiche } from "@/lib/ads";

type Campaign = {
  id: string; name: string; title: string; message: string; image_url: string | null;
  status: string; sent_at: string | null;
  target_count: number; target_niches: string[];
  total_targeted: number; total_delivered: number; total_failed: number; total_clicks: number;
  failed_blocked: number; failed_dm_closed: number; failed_deleted: number; failed_other: number;
  credits_spent: number; created_at: string; button_label: string | null; button_url: string | null;
};

const Campaigns = () => {
  const { user } = useAuth();
  const { refresh: refreshProfile } = useProfile();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setCampaigns((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  // Polling enquanto houver campanhas em "sending" — entrega progressiva estilo Meta Ads
  useEffect(() => {
    const hasSending = campaigns.some((c) => c.status === "sending");
    if (!hasSending) return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [campaigns]);

  const send = async (id: string) => {
    setSending(id);
    const { data, error } = await supabase.functions.invoke("send-campaign", { body: { campaign_id: id } });
    setSending(null);
    let errMsg = data?.error || error?.message;
    if (error && (error as any).context && typeof (error as any).context.json === "function") {
      try { const j = await (error as any).context.json(); errMsg = j?.error || errMsg; } catch {}
    }
    if (errMsg) { toast.error(errMsg, { duration: 8000 }); load(); return; }
    toast.success(`Campanha em entrega! Acompanhe o progresso em tempo real.`);
    refreshProfile();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover campanha?")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    toast.success("Removida");
    load();
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { icon: any; cls: string; label: string }> = {
      draft: { icon: Clock, cls: "bg-muted text-muted-foreground", label: "Rascunho" },
      sending: { icon: Loader2, cls: "bg-primary/15 text-primary", label: "Enviando..." },
      sent: { icon: CheckCircle2, cls: "bg-success/15 text-success", label: "Concluída" },
      failed: { icon: XCircle, cls: "bg-destructive/15 text-destructive", label: "Falhou" },
    };
    const m = map[status] ?? map.draft;
    const I = m.icon;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${m.cls}`}><I className={`h-3 w-3 ${status === "sending" ? "animate-spin" : ""}`} />{m.label}</span>;
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" /> Campanhas
          </h2>
          <p className="text-sm text-muted-foreground">Todos seus anúncios em DM.</p>
        </div>
        <Link to="/app/campanhas/nova"><Button variant="discord" className="gap-2"><Plus className="h-4 w-4" /> Nova campanha</Button></Link>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-12 text-center bg-gradient-to-br from-card to-transparent">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center mb-3 shadow-glow">
            <Megaphone className="h-7 w-7 text-white" />
          </div>
          <p className="text-muted-foreground text-sm mb-4">Nenhuma campanha ainda.</p>
          <Link to="/app/campanhas/nova"><Button variant="discord" className="gap-2"><Plus className="h-4 w-4" /> Criar a primeira</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const ctr = c.total_delivered > 0 ? ((c.total_clicks / c.total_delivered) * 100).toFixed(1) : "0.0";
            const niches = (c.target_niches || []).map(findNiche).filter(Boolean);
            return (
              <div key={c.id} className="rounded-2xl bg-card border border-border p-4 md:p-5 hover:border-primary/40 transition">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-black tracking-tight">{c.name}</h3>
                      <StatusBadge status={c.status} />
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-bold">🎯 {c.target_count.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.title || "(sem título)"}</div>
                    {niches.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {niches.slice(0, 6).map((n) => n && (
                          <span key={n.value} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">{n.emoji} {n.label}</span>
                        ))}
                        {niches.length > 6 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">+{niches.length - 6}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {c.status === "draft" && (
                      <>
                        <Link to={`/app/campanhas/${c.id}/editar`}>
                          <Button size="sm" variant="ghost" className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Editar</Button>
                        </Link>
                        <Button size="sm" variant="discord" disabled={sending === c.id} onClick={() => send(c.id)} className="gap-1.5">
                          <Send className="h-3.5 w-3.5" /> {sending === c.id ? "Enviando..." : "Disparar"}
                        </Button>
                      </>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-secondary/40 text-sm whitespace-pre-wrap line-clamp-3">{c.message}</div>

                {c.status === "sending" && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-primary font-bold flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" /> Entregando DMs...
                      </span>
                      <span className="font-black tabular-nums">
                        {c.total_delivered.toLocaleString("pt-BR")} / {c.target_count.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-500"
                        style={{ width: `${Math.min(100, ((c.total_delivered + c.total_failed) / Math.max(1, c.target_count)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {c.status !== "draft" && (
                  <>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                      <div className="p-2.5 rounded-lg bg-secondary/30">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold flex items-center justify-center gap-1"><Users className="h-3 w-3" /> Alvo</div>
                        <div className="font-black mt-0.5">{c.total_targeted.toLocaleString("pt-BR")}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-success/10">
                        <div className="text-[10px] text-success uppercase font-bold">Entregues</div>
                        <div className="font-black text-success mt-0.5">{c.total_delivered.toLocaleString("pt-BR")}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <div className="text-[10px] text-primary uppercase font-bold flex items-center justify-center gap-1"><MousePointerClick className="h-3 w-3" /> CTR</div>
                        <div className="font-black text-primary mt-0.5">{ctr}% <span className="text-[10px] text-muted-foreground font-normal">({c.total_clicks})</span></div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-destructive/10">
                        <div className="text-[10px] text-destructive uppercase font-bold">Falhas</div>
                        <div className="font-black text-destructive mt-0.5">{c.total_failed.toLocaleString("pt-BR")}</div>
                        {c.credits_spent > 0 && <div className="text-[9px] text-muted-foreground mt-0.5">Custo: <b className="text-foreground">{c.credits_spent} DMs</b></div>}
                      </div>
                    </div>
                    {c.total_failed > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-1.5 rounded bg-destructive/5 flex items-center justify-center gap-1"><Ban className="h-3 w-3 text-destructive" /><span className="text-muted-foreground">Bloq:</span> <b>{c.failed_blocked}</b></div>
                        <div className="p-1.5 rounded bg-warning/5 flex items-center justify-center gap-1"><MailX className="h-3 w-3" /><span className="text-muted-foreground">DM fechada:</span> <b>{c.failed_dm_closed}</b></div>
                        <div className="p-1.5 rounded bg-secondary/30 flex items-center justify-center gap-1"><UserX className="h-3 w-3" /><span className="text-muted-foreground">Outros:</span> <b>{c.failed_deleted + c.failed_other}</b></div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Campaigns;
