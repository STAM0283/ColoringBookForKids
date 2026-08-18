"use client";

const badgeChoices = ["🎨", "✏️", "🖍️", "🌈", "🔤", "🔢", "🧩", "🔎", "🐶", "🦁", "🦋", "🌳", "⭐", "🚀", "🎄", "🐣", "🏖️", "🎃"];

export function CategoryBadgePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <fieldset><legend className="text-sm font-black">Choisir un badge</legend><p className="mt-1 text-xs text-slate-500">Cliquez sur une illustration pour la sélectionner.</p><div className="mt-3 grid grid-cols-6 gap-2 rounded-2xl border bg-slate-50 p-3 sm:grid-cols-9">{badgeChoices.map(badge => <button key={badge} type="button" aria-label={`Choisir le badge ${badge}`} aria-pressed={value === badge} onClick={() => onChange(badge)} className={`grid aspect-square place-items-center rounded-xl border bg-white text-2xl transition hover:-translate-y-0.5 hover:shadow-md ${value === badge ? "border-emerald-600 ring-2 ring-emerald-200" : "border-slate-200"}`}>{badge}</button>)}</div><label className="mt-3 block text-xs font-bold text-slate-600">Autre emoji<input maxLength={12} value={badgeChoices.includes(value) ? "" : value} onChange={event => onChange(event.target.value)} placeholder="Collez un autre emoji" className="mt-2 min-h-11 w-full rounded-xl border bg-white px-4 text-lg"/></label></fieldset>;
}
