"use client";

import { useState } from "react";
import { SlidersHorizontal, Tags } from "lucide-react";
import { AdminSelect } from "./admin-select";
import { BookActivityTypeSelect } from "./book-activity-type-select";

type Props = {
  language: "FR" | "EN";
  categories: Array<{ id: string; name: string }>;
  activityTypeId: string;
  onActivityTypeChange: (value: string) => void;
  initialCategoryId?: string;
  ageMin?: number;
  ageMax?: number;
  pageCount?: number;
};

export function BookDetailsFields({
  language, categories, activityTypeId, onActivityTypeChange,
  initialCategoryId = "", ageMin = 3, ageMax = 8, pageCount = 40,
}: Props) {
  const [categoryId, setCategoryId] = useState(initialCategoryId);

  return <section aria-label="Public et classement du livre" className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/[.025] sm:p-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100">
        <SlidersHorizontal size={16} className="text-emerald-700 dark:text-emerald-300"/>
        Public & classement
      </h3>
      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Catégorie et type facultatifs</span>
    </div>
    <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.4fr)]">
      <div className="grid grid-cols-3 gap-2">
        <NumberField name="ageMin" label="Âge min." accessibleLabel="Âge minimum" unit="ans" value={ageMin} min={0} max={18}/>
        <NumberField name="ageMax" label="Âge max." accessibleLabel="Âge maximum" unit="ans" value={ageMax} min={0} max={18}/>
        <NumberField name="pageCount" label="Pages" accessibleLabel="Nombre de pages" value={pageCount} min={1} max={1000}/>
      </div>
      <div className="grid min-w-0 items-start gap-2 sm:grid-cols-2">
        <div className="min-w-0">
          <input type="hidden" name="categoryId" value={categoryId}/>
          <AdminSelect label="Catégorie" icon={<Tags size={16}/>} value={categoryId}
            options={[{ value: "", label: "Sans catégorie" }, ...categories.map(category => ({ value: category.id, label: category.name }))]}
            onChange={setCategoryId}/>
        </div>
        <BookActivityTypeSelect compact language={language} value={activityTypeId} onChange={onActivityTypeChange}/>
      </div>
    </div>
  </section>;
}

function NumberField({ name, label, accessibleLabel, unit, value, min, max }: {
  name: string; label: string; accessibleLabel: string; unit?: string; value: number; min: number; max: number;
}) {
  return <label className="book-number-field group relative flex min-h-14 min-w-0 flex-col justify-center rounded-2xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition-colors hover:border-emerald-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 dark:border-white/15 dark:bg-slate-950/45 dark:hover:border-emerald-400/40 dark:focus-within:border-emerald-400 motion-reduce:transition-none">
    <span aria-hidden="true" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}<span className="ml-0.5 text-rose-500">*</span></span>
    <span className="flex min-w-0 items-center gap-1">
      <input aria-label={accessibleLabel} name={name} type="number" min={min} max={max} defaultValue={value} required
        className="min-h-7 w-full min-w-0 border-0 bg-transparent p-0 text-base font-bold text-slate-900 outline-none focus:ring-0 dark:text-slate-50"/>
      {unit && <span aria-hidden="true" className="text-[11px] text-slate-400 dark:text-slate-500">{unit}</span>}
    </span>
  </label>;
}
