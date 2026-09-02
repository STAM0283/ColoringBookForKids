"use client";

import { Check, Eraser, ImageIcon, Redo2, RotateCcw, Undo2 } from "lucide-react";
import { ExportColoringButtons } from "./export-coloring-buttons";

type Props = {
  colors: string[];
  color: string;
  eraser: boolean;
  undoDisabled: boolean;
  redoDisabled: boolean;
  en: boolean;
  title: string;
  setColor: (color: string) => void;
  setEraser: (active: boolean) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  hasModel?: boolean;
  openModel?: () => void;
  getCanvas: () => Promise<HTMLCanvasElement | null> | HTMLCanvasElement | null;
};

export function MobileColoringToolbar(props: Props) {
  return <aside className="mobile-coloring-toolbar lg:hidden" aria-label={props.en ? "Colouring tools" : "Outils de coloriage"}>
    <div className="mobile-coloring-colors" aria-label={props.en ? "Colours" : "Couleurs"}>
      {props.colors.map(value => <button
        key={value}
        type="button"
        aria-label={`${props.en ? "Colour" : "Couleur"} ${value}`}
        aria-pressed={!props.eraser && props.color === value}
        onClick={() => { props.setColor(value); props.setEraser(false); }}
        className={`mobile-coloring-swatch grid shrink-0 snap-center place-items-center rounded-full border-2 shadow-sm transition active:scale-90 ${!props.eraser && props.color === value ? "border-foreground ring-4 ring-primary/35 dark:border-white" : "border-white/70 dark:border-white/20"}`}
        style={{ backgroundColor: value }}
      >{!props.eraser && props.color === value && <Check size={13} className={value === "#111827" ? "text-white" : "text-slate-950"}/>}</button>)}
    </div>
    <div className={`mobile-coloring-actions grid gap-1.5 ${props.hasModel?"grid-cols-7":"grid-cols-6"}`}>
      {props.hasModel&&<button type="button" aria-label={props.en ? "Open colour model" : "Ouvrir le modèle en couleur"} onClick={props.openModel} className="mobile-coloring-action bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/15 dark:text-emerald-300"><ImageIcon size={19}/><span className="sr-only">{props.en ? "Model" : "Modèle"}</span></button>}
      <button type="button" aria-label={props.en ? "Eraser" : "Gomme"} aria-pressed={props.eraser} onClick={() => props.setEraser(true)} className={`mobile-coloring-action ${props.eraser ? "bg-primary text-white" : ""}`}><Eraser size={19}/><span className="sr-only">{props.en ? "Erase" : "Gomme"}</span></button>
      <button type="button" aria-label={props.en ? "Undo" : "Annuler"} disabled={props.undoDisabled} onClick={props.undo} className="mobile-coloring-action"><Undo2 size={19}/><span className="sr-only">{props.en ? "Undo" : "Annuler"}</span></button>
      <button type="button" aria-label={props.en ? "Redo" : "Rétablir"} disabled={props.redoDisabled} onClick={props.redo} className="mobile-coloring-action"><Redo2 size={19}/><span className="sr-only">{props.en ? "Redo" : "Rétablir"}</span></button>
      <button type="button" aria-label={props.en ? "Start again" : "Recommencer"} onClick={props.reset} className="mobile-coloring-action"><RotateCcw size={19}/><span className="sr-only">{props.en ? "Reset" : "Refaire"}</span></button>
      <ExportColoringButtons compact title={props.title} en={props.en} getCanvas={props.getCanvas}/>
    </div>
  </aside>;
}
