import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  ImageIcon, Loader2, Send, Save, X, Users, Coins, ExternalLink, Target,
  Sparkles, ChevronDown, ChevronUp, Check, FlaskConical, Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_GROUPS, dmsToCoins, findNiche, findGroupOfNiche } from "@/lib/ads";

const COLORS = ["#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245", "#9B59B6", "#F47B67", "#00D9FF"];

const NewCampaign = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = !!editId;
  const { user } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();

  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buttonLabel, setButtonLabel] = useState("Acessar agora");
  const [buttonUrl, setButtonUrl] = useState("");
  const [color, setColor] = useState("#5865F2");
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ stores: true });
  const [targetCount, setTargetCount] = useState(500);
  const [maxReach, setMaxReach] = useState(0);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);

  // Carrega campanha em modo edição
  useEffect(() => {
    if (!isEdit || !user) return;
    (async () => {
      const { data, error } = await supabase.from("campaigns").select("*").eq("id", editId).eq("user_id", user.id).single();
      if (error || !data) { toast.error("Campanha não encontrada"); navigate("/app/campanhas"); return; }
      if (data.status !== "draft") { toast.error("Só rascunhos podem ser editados"); navigate("/app/campanhas"); return; }
      setName(data.name || "");
      setTitle(data.title || "");
      setMessage(data.message || "");
      setImageUrl(data.image_url || "");
      setColor(data.embed_color || "#5865F2");
      setButtonLabel(data.button_label || "Acessar agora");
      setButtonUrl(data.button_url || "");
      setSelectedNiches((data as any).target_niches || []);
      setTargetCount(data.target_count || 500);
      // Abrir grupos que contenham nichos selecionados
      const groups: Record<string, boolean> = {};
      ((data as any).target_niches || []).forEach((n: string) => {
        const g = findGroupOfNiche(n);
        if (g) groups[g.id] = true;
      });
      setOpenGroups((s) => ({ ...s, ...groups }));
      setLoadingEdit(false);
    })();
  }, [editId, isEdit, user]);

  // Calcula alcance disponível pros nichos selecionados
  useEffect(() => {
    let q = supabase.from("discord_servers").select("member_count, niche").eq("bot_in_server", true);
    q.then(({ data }) => {
      const filtered = (data ?? []).filter((s: any) =>
        selectedNiches.length === 0 ? true : selectedNiches.includes(s.niche)
      );
      const total = filtered.reduce((sum, x: any) => sum + (x.member_count || 0), 0);
      setMaxReach(total);
    });
  }, [selectedNiches]);

  const cost = useMemo(() => dmsToCoins(targetCount), [targetCount]);
  const myCoins = profile?.credits ?? 0;
  const maxByCoins = myCoins * 10;
  const sliderMax = Math.max(10, Math.min(maxReach || 10000, maxByCoins || 10000, 100000));

  const toggleNiche = (val: string) => {
    setSelectedNiches((s) => (s.includes(val) ? s.filter((x) => x !== val) : [...s, val]));
  };
  const toggleGroup = (id: string) => setOpenGroups((s) => ({ ...s, [id]: !s[id] }));
  const selectAllInGroup = (groupId: string) => {
    const grp = CATEGORY_GROUPS.find((g) => g.id === groupId);
    if (!grp) return;
    const vals = grp.niches.map((n) => n.value);
    const allIn = vals.every((v) => selectedNiches.includes(v));
    setSelectedNiches((s) =>
      allIn ? s.filter((x) => !vals.includes(x)) : [...new Set([...s, ...vals])]
    );
  };

  const uploadImage = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("campaign-images").upload(path, file, { upsert: false });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data: pub } = supabase.storage.from("campaign-images").getPublicUrl(path);
    setImageUrl(pub.publicUrl);
    setUploading(false);
    toast.success("Imagem enviada!");
  };

  const validateUrl = (url: string) => { try { new URL(url); return true; } catch { return false; } };

  const sendTest = async () => {
    if (!message.trim()) return toast.error("Escreva a mensagem antes de testar");
    if (!profile?.discord_id) return toast.error("Conecte sua conta Discord primeiro");
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("test-campaign", {
      body: { title, message, image_url: imageUrl || null, embed_color: color, button_label: buttonUrl ? buttonLabel : null, button_url: buttonUrl || null },
    });
    setTesting(false);
    if (error || data?.error) return toast.error("Falha: " + (data?.error || error?.message));
    toast.success(`✅ Teste enviado pra DM de @${data.sent_to}! Confira no Discord.`);
  };

  const save = async (action: "draft" | "send") => {
    if (!user || !profile) return;
    if (!name.trim()) return toast.error("Dê um nome interno à campanha");
    if (!title.trim()) return toast.error("Coloque um título");
    if (!message.trim()) return toast.error("Escreva a mensagem");
    if (buttonUrl && !validateUrl(buttonUrl)) return toast.error("URL do botão inválida");
    if (action === "send" && selectedNiches.length === 0) return toast.error("Selecione ao menos 1 nicho de público");
    if (action === "send" && myCoins < cost) return toast.error(`Você precisa de ${cost} coins, tem apenas ${myCoins}`);

    setBusy(true);
    const payload = {
      user_id: user.id, name, title, message,
      image_url: imageUrl || null, embed_color: color,
      button_label: buttonUrl ? buttonLabel : null,
      button_url: buttonUrl || null,
      target_count: targetCount,
      target_niches: selectedNiches,
      status: "draft" as const,
    };

    let campaignId = editId;
    if (isEdit) {
      const { error } = await supabase.from("campaigns").update(payload).eq("id", editId!);
      if (error) { setBusy(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("campaigns").insert(payload).select().single();
      if (error || !data) { setBusy(false); return toast.error(error?.message ?? "Erro"); }
      campaignId = data.id;
    }

    if (action === "send") {
      const { data: sd, error: se } = await supabase.functions.invoke("send-campaign", { body: { campaign_id: campaignId } });
      let errMsg = sd?.error || se?.message;
      if (se && (se as any).context && typeof (se as any).context.json === "function") {
        try { const j = await (se as any).context.json(); errMsg = j?.error || errMsg; } catch {}
      }
      if (errMsg) { setBusy(false); toast.error(errMsg, { duration: 8000 }); return; }
      toast.success(`🚀 Campanha disparada! Entregue pra ${sd.delivered} pessoas.`);
      refreshProfile();
    } else {
      toast.success(isEdit ? "Rascunho atualizado" : "Rascunho salvo");
    }
    navigate("/app/campanhas");
  };

  const previewName = profile?.discord_username || "Anúncio";
  const previewAvatar = profile?.avatar_url;

  if (loadingEdit) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid lg:grid-cols-[1fr,440px] gap-6 max-w-[1400px]">
      {/* COLUNA ESQUERDA — formulário */}
      <div className="space-y-5">
        {/* HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              {isEdit ? "Editar campanha" : "Criar nova campanha"}
            </h1>
            <p className="text-sm text-muted-foreground">Defina seu público, escreva o anúncio e dispare.</p>
          </div>
        </div>

        {/* PÚBLICO — multi-seleção estilo Meta Ads */}
        <div className="rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border p-5 space-y-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center"><Target className="h-4 w-4 text-primary" /></div>
              <div>
                <div className="text-sm">Público-alvo</div>
                <div className="text-[11px] text-muted-foreground font-normal">Escolha 1 ou mais nichos</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Selecionados</div>
              <div className="font-black text-lg">{selectedNiches.length}</div>
            </div>
          </div>

          <div className="space-y-2">
            {CATEGORY_GROUPS.map((g) => {
              const isOpen = openGroups[g.id];
              const selectedInGroup = g.niches.filter((n) => selectedNiches.includes(n.value)).length;
              const allSelected = selectedInGroup === g.niches.length;
              return (
                <div key={g.id} className={`rounded-xl border bg-gradient-to-br ${g.color} overflow-hidden transition-all`}>
                  <button type="button" onClick={() => toggleGroup(g.id)} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition">
                    <span className="text-2xl">{g.emoji}</span>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-bold text-sm">{g.label}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{g.description}</div>
                    </div>
                    {selectedInGroup > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                        {selectedInGroup}/{g.niches.length}
                      </span>
                    )}
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {isOpen && (
                    <div className="p-3 pt-0 space-y-2">
                      <button type="button" onClick={() => selectAllInGroup(g.id)}
                        className="text-[10px] uppercase tracking-wider font-bold text-primary hover:underline">
                        {allSelected ? "Desmarcar todos" : "Marcar todos"}
                      </button>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {g.niches.map((n) => {
                          const sel = selectedNiches.includes(n.value);
                          return (
                            <button key={n.value} type="button" onClick={() => toggleNiche(n.value)}
                              className={`relative px-2.5 py-2 rounded-lg text-left transition border-2 ${
                                sel ? "border-primary bg-primary/15 shadow-glow" : "border-border/50 bg-background/40 hover:border-primary/40"
                              }`}>
                              {sel && <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary grid place-items-center"><Check className="h-2.5 w-2.5 text-primary-foreground" /></div>}
                              <div className="flex items-center gap-1.5 mb-0.5"><span className="text-base leading-none">{n.emoji}</span><span className="font-bold text-[11px] leading-tight">{n.label}</span></div>
                              {n.description && <div className="text-[9px] text-muted-foreground leading-tight">{n.description}</div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ORÇAMENTO */}
        <div className="rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border p-5 space-y-4 shadow-card">
          <div className="flex items-center gap-2 font-bold">
            <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center"><Coins className="h-4 w-4 text-primary" /></div>
            <div>
              <div className="text-sm">Orçamento & alcance</div>
              <div className="text-[11px] text-muted-foreground font-normal">1 coin = 10 pessoas alcançadas</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quantas pessoas alcançar</Label>
              <span className="text-[10px] text-muted-foreground">Máx disponível: {maxReach.toLocaleString("pt-BR")}</span>
            </div>
            <div className="relative">
              <Input type="number" min={10} max={sliderMax} step={10} value={targetCount}
                onChange={(e) => setTargetCount(Math.max(10, Math.min(sliderMax, parseInt(e.target.value) || 10)))}
                className="text-3xl font-black h-16 text-center bg-background/50" />
              <Users className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <Slider min={10} max={sliderMax} step={10} value={[targetCount]} onValueChange={([v]) => setTargetCount(v)} className="mt-4" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
              <span>10</span>
              <span>{sliderMax.toLocaleString("pt-BR")}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
            <div className="p-2 rounded-lg bg-primary/10">
              <div className="text-[9px] text-muted-foreground uppercase">Custo</div>
              <div className="font-black text-lg flex items-center gap-1"><Coins className="h-4 w-4 text-primary" />{cost}</div>
            </div>
            <div className="p-2 rounded-lg bg-secondary/40">
              <div className="text-[9px] text-muted-foreground uppercase">Saldo</div>
              <div className={`font-black text-lg ${myCoins >= cost ? "" : "text-destructive"}`}>{myCoins}</div>
            </div>
            <div className="p-2 rounded-lg bg-success/10">
              <div className="text-[9px] text-muted-foreground uppercase">Após</div>
              <div className="font-black text-lg text-success">{Math.max(0, myCoins - cost)}</div>
            </div>
          </div>
        </div>

        {/* CRIATIVO */}
        <div className="rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border p-5 space-y-4 shadow-card">
          <div className="flex items-center gap-2 font-bold">
            <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center"><Wand2 className="h-4 w-4 text-primary" /></div>
            <div>
              <div className="text-sm">Criativo do anúncio</div>
              <div className="text-[11px] text-muted-foreground font-normal">A mensagem que será enviada</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name" className="text-xs">Nome interno</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Promo de inverno" className="mt-1.5" maxLength={100} />
            </div>
            <div>
              <Label htmlFor="title" className="text-xs">Título do anúncio</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="🎉 Oferta imperdível!" className="mt-1.5" maxLength={120} />
            </div>
          </div>

          <div>
            <Label htmlFor="message" className="text-xs">Mensagem</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Suporta **negrito**, *itálico*, emojis 🎉, e quebras de linha." className="mt-1.5 min-h-[140px] font-mono text-sm" maxLength={2000} />
            <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/2000</p>
          </div>

          <div>
            <Label className="text-xs">Imagem (opcional)</Label>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/70 text-sm font-medium transition">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  {uploading ? "Enviando..." : imageUrl ? "Trocar imagem" : "Adicionar imagem"}
                </div>
              </label>
              {imageUrl && <Button type="button" size="sm" variant="ghost" onClick={() => setImageUrl("")} className="gap-1"><X className="h-3 w-3" /> Remover</Button>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bl" className="text-xs">Texto do botão</Label>
              <Input id="bl" value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} placeholder="Acessar" className="mt-1.5" maxLength={80} />
            </div>
            <div>
              <Label htmlFor="bu" className="text-xs">URL do botão</Label>
              <Input id="bu" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="https://..." className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Cor da borda</Label>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`h-9 w-9 rounded-lg border-2 transition relative ${color === c ? "border-foreground scale-110 shadow-glow" : "border-transparent hover:scale-105"}`}
                  style={{ backgroundColor: c }}>
                  {color === c && <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AÇÕES */}
        <div className="sticky bottom-2 z-10 rounded-2xl bg-gradient-to-r from-card to-card/80 backdrop-blur border border-border p-3 shadow-card">
          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant="outline" onClick={sendTest} disabled={testing || !message.trim()} className="gap-2 flex-1 min-w-[140px]">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
              Testar na minha DM
            </Button>
            <Button type="button" variant="secondary" onClick={() => save("draft")} disabled={busy} className="gap-2 flex-1 min-w-[120px]">
              <Save className="h-4 w-4" /> Rascunho
            </Button>
            <Button type="button" variant="discord" onClick={() => save("send")} disabled={busy} className="gap-2 flex-1 min-w-[160px]">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Disparar agora
            </Button>
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA — preview sticky */}
      <div className="lg:sticky lg:top-4 self-start space-y-3 max-h-[calc(100vh-2rem)] overflow-y-auto pr-1">
        {/* Resumo */}
        <div className="rounded-xl bg-gradient-to-br from-primary/15 to-primary-glow/10 border border-primary/30 p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Resumo do anúncio</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="text-[9px] text-muted-foreground uppercase">Nichos</div><div className="font-black text-base">{selectedNiches.length}</div></div>
            <div><div className="text-[9px] text-muted-foreground uppercase">Alcance</div><div className="font-black text-base flex items-center justify-center gap-0.5"><Users className="h-3 w-3" />{targetCount.toLocaleString("pt-BR")}</div></div>
            <div><div className="text-[9px] text-muted-foreground uppercase">Custo</div><div className="font-black text-base flex items-center justify-center gap-0.5"><Coins className="h-3 w-3 text-primary" />{cost}</div></div>
          </div>
          {selectedNiches.length > 0 && (
            <div className="mt-2 pt-2 border-t border-primary/20 flex flex-wrap gap-1">
              {selectedNiches.slice(0, 8).map((v) => {
                const n = findNiche(v);
                if (!n) return null;
                return <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-background/60">{n.emoji} {n.label}</span>;
              })}
              {selectedNiches.length > 8 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/60">+{selectedNiches.length - 8}</span>}
            </div>
          )}
        </div>

        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Preview da DM</div>
        <div className="rounded-xl bg-[#313338] border border-[#1e1f22] p-4 shadow-2xl">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#3f4147]">
            <span className="text-[#80848e] text-[10px] uppercase tracking-wider">Mensagem direta</span>
          </div>
          <div className="flex gap-3">
            {previewAvatar ? (
              <img src={previewAvatar} className="h-10 w-10 rounded-full shrink-0" alt="" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-glow grid place-items-center text-white font-bold text-sm shrink-0">B</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-white font-semibold text-[15px]">{previewName}</span>
                <span className="px-1.5 py-0.5 rounded bg-[#5865F2] text-white text-[10px] font-bold leading-none">APP</span>
                <span className="text-[#949ba4] text-xs">hoje</span>
              </div>
              <div className="mt-1.5 flex">
                <div className="w-1 rounded-l" style={{ backgroundColor: color }} />
                <div className="bg-[#2b2d31] rounded-r p-3 flex-1 min-w-0">
                  {title && <div className="text-white font-bold text-base mb-1.5 break-words">{title}</div>}
                  <div className="text-[#dbdee1] text-sm whitespace-pre-wrap break-words">
                    {message || <span className="text-[#80848e] italic">Sua mensagem aparecerá aqui...</span>}
                  </div>
                  {imageUrl && <img src={imageUrl} className="mt-2 rounded max-w-full max-h-72 object-contain" alt="" />}
                  {buttonUrl && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#4e5058] hover:bg-[#6d6f78] text-white text-sm font-medium cursor-pointer">
                        <ExternalLink className="h-3.5 w-3.5" /> {buttonLabel || "Acessar"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={sendTest} disabled={testing || !message.trim()} className="w-full gap-2">
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
          Receber teste no Discord
        </Button>
      </div>
    </div>
  );
};

export default NewCampaign;
