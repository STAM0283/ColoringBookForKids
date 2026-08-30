"use client";

import { Check, Eraser, Redo2, RotateCcw, Undo2 } from "lucide-react";
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
  getCanvas: () => Promise<HTMLCanvasElement | null> | HTMLCanvasElement | null;
};

export function MobileColoringToolbar(props: Props) {
  return <aside className="mobile-coloring-toolbar lg:hidden" aria-label={props.en ? "Colouring tools" : "Outils de coloriage"}>
    <div className="grid grid-cols-8 gap-1 sm:grid-cols-12" aria-label={props.en ? "Colours" : "Couleurs"}>
      {props.colors.map(value => <button
        key={value}
        type="button"
        aria-label={`${props.en ? "Colour" : "Couleur"} ${value}`}
        aria-pressed={!props.eraser && props.color === value}
        onClick={() => { props.setColor(value); props.setEraser(false); }}
        className={`grid aspect-square min-w-0 place-items-center rounded-lg border transition active:scale-90 ${!props.eraser && props.color === value ? "scale-110 border-foreground ring-2 ring-primary/50" : "border-white/60 dark:border-white/20"}`}
        style={{ backgroundColor: value }}
      >{!props.eraser && props.color === value && <Check size={13} className={value === "#111827" ? "text-white" : "text-slate-950"}/>}</button>)}
    </div>
    <div className="mt-2 grid grid-cols-6 gap-1.5">
      <button type="button" aria-label={props.en ? "Eraser" : "Gomme"} aria-pressed={props.eraser} onClick={() => props.setEraser(true)} className={`mobile-coloring-action ${props.eraser ? "bg-primary text-white" : ""}`}><Eraser size={19}/><span className="sr-only">{props.en ? "Erase" : "Gomme"}</span></button>
      <button type="button" aria-label={props.en ? "Undo" : "Annuler"} disabled={props.undoDisabled} onClick={props.undo} className="mobile-coloring-action"><Undo2 size={19}/><span className="sr-only">{props.en ? "Undo" : "Annuler"}</span></button>
      <button type="button" aria-label={props.en ? "Redo" : "Rétablir"} disabled={props.redoDisabled} onClick={props.redo} className="mobile-coloring-action"><Redo2 size={19}/><span className="sr-only">{props.en ? "Redo" : "Rétablir"}</span></button>
      <button type="button" aria-label={props.en ? "Start again" : "Recommencer"} onClick={props.reset} className="mobile-coloring-action"><RotateCcw size={19}/><span className="sr-only">{props.en ? "Reset" : "Refaire"}</span></button>
      <ExportColoringButtons compact title={props.title} en={props.en} getCanvas={props.getCanvas}/>
    </div>
  </aside>;
}
