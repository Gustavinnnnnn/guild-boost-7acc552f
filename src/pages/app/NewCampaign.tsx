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
  Check, FlaskConical, Wand2, ChevronLeft, ChevronRight, Eye, Upload, Search,
  Server, ShieldCheck, Radar, Link2,
} from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_GROUPS, dmsToCoins, coinsToDms, findNiche, findGroupOfNiche, formatCoins } from "@/lib/ads";

type RivalServer = {
  id: string;
  name: string;
  icon_url: string | null;
  banner_url?: string | null;
  description: string | null;
  approximate_member_count: number;
  approximate_presence_count: number;
  invite_code: string;
};

const COLORS = ["#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245", "#9B59B6", "#F47B67", "#00D9FF"];

const STEPS = [
  { id: 1, label: "Conteúdo", icon: Wand2 },
  { id: 2, label: "Público", icon: Target },
  { id: 3, label: "Revisar", icon: Eye },
];

const NewCampaign = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = !!editId;
  const { user } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();

  const [step, setStep] = useState(1);
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
  const [nicheSearch, setNicheSearch] = useState("");
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
      setLoadingEdit(false);
    })();
  }, [editId, isEdit, user]);

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
  const maxByCoins = coinsToDms(myCoins);
  const sliderMax = Math.max(10, Math.min(maxReach || 10000, maxByCoins || 10000, 100000));

  const toggleNiche = (val: string) => {
    setSelectedNiches((s) => (s.includes(val) ? s.filter((x) => x !== val) : [...s, val]));
  };

  const filteredGroups = useMemo(() => {
    if (!nicheSearch.trim()) return CATEGORY_GROUPS;
    const q = nicheSearch.toLowerCase();
    return CATEGORY_GROUPS.map((g) => ({
      ...g,
      niches: g.niches.filter((n) => n.label.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q)),
    })).filter((g) => g.niches.length > 0);
  }, [nicheSearch]);

  const uploadImage = async (file: File) => {
    if (!user) return;
    if (file.size > 8 * 1024 * 1024) return toast.error("Imagem muito grande (máx 8MB)");
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
    toast.success(`✅ Teste enviado pra DM de @${data.sent_to}!`);
  };

  const validateStep1 = () => {
    if (!name.trim()) { toast.error("Dê um nome interno à campanha"); return false; }
    if (!title.trim()) { toast.error("Coloque um título"); return false; }
    if (!message.trim()) { toast.error("Escreva a mensagem"); return false; }
    if (buttonUrl && !validateUrl(buttonUrl)) { toast.error("URL do botão inválida"); return false; }
    return true;
  };
  const validateStep2 = () => {
    if (selectedNiches.length === 0) { toast.error("Selecione ao menos 1 nicho"); return false; }
    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const save = async (action: "draft" | "send") => {
    if (!user || !profile) return;
    if (!validateStep1()) return;
    if (action === "send" && !validateStep2()) return;
    if (action === "send" && myCoins < cost) return toast.error(`Você precisa de ${cost} DMs, tem apenas ${myCoins}`);

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
    <div className="grid lg:grid-cols-[1fr,420px] gap-4 md:gap-6 max-w-[1400px]">
      <div className="space-y-5 min-w-0">
        {/* HEADER + STEPPER */}
        <div>
          <h1 className="text-xl md:text-2xl font-black mb-1">{isEdit ? "Editar campanha" : "Criar nova campanha"}</h1>
          <p className="text-sm text-muted-foreground mb-4">Siga as 3 etapas pra disparar sua divulgação.</p>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              const done = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => (s.id < step || (s.id === 2 && validateStep1())) && setStep(s.id)}
                    className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl border-2 transition flex-1 min-w-0 ${
                      active ? "border-primary bg-primary/10 shadow-glow"
                      : done ? "border-success/40 bg-success/5"
                      : "border-border bg-card hover:border-border/80"
                    }`}
                  >
                    <div className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 ${
                      active ? "bg-primary text-primary-foreground"
                      : done ? "bg-success text-white"
                      : "bg-secondary text-muted-foreground"
                    }`}>
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="text-left min-w-0 hidden sm:block">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Etapa {s.id}</div>
                      <div className="text-sm font-bold truncate">{s.label}</div>
                    </div>
                    <div className="text-xs font-bold sm:hidden truncate">{s.label}</div>
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1 — CONTEÚDO */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
              <h2 className="font-bold flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> Identificação</h2>
              <div>
                <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Nome interno (só você vê)</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Promo Black Friday" className="mt-1.5" maxLength={100} />
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
              <h2 className="font-bold flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Conteúdo da DM</h2>

              <div>
                <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">Título (chamada principal)</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="🎉 Oferta imperdível!" className="mt-1.5 text-base font-semibold" maxLength={120} />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{title.length}/120</p>
              </div>

              <div>
                <Label htmlFor="message" className="text-xs uppercase tracking-wider text-muted-foreground">Mensagem (corpo)</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva aqui... Suporta **negrito**, *itálico* e emojis 🚀"
                  className="mt-1.5 min-h-[160px] font-mono text-sm" maxLength={2000} />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{message.length}/2000</p>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Imagem (opcional)</Label>
                {imageUrl ? (
                  <div className="mt-1.5 relative inline-block">
                    <img src={imageUrl} alt="Preview" className="rounded-lg max-h-48 border-2 border-border" />
                    <button type="button" onClick={() => setImageUrl("")}
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-white grid place-items-center shadow-lg hover:scale-110 transition">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-1.5 cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/60 hover:bg-primary/5 transition">
                    <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
                    {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                    <div className="text-sm font-semibold">{uploading ? "Enviando..." : "Clique pra adicionar imagem"}</div>
                    <div className="text-[10px] text-muted-foreground">PNG, JPG, GIF · até 8MB</div>
                  </label>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
              <h2 className="font-bold flex items-center gap-2"><ExternalLink className="h-4 w-4 text-primary" /> Botão de ação (opcional)</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bl" className="text-xs uppercase tracking-wider text-muted-foreground">Texto</Label>
                  <Input id="bl" value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} placeholder="Acessar agora" className="mt-1.5" maxLength={80} />
                </div>
                <div>
                  <Label htmlFor="bu" className="text-xs uppercase tracking-wider text-muted-foreground">Link</Label>
                  <Input id="bu" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="https://..." className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cor do destaque</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`h-10 w-10 rounded-xl border-2 transition relative ${color === c ? "border-foreground scale-110 shadow-glow" : "border-transparent hover:scale-105"}`}
                      style={{ backgroundColor: c }}>
                      {color === c && <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — PÚBLICO */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Escolha o nicho</h2>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/15 font-bold text-primary">
                  {selectedNiches.length} selecionado{selectedNiches.length !== 1 && "s"}
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={nicheSearch} onChange={(e) => setNicheSearch(e.target.value)}
                  placeholder="Buscar nicho... (ex: valorant, anime, lojas)" className="pl-9" />
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {filteredGroups.map((g) => (
                  <div key={g.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{g.emoji}</span>
                      <h3 className="font-bold text-sm">{g.label}</h3>
                      <span className="text-[10px] text-muted-foreground">· {g.description}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {g.niches.map((n) => {
                        const sel = selectedNiches.includes(n.value);
                        return (
                          <button key={n.value} type="button" onClick={() => toggleNiche(n.value)}
                            className={`relative p-3 rounded-xl text-left transition border-2 ${
                              sel ? "border-primary bg-primary/15 shadow-glow" : "border-border bg-background/40 hover:border-primary/40"
                            }`}>
                            {sel && (
                              <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary grid place-items-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                            <div className="text-2xl mb-1">{n.emoji}</div>
                            <div className="font-bold text-xs leading-tight">{n.label}</div>
                            {n.description && <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{n.description}</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredGroups.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">Nenhum nicho encontrado pra "{nicheSearch}"</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary-glow/10 border border-primary/30 p-5 space-y-4">
              <h2 className="font-bold flex items-center gap-2"><Coins className="h-4 w-4 text-primary" /> Quantas DMs disparar?</h2>
              <div className="relative">
                <Input type="number" min={10} max={sliderMax} step={10} value={targetCount}
                  onChange={(e) => setTargetCount(Math.max(10, Math.min(sliderMax, parseInt(e.target.value) || 10)))}
                  className="text-3xl font-black h-16 text-center bg-background/60" />
                <Users className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              <Slider min={10} max={sliderMax} step={10} value={[targetCount]} onValueChange={([v]) => setTargetCount(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>10</span>
                <span>Máx alcance: {maxReach.toLocaleString("pt-BR")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-primary/20">
                <div className="p-2 rounded-lg bg-background/60 text-center">
                  <div className="text-[9px] text-muted-foreground uppercase">Custo</div>
                  <div className="font-black text-base flex items-center justify-center gap-1"><Coins className="h-3.5 w-3.5 text-primary" />{cost}</div>
                </div>
                <div className="p-2 rounded-lg bg-background/60 text-center">
                  <div className="text-[9px] text-muted-foreground uppercase">Saldo</div>
                  <div className={`font-black text-base ${myCoins >= cost ? "" : "text-destructive"}`}>{formatCoins(myCoins)}</div>
                </div>
                <div className="p-2 rounded-lg bg-background/60 text-center">
                  <div className="text-[9px] text-muted-foreground uppercase">Após</div>
                  <div className="font-black text-base text-success">{formatCoins(Math.max(0, myCoins - cost))}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — REVISAR */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
              <h2 className="font-bold flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Resumo final</h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Info label="Nome interno" value={name} />
                <Info label="Título" value={title} />
                <Info label="Nichos" value={`${selectedNiches.length} selecionado(s)`} />
                <Info label="Alcance" value={`${targetCount.toLocaleString("pt-BR")} pessoas`} />
                <Info label="Custo" value={`${cost} DMs`} />
                <Info label="Saldo após" value={formatCoins(Math.max(0, myCoins - cost))} />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
                {selectedNiches.map((v) => {
                  const n = findNiche(v);
                  if (!n) return null;
                  return <span key={v} className="text-[11px] px-2 py-1 rounded-md bg-primary/10 text-primary font-semibold">{n.emoji} {n.label}</span>;
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary-glow/10 border border-primary/30 p-4">
              <p className="text-sm">
                <b>Tudo certo?</b> Ao clicar em <b>Disparar agora</b>, vamos enviar pra <b>{targetCount.toLocaleString("pt-BR")}</b> pessoas
                gastando <b>{cost} DMs</b> do seu saldo. Essa ação não pode ser desfeita.
              </p>
            </div>
          </div>
        )}

        {/* NAV */}
        <div className="sticky bottom-2 z-10 rounded-2xl bg-card/95 backdrop-blur border border-border p-2.5 sm:p-3 shadow-card">
          <div className="flex flex-wrap gap-2">
            {step > 1 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setStep((s) => s - 1)} className="gap-1.5 sm:gap-2">
                <ChevronLeft className="h-4 w-4" /> <span className="hidden xs:inline">Voltar</span>
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => save("draft")} disabled={busy} className="gap-1.5 sm:gap-2">
              <Save className="h-4 w-4" /> <span className="hidden sm:inline">Salvar rascunho</span><span className="sm:hidden">Rascunho</span>
            </Button>
            <div className="flex-1" />
            {step < 3 ? (
              <Button type="button" variant="discord" size="sm" onClick={goNext} className="gap-1.5 sm:gap-2 ml-auto">
                Continuar <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" size="sm" onClick={sendTest} disabled={testing || !message.trim()} className="gap-1.5 sm:gap-2">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />} Testar
                </Button>
                <Button type="button" variant="discord" size="sm" onClick={() => save("send")} disabled={busy || myCoins < cost} className="gap-1.5 sm:gap-2">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} <span className="hidden sm:inline">Disparar agora</span><span className="sm:hidden">Disparar</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PREVIEW STICKY */}
      <div className="lg:sticky lg:top-4 self-start space-y-3">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Preview ao vivo</div>
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
      </div>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-secondary/40 p-3">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="font-bold truncate">{value || "—"}</div>
  </div>
);

export default NewCampaign;
