"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, ExternalLink, Grid2X2, List, Pencil, Plus } from "lucide-react";

import { useUserProfile } from "@/components/providers/user-profile-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/hooks/use-locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Shortcut = {
  id: string;
  title: string;
  titleAr: string;
  description?: string | null;
  descriptionAr?: string | null;
  url: string;
  displayOrder: number;
  isActive: boolean;
};

const emptyForm = {
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  url: "https://",
  displayOrder: "0",
};

export function ExternalShortcuts() {
  const { t, dir } = useLocale();
  const { user } = useUserProfile();
  const { toast } = useToast();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [view, setView] = useState<"cards" | "list">("cards");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canManage = useMemo(
    () => user?.roles.some((role) => ["owner", "responsible", "admin"].includes(role.name)) ?? false,
    [user?.roles],
  );
  const isArabic = dir === "rtl";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shortcuts${canManage ? "?includeInactive=true" : ""}`);
      if (!response.ok) throw new Error("Shortcut loading failed");
      setShortcuts(await response.json());
    } catch (error) {
      toast({
        title: t("shortcuts.loadError"),
        description: t("common.requestFailed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [canManage, t, toast]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const edit = (shortcut: Shortcut) => {
    setEditingId(shortcut.id);
    setForm({
      title: shortcut.title,
      titleAr: shortcut.titleAr,
      description: shortcut.description ?? "",
      descriptionAr: shortcut.descriptionAr ?? "",
      url: shortcut.url,
      displayOrder: String(shortcut.displayOrder),
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/shortcuts/${editingId}` : "/api/shortcuts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            description: form.description || null,
            descriptionAr: form.descriptionAr || null,
            displayOrder: Number(form.displayOrder),
          }),
        },
      );
      if (!response.ok) {
        throw new Error(t("common.requestFailed"));
      }
      toast({ title: t("shortcuts.saved") });
      resetForm();
      await load();
    } catch (error) {
      toast({
        title: t("shortcuts.saveError"),
        description: error instanceof Error ? error.message : t("common.requestFailed"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const archive = async (shortcut: Shortcut) => {
    if (!window.confirm(t("shortcuts.archiveConfirm"))) return;
    const response = await fetch(`/api/shortcuts/${shortcut.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast({ title: t("shortcuts.saveError"), variant: "destructive" });
      return;
    }
    await load();
  };

  return (
    <div className="space-y-6" dir={dir}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t("shortcuts.title")}</h1>
          <p className="text-muted-foreground">{t("shortcuts.subtitle")}</p>
        </div>
        <div className="flex gap-2" role="group" aria-label={t("shortcuts.viewMode")}>
          <Button variant={view === "cards" ? "default" : "outline"} size="icon" onClick={() => setView("cards")} aria-label={t("shortcuts.cardsView")} aria-pressed={view === "cards"}>
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button variant={view === "list" ? "default" : "outline"} size="icon" onClick={() => setView("list")} aria-label={t("shortcuts.listView")} aria-pressed={view === "list"}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {canManage ? (
        <Card>
          <CardHeader><CardTitle>{editingId ? t("shortcuts.edit") : t("shortcuts.add")}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t("shortcuts.titleFr")} aria-label={t("shortcuts.titleFr")} />
            <Input value={form.titleAr} onChange={(event) => setForm({ ...form, titleAr: event.target.value })} placeholder={t("shortcuts.titleAr")} aria-label={t("shortcuts.titleAr")} dir="rtl" />
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t("shortcuts.descriptionFr")} aria-label={t("shortcuts.descriptionFr")} />
            <Textarea value={form.descriptionAr} onChange={(event) => setForm({ ...form, descriptionAr: event.target.value })} placeholder={t("shortcuts.descriptionAr")} aria-label={t("shortcuts.descriptionAr")} dir="rtl" />
            <Input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://" aria-label={t("shortcuts.url")} />
            <Input type="number" min={0} max={10000} value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} aria-label={t("shortcuts.order")} />
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={save} disabled={saving || !form.title || !form.titleAr || !form.url}>
                <Plus className="mr-2 h-4 w-4" />{saving ? t("shortcuts.saving") : t("shortcuts.save")}
              </Button>
              {editingId ? <Button variant="outline" onClick={resetForm}>{t("shortcuts.cancel")}</Button> : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loading ? <p>{t("shortcuts.loading")}</p> : shortcuts.length ? (
        <div className={cn(view === "cards" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3")}>
          {shortcuts.map((shortcut) => (
            <Card key={shortcut.id} className={cn(!shortcut.isActive && "opacity-60")}>
              <CardContent className="flex h-full flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{isArabic ? shortcut.titleAr : shortcut.title}</h2>
                    {!shortcut.isActive ? <Badge variant="secondary">{t("shortcuts.inactive")}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{isArabic ? shortcut.descriptionAr : shortcut.description}</p>
                </div>
                <div className="flex gap-2">
                  {shortcut.isActive ? (
                    <Button asChild>
                      <a href={shortcut.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />{t("shortcuts.open")}
                      </a>
                    </Button>
                  ) : null}
                  {canManage ? (
                    <>
                      <Button variant="outline" size="icon" onClick={() => edit(shortcut)} aria-label={t("shortcuts.edit")}><Pencil className="h-4 w-4" /></Button>
                      {shortcut.isActive ? <Button variant="outline" size="icon" onClick={() => archive(shortcut)} aria-label={t("shortcuts.archive")}><Archive className="h-4 w-4" /></Button> : null}
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <p className="rounded-md border p-6 text-center text-muted-foreground">{t("shortcuts.empty")}</p>}
    </div>
  );
}
