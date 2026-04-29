import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Plus, Send, Trash2, CheckCircle2, XCircle, Clock, Users, MousePointerClick, Loader2, Ban, MailX, UserX } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES } from "@/lib/ads";

type Campaign = {
  id: string; name: string; title: string; message: string; image_url: string | null;
  status: string; sent_at: string | null;
  target_count: number; target_category: string;
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

  const send = async (id: string) => {
    setSending(id);
    const { data, error } = await supabase.functions.invoke("send-campaign", { body: { campaign_id: id } });
    setSending(null);
    if (error || data?.error) { toast.error("Falha: " + (data?.error || error?.message)); load(); return; }
    toast.success(`Disparada! ${data.delivered} entregues.`);
    refreshProfile();
    load();
  };

  const remove = async (id: string) => {
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
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}><I className={`h-3 w-3 ${status === "sending" ? "animate-spin" : ""}`} />{m.label}</span>;
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Campanhas</h2>
          <p className="text-sm text-muted-foreground">Anúncios disparados via DM.</p>
        </div>
        <Link to="/app/campanhas/nova"><Button variant="discord" className="gap-2"><Plus className="h-4 w-4" /> Nova</Button></Link>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">Nenhuma campanha ainda.</p>
          <Link to="/app/campanhas/nova"><Button variant="discord" className="mt-4 gap-2"><Plus className="h-4 w-4" /> Criar a primeira</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const ctr = c.total_delivered > 0 ? ((c.total_clicks / c.total_delivered) * 100).toFixed(1) : "0.0";
            const cat = CATEGORIES.find((x) => x.value === c.target_category) ?? CATEGORIES[0];
            return (
              <div key={c.id} className="rounded-xl bg-card border border-border p-4 md:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold">{c.name}</h3>
                      <StatusBadge status={c.status} />
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{cat.emoji} {cat.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">🎯 {c.target_count}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.title || "(sem título)"}</div>
                  </div>
                  <div className="flex gap-2">
                    {c.status === "draft" && (
                      <Button size="sm" variant="discord" disabled={sending === c.id} onClick={() => send(c.id)} className="gap-1.5">
                        <Send className="h-3.5 w-3.5" /> {sending === c.id ? "Enviando..." : "Disparar"}
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-secondary/40 text-sm whitespace-pre-wrap line-clamp-3">{c.message}</div>

                {c.status !== "draft" && (
                  <>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-secondary/30">
                        <div className="text-[10px] text-muted-foreground uppercase flex items-center justify-center gap-1"><Users className="h-3 w-3" /> Alvo</div>
                        <div className="font-bold">{c.total_targeted}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-success/10">
                        <div className="text-[10px] text-success uppercase">Entregues</div>
                        <div className="font-bold text-success">{c.total_delivered}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10">
                        <div className="text-[10px] text-primary uppercase flex items-center justify-center gap-1"><MousePointerClick className="h-3 w-3" /> Cliques</div>
                        <div className="font-bold text-primary">{c.total_clicks} <span className="text-[10px] text-muted-foreground">({ctr}%)</span></div>
                      </div>
                      <div className="p-2 rounded-lg bg-destructive/10">
                        <div className="text-[10px] text-destructive uppercase">Falhas</div>
                        <div className="font-bold text-destructive">{c.total_failed}</div>
                      </div>
                    </div>
                    {c.total_failed > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-1.5 rounded bg-destructive/5 flex items-center justify-center gap-1"><Ban className="h-3 w-3 text-destructive" /><span className="text-muted-foreground">Bloqueado:</span> <b>{c.failed_blocked}</b></div>
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
