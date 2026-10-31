// OWNER: Builder B. The dissect report: a terminal-style readout of how the signature was found and where
// to start reading the real code. Lines print one after another, like a command running.
"use client";
import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { COPY } from "@/content/copy";
import type { Dissection } from "@/components/dissect";

type Props = { report: Dissection; onClose: () => void };

const STATE_CLASS = {
  chosen: "text-highlight",
  skipped: "text-muted",
  found: "text-ink",
  absent: "text-muted opacity-60",
} as const;

export function DissectPanel({ report, onClose }: Props) {
  const reduceMotion = useReducedMotion();
  let line = 0;
  /** Each call is the next printed line; the delay makes them appear in order. */
  const print = () => ({
    initial: reduceMotion ? false : { opacity: 0, x: -6 },
    animate: { opacity: 1, x: 0 },
    transition: { delay: reduceMotion ? 0 : 0.05 + line++ * 0.06, duration: 0.2 },
  });
  const copy = COPY.dissect;

  return (
    <section
      aria-label={`${copy.command} ${report.motif}`}
      className="mt-6 rounded-2xl border border-highlight/50 bg-surface-strong p-4 text-sm sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <motion.p {...print()} className="text-highlight [overflow-wrap:anywhere]">
          {copy.command} {report.motif}
        </motion.p>
        <button type="button" onClick={onClose} className="text-xs text-muted underline underline-offset-2 hover:text-ink">
          {copy.close}
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1">
        {[...report.rows, { key: copy.meaningLabel, value: report.meaning }, { key: copy.lookForLabel, value: report.lookFor }].map((row, i) => {
          // One printed line per row: the key and value share it (display: contents cannot animate).
          const shown = print();
          return (
            <Fragment key={i}>
              <motion.dt {...shown} className="text-muted">
                {row.key}
              </motion.dt>
              <motion.dd {...shown} className="[overflow-wrap:anywhere]">
                {row.value}
              </motion.dd>
            </Fragment>
          );
        })}
      </dl>

      {report.links.length > 0 && (
        <motion.p {...print()} className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {report.links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="text-highlight underline underline-offset-2 hover:brightness-125">
              {link.label}
            </a>
          ))}
        </motion.p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <motion.p {...print()} className="text-xs uppercase tracking-widest text-muted">
            {copy.rulesHeading}
          </motion.p>
          <ol className="mt-2 grid gap-0.5 text-xs">
            {report.rules.map((rule) => (
              <motion.li key={rule.factId} {...print()} className={`flex flex-wrap gap-x-2 ${STATE_CLASS[rule.state]}`}>
                <span className="w-32 shrink-0">{copy.ruleStates[rule.state]}</span>
                <span>{rule.name}</span>
                {rule.state === "chosen" && <span className="text-muted">({rule.detector})</span>}
              </motion.li>
            ))}
          </ol>
        </div>

        {report.excerpt && (
          <div className="min-w-0">
            <motion.p {...print()} className="text-xs uppercase tracking-widest text-muted">
              {copy.excerptHeading}: {report.excerpt.path}
            </motion.p>
            <motion.pre {...print()} className="mt-2 overflow-x-auto rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed">
              {report.excerpt.lines.join("\n")}
            </motion.pre>
          </div>
        )}
      </div>
    </section>
  );
}
