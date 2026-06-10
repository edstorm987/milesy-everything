// T4 R008 — React HC quiz. Replaces the iframed static app with a
// component that shares SiteShell + brand-kit tokens. Implements
// every step type from the static `hc-questions.js`: choice, multi,
// slider, text, url, task, reveal, lever-calc, mental-note. skipIf
// is the serialised `{rawAt, neq|eq}` DSL from `defaultPack.ts`
// (the static JS used arbitrary functions; the DSL is sufficient
// for every existing skipIf).

"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { HCArea, HCPack, HCSlot, HCStep } from "@/lib/healthCheck/types";
import { HCResults } from "./_HCResults";

type Tier = HCSlot["tier"];

type AreaState = {
  tier: Tier | null;
  raw: Record<number, number | number[] | string | null>;
  cursor: number;
};

const tierOrder: Tier[] = ["beginner", "intermediate", "professional"];

function shouldSkip(step: HCStep, raw: AreaState["raw"]): boolean {
  if (!step.skipIf) return false;
  const at = raw[step.skipIf.rawAt];
  const v = typeof at === "number" ? at : null;
  if (step.skipIf.neq != null && v !== step.skipIf.neq) return true;
  if (step.skipIf.eq != null && v === step.skipIf.eq) return true;
  return false;
}

function scoreArea(area: HCArea, st: AreaState): number {
  if (!st.tier) return 0;
  const exercise = area.tiers[st.tier].exercise;
  let total = 0, count = 0;
  exercise.forEach((step, i) => {
    if (shouldSkip(step, st.raw)) return;
    const raw = st.raw[i];
    if (step.type === "choice" && step.scoring !== false && typeof raw === "number") {
      total += step.options[raw]?.score ?? 0; count++;
    } else if (step.type === "multi" && Array.isArray(raw)) {
      const subtotal = raw.reduce((s, idx) => s + (step.options[idx]?.score ?? 0), 0);
      total += Math.max(0, Math.min(100, subtotal)); count++;
    } else if (step.type === "slider" && typeof raw === "number") {
      total += raw; count++;
    }
  });
  return count ? Math.round(total / count) : 0;
}

