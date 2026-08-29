"use client";

import { isValidElement, useState } from "react";
import { MarkdownEditor } from "./markdown-editor";

type FieldControlProps = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  value?: unknown;
  defaultValue?: unknown;
  name?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

export function AdminFormField({ label, children, hint, optional = false }: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  optional?: boolean;
}) {
  const control = isValidElement<FieldControlProps>(children) ? children : null;
  const required = Boolean(control?.props.required) && !optional;
  const maxLength = typeof control?.props.maxLength === "number" ? control.props.maxLength : undefined;
  const controlledValue = control?.props.value;
  const initialValue = controlledValue ?? control?.props.defaultValue ?? "";
  const [typedLength, setTypedLength] = useState(String(initialValue).length);
  const currentLength = controlledValue === undefined ? typedLength : String(controlledValue ?? "").length;
  const remaining = maxLength === undefined ? undefined : Math.max(0, maxLength - currentLength);

  if (
    label.toLocaleLowerCase("fr").includes("description") &&
    control?.type === "textarea" &&
    typeof initialValue === "string"
  ) {
    return (
      <MarkdownEditor
        name={control.props.name}
        label={label}
        value={String(controlledValue ?? initialValue)}
        onChange={(value) => {
          const target = { value } as HTMLTextAreaElement;
          control.props.onChange?.({ target, currentTarget: target } as React.ChangeEvent<HTMLTextAreaElement>);
        }}
        required={required}
        minimumLength={control.props.minLength ?? 0}
        maximumLength={maxLength ?? 2000}
        compact
        help={hint ?? "Structurez la présentation avec du gras, des listes ou des sous-titres."}
      />
    );
  }

  return (
    <label
      className="group block text-sm font-bold text-slate-700"
      onInput={(event) => {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement;
        if (typeof target.value === "string") setTypedLength(target.value.length);
      }}
    >
      <span className="flex min-h-5 items-center justify-between gap-3">
        <span>
          {label}
          {required ? <span aria-hidden="true" className="ml-1 text-rose-600">*</span> : null}
          {required ? <span className="sr-only"> (obligatoire)</span> : null}
        </span>
        {remaining !== undefined ? (
          <span aria-live="polite" className={`rounded-full px-2.5 py-1 text-[11px] font-black tabular-nums transition ${remaining <= Math.ceil((maxLength ?? 0) * .1) ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>
            {remaining} restant{remaining > 1 ? "s" : ""}
          </span>
        ) : optional ? <span className="text-[11px] font-semibold text-slate-400">Facultatif</span> : null}
      </span>
      {hint ? <span className="mt-1 block text-xs font-medium leading-5 text-slate-400">{hint}</span> : null}
      {children}
    </label>
  );
}
