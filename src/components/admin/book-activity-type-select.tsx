"use client";

import { useEffect, useState } from "react";
import { ListTree, LoaderCircle } from "lucide-react";
import { AdminSelect } from "./admin-select";

type ActivityType = { id: string; name: string; badge: string; language: "FR" | "EN" };

export function BookActivityTypeSelect({ language, value, onChange, filter = false, compact = false }: {
  language?: string;
  value: string;
  onChange: (value: string) => void;
  filter?: boolean;
  compact?: boolean;
}) {
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetch("/api/admin/activity-types", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Types unavailable");
        return response.json() as Promise<{ items: ActivityType[] }>;
      })
      .then(data => setTypes(data.items))
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  const available = types.filter(type => !language || type.language === language);
  return <div className="min-w-0">
    {!filter && <input type="hidden" name="activityTypeId" value={value}/>}
    {loading ? <p role="status" className="flex min-h-14 items-center gap-2 rounded-2xl border px-4 text-sm text-foreground/60"><LoaderCircle size={17} className="animate-spin"/>Chargement des types…</p>
      : error ? <div role="alert" className="rounded-2xl border border-rose-300 p-3 text-sm text-rose-700 dark:border-rose-400/30 dark:text-rose-300">Impossible de charger les types. <button type="button" className="font-bold underline" onClick={() => setAttempt(current => current + 1)}>Réessayer</button></div>
      : <>
        <AdminSelect label={filter || compact ? "Type d’activité" : "Type d’activité (facultatif)"} icon={<ListTree size={18}/>} value={value} onChange={onChange}
          options={[
            { value: "", label: filter ? "Tous les types" : "Sans type" },
            ...(filter ? [{ value: "__none__", label: "Sans type" }] : []),
            ...available.map(type => ({ value: type.id, label: `${type.badge} ${type.name}${!language ? ` (${type.language})` : ""}` })),
          ]}/>
        {!filter && available.length === 0 && <p className="mt-2 text-xs text-foreground/60">Aucun type dans cette langue. Ajoutez-en dans Organisation → Types d’activités.</p>}
      </>}
  </div>;
}