export function HCQuiz({ pack }: { pack: HCPack }) {
  const [areaIdx, setAreaIdx] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [states, setStates] = useState<AreaState[]>(() =>
    pack.areas.map(() => ({ tier: null, raw: {}, cursor: 0 }))
  );

  const area = pack.areas[areaIdx];
  const st = states[areaIdx];

  const updateState = (next: Partial<AreaState>) => {
    setStates((prev) => prev.map((s, i) => (i === areaIdx ? { ...s, ...next } : s)));
  };

  const exercise = st.tier ? area.tiers[st.tier].exercise : [];
  const step = exercise[st.cursor];

  const advance = () => {
    let next = st.cursor + 1;
    while (next < exercise.length && shouldSkip(exercise[next], st.raw)) next++;
    if (next >= exercise.length) {
      if (areaIdx + 1 < pack.areas.length) setAreaIdx(areaIdx + 1);
      else setCompleted(true);
    } else {
      updateState({ cursor: next });
    }
  };

  const setRaw = (i: number, v: number | number[] | string | null) => {
    updateState({ raw: { ...st.raw, [i]: v } });
  };

  const scores = useMemo(
    () => pack.areas.map((a, i) => ({ area: a, score: scoreArea(a, states[i]), state: states[i] })),
    [pack, states]
  );

  if (completed) return <HCResults scores={scores} />;

  return (
    <div className="hc-shell">
      <header className="hc-header">
        <div className="hc-progress">
          {pack.areas.map((a, i) => (
            <button
              key={a.id} type="button"
              className={`hc-pill ${i === areaIdx ? "is-active" : ""} ${states[i].tier && Object.keys(states[i].raw).length ? "is-done" : ""}`}
              onClick={() => setAreaIdx(i)}>
              <span aria-hidden>{a.icon}</span> {a.name}
            </button>
          ))}
        </div>
      </header>

      <section className="hc-area">
        <h1 className="hc-area-title">{area.name}</h1>
        <p className="hc-area-blurb">{area.blurb}</p>

        {!st.tier ? (
          <div className="hc-tier-picker">
            {tierOrder.map((t) => {
              const tier = area.tiers[t];
              return (
                <button key={t} type="button" className="hc-tier-card"
                  onClick={() => updateState({ tier: t, cursor: 0 })}>
                  <strong>{tier.label}</strong>
                  <span className="hc-tier-time">{tier.time}</span>
                  <span className="hc-tier-summary">{tier.summary}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <StepView step={step} index={st.cursor}
            value={st.raw[st.cursor] ?? null}
            onChange={(v) => setRaw(st.cursor, v)}
            onAdvance={advance} />
        )}
      </section>
    </div>
  );
}

function StickyEmbed({ embed, userQuery, setUserQuery }: {
  embed: NonNullable<HCStep["stickyEmbed"]>;
  userQuery: string;
  setUserQuery: (s: string) => void;
}) {
  const q = embed.query ?? userQuery;
  const src = embed.kind === "search"
    ? `https://www.google.com/search?igu=1&q=${encodeURIComponent(q || "")}`
    : userQuery || "";
  return (
    <div className="hc-sticky">
      {embed.editable && (
        <input className="hc-sticky-input" type={embed.kind === "site" ? "url" : "search"}
          placeholder={embed.placeholder ?? ""} value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)} />
      )}
      {(embed.kind === "search" ? q : src) ? (
        <iframe title="hc-embed" className="hc-sticky-frame" src={src || "about:blank"} />
      ) : (
        <div className="hc-sticky-placeholder">Type above to load preview.</div>
      )}
    </div>
  );
}

function StepView({ step, index, value, onChange, onAdvance }: {
  step: HCStep; index: number;
  value: number | number[] | string | null;
  onChange: (v: number | number[] | string | null) => void;
  onAdvance: () => void;
}) {
  const [userQuery, setUserQuery] = useState("");
  const [ltv, setLtv] = useState(step.type === "lever-calc" ? step.ltvDefault : 0);
  const [enq, setEnq] = useState(step.type === "lever-calc" ? step.enqDefault : 0);
  const embed = step.stickyEmbed ?? step.embed;

  const submitText = (e: FormEvent) => { e.preventDefault(); onAdvance(); };

  return (
    <div className="hc-step" key={index}>
      {embed && <StickyEmbed embed={embed} userQuery={userQuery} setUserQuery={setUserQuery} />}

      {step.title && <h2 className="hc-step-title">{step.title}</h2>}
      {step.prompt && <h2 className="hc-step-title">{step.prompt}</h2>}
      {step.body && <p className="hc-step-body" dangerouslySetInnerHTML={{ __html: step.body }} />}

      {step.type === "task" && (
        <button className="hc-btn-primary" onClick={onAdvance}>{step.done ?? "Done"}</button>
      )}
      {step.type === "reveal" && (
        <button className="hc-btn-primary" onClick={onAdvance}>Continue</button>
      )}

      {step.type === "choice" && (
        <ul className="hc-choices">
          {step.options.map((opt, i) => (
            <li key={i}>
              <button type="button" className={`hc-choice ${value === i ? "is-selected" : ""}`}
                onClick={() => { onChange(i); setTimeout(onAdvance, 120); }}>
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {step.type === "multi" && (
        <>
          <ul className="hc-choices">
            {step.options.map((opt, i) => {
              const arr = Array.isArray(value) ? value : [];
              const on = arr.includes(i);
              return (
                <li key={i}>
                  <button type="button" className={`hc-choice ${on ? "is-selected" : ""}`}
                    onClick={() => onChange(on ? arr.filter((x) => x !== i) : [...arr, i])}>
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
          <button className="hc-btn-primary" onClick={onAdvance}>Continue</button>
        </>
      )}

      {step.type === "slider" && (
        <>
          <input type="range" min={step.min} max={step.max}
            value={typeof value === "number" ? value : step.value}
            onChange={(e) => onChange(Number(e.target.value))} className="hc-slider" />
          <div className="hc-slider-readout">
            {typeof value === "number" ? value : step.value}{step.suffix ?? ""}
          </div>
          <button className="hc-btn-primary" onClick={onAdvance}>Continue</button>
        </>
      )}

      {step.type === "text" && (
        <form onSubmit={submitText}>
          <textarea className="hc-text" rows={3} value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)} />
          <button className="hc-btn-primary" type="submit">{step.optional ? "Continue" : "Save"}</button>
        </form>
      )}

      {step.type === "url" && (
        <form onSubmit={submitText}>
          <input className="hc-text" type="url" placeholder={step.placeholder ?? ""}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)} />
          <button className="hc-btn-primary" type="submit">{step.optional ? "Continue" : "Save"}</button>
        </form>
      )}

      {step.type === "lever-calc" && (
        <div className="hc-lever">
          <label>Typical customer value (£)
            <input type="number" value={ltv} onChange={(e) => setLtv(Number(e.target.value))} />
          </label>
          <label>Extra enquiries / year if you ranked first
            <input type="number" value={enq} onChange={(e) => setEnq(Number(e.target.value))} />
          </label>
          <div className="hc-lever-out">
            ≈ <strong>£{(ltv * enq).toLocaleString()}</strong> / year
          </div>
          <button className="hc-btn-primary" onClick={() => { onChange(ltv * enq); onAdvance(); }}>
            Continue
          </button>
        </div>
      )}

      {step.type === "mental-note" && (
        <button className="hc-btn-primary"
          onClick={() => { onChange(1); onAdvance(); }}>
          {step.label}
        </button>
      )}
    </div>
  );
}
