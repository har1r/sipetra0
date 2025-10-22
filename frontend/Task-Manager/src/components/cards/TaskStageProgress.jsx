// src/components/cards/TaskStageProgress.jsx
import React from "react";

const STEPS = ["diinput", "ditata", "diteliti", "diarsipkan", "dikirim", "selesai"];

const LABELS = {
  diinput: "Diinput",
  ditata: "Ditata",
  diteliti: "Diteliti",
  diarsipkan: "Diarsipkan",
  dikirim: "Dikirim",
  selesai: "Selesai",
};

const toLabel = (s) =>
  LABELS[s] ??
  String(s || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function TaskStageProgress({
  task,
  steps = STEPS,
  orientation = "horizontal", // "horizontal" | "vertical"
}) {
  if (!task) return null;

  // indeks & status
  const baseActiveIdx = Math.max(steps.indexOf(task.currentStage), -1);
  const doneIdx = steps.indexOf("selesai");
  const rejectedIdx = task.rejectedStage ? steps.indexOf(task.rejectedStage) : -1;

  const approvals = Array.isArray(task?.approvals) ? task.approvals : [];
  const sentApproved = approvals.some(
    (a) => a?.stage === "dikirim" && a?.status === "approved"
  );

  let activeIdx = baseActiveIdx;
  let completedIdx;
  if (rejectedIdx > -1) {
    completedIdx = rejectedIdx - 1;
  } else if (sentApproved || baseActiveIdx === doneIdx) {
    completedIdx = doneIdx;
    activeIdx = -1;
  } else {
    completedIdx = baseActiveIdx - 1;
  }

  const limitIdx =
    rejectedIdx > -1 ? rejectedIdx : activeIdx > -1 ? activeIdx : completedIdx;

  /* ========================= HORIZONTAL ========================= */
  if (orientation === "horizontal") {
    return (
      <div className="mb-0">
        <div className="flex items-start" role="list" aria-label="Progress tahapan">
          {steps.map((stage, i) => {
            const isRejected = i === rejectedIdx;
            const isCurrent = i === activeIdx && !isRejected;
            const isCompleted = i <= completedIdx;

            const leftGreen = i > 0 && i <= limitIdx;
            const rightGreen = i < limitIdx;

            const bulletBorder = isRejected
              ? "border-rose-500"
              : isCompleted
              ? "border-emerald-500"
              : isCurrent
              ? "border-yellow-300"
              : "border-slate-300";

            const numberColor = isRejected
              ? "text-rose-600"
              : isCompleted
              ? "text-emerald-600"
              : isCurrent
              ? "text-yellow-300"
              : "text-slate-400";

            return (
              <div key={stage} className="flex flex-1 flex-col items-center" role="listitem">
                <div className="relative flex h-14 w-full items-center justify-center">
                  {/* konektor kiri */}
                  {i > 0 && (
                    <div
                      aria-hidden
                      className={`absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-1 rounded-full ${
                        leftGreen
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                          : "bg-slate-300"
                      }`}
                    />
                  )}
                  {/* konektor kanan */}
                  {i < steps.length - 1 && (
                    <div
                      aria-hidden
                      className={`absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full ${
                        rightGreen
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                          : "bg-slate-300"
                      }`}
                    />
                  )}

                  {/* bullet */}
                  <div
                    className={[
                      "relative z-10 grid h-12 w-12 place-items-center rounded-full border-4 bg-white transition-transform",
                      bulletBorder,
                      isCompleted || isRejected ? "shadow-sm" : "",
                      isCompleted ? "shadow-emerald-200" : "",
                      isCurrent ? "ring-4 ring-yellow-200/60" : "",
                    ].join(" ")}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={toLabel(stage)}
                    title={toLabel(stage)}
                  >
                    <span className={`text-sm font-bold leading-none ${numberColor}`}>{i + 1}</span>

                    {/* badges */}
                    {isCompleted && !isRejected && (
                      <span
                        className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white"
                        aria-hidden
                        title="Selesai"
                      >
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                          <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" />
                        </svg>
                      </span>
                    )}
                    {isCurrent && !isRejected && (
                      <>
                        <span
                          className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-yellow-300/70 animate-ping"
                          aria-hidden
                        />
                        <span
                          className="absolute -right-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-yellow-300 text-white ring-2 ring-white"
                          aria-hidden
                          title="Menunggu / Diproses"
                        >
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                            <path d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.262 10.262 0 0 0 12 1.75Zm0 18.5A8.25 8.25 0 1 1 20.25 12 8.26 8.26 0 0 1 12 20.25Zm.75-13.5h-1.5v6l5 3 .75-1.23-4.25-2.55Z" />
                          </svg>
                        </span>
                      </>
                    )}
                    {isRejected && (
                      <span
                        className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white ring-2 ring-white"
                        aria-hidden
                        title="Ditolak"
                      >
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                          <path d="M18.3 5.71 12 12.01 5.71 5.71 4.3 7.12l6.29 6.28-6.3 6.3 1.42 1.41 6.3-6.3 6.29 6.3 1.41-1.41-6.29-6.3 6.29-6.29z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>

                <p
                  className={[
                    "mt-2 text-center text-xs md:text-sm font-semibold",
                    isRejected
                      ? "text-rose-600"
                      : isCompleted
                      ? "text-emerald-700"
                      : isCurrent
                      ? "text-yellow-300"
                      : "text-slate-600",
                  ].join(" ")}
                >
                  {toLabel(stage)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ========================= VERTICAL ========================= */
  return (
    <div role="list" aria-label="Progress tahapan (vertikal)" className="relative">
      <ol className="space-y-5">
        {steps.map((stage, i) => {
          const isRejected = i === rejectedIdx;
          const isCurrent = i === activeIdx && !isRejected;
          const isCompleted = i <= completedIdx;

          const topGreen = i > 0 && i <= limitIdx; // atas -> tengah
          const bottomGreen = i < limitIdx; // tengah -> bawah

          const dotBorder = isRejected
            ? "border-rose-500"
            : isCompleted
            ? "border-emerald-500"
            : isCurrent
            ? "border-yellow-300"
            : "border-slate-300";

          const numberColor = isRejected
            ? "text-rose-600"
            : isCompleted
            ? "text-emerald-600"
            : isCurrent
            ? "text-yellow-600"
            : "text-slate-400";

          return (
            <li key={stage} className="relative pl-12" role="listitem">
              {/* rail abu-abu baseline (dibagi dua & overlap agar tanpa celah) */}
              {i > 0 && (
                <span
                  aria-hidden
                  className="absolute left-6 w-0.5 bg-slate-300 rounded"
                  style={{
                    top: "-8px",
                    height: "calc(50% + 8px)",
                    transform: "translateX(-50%)",
                  }}
                />
              )}
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-6 w-0.5 bg-slate-300 rounded"
                  style={{
                    bottom: "-8px",
                    height: "calc(50% + 8px)",
                    transform: "translateX(-50%)",
                  }}
                />
              )}

              {/* rail hijau overlay (progress) */}
              {topGreen && (
                <span
                  aria-hidden
                  className="absolute left-6 w-0.5 bg-emerald-500 rounded"
                  style={{
                    top: "-8px",
                    height: "calc(50% + 8px)",
                    transform: "translateX(-50%)",
                  }}
                />
              )}
              {bottomGreen && (
                <span
                  aria-hidden
                  className="absolute left-6 w-0.5 bg-emerald-500 rounded"
                  style={{
                    bottom: "-8px",
                    height: "calc(50% + 8px)",
                    transform: "translateX(-50%)",
                  }}
                />
              )}

              {/* bullet — center vertikal */}
              <span
                className={[
                  "absolute left-6 top-1/2 -translate-x-1/2 -translate-y-1/2",
                  "z-10 grid h-9 w-9 place-items-center rounded-full border-4 bg-white",
                  dotBorder,
                  isCompleted ? "shadow-emerald-200 shadow-sm" : "",
                  isCurrent ? "ring-4 ring-yellow-200/60" : "",
                ].join(" ")}
                title={toLabel(stage)}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span className={`text-[11px] font-bold leading-none ${numberColor}`}>
                  {i + 1}
                </span>

                {/* badges */}
                {isCompleted && !isRejected && (
                  <span
                    className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white"
                    aria-hidden
                    title="Selesai"
                  >
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor">
                      <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" />
                    </svg>
                  </span>
                )}
                {isCurrent && !isRejected && (
                  <>
                    <span
                      className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-yellow-300/70 animate-ping"
                      aria-hidden
                    />
                    <span
                      className="absolute -right-1 -top-1 z-10 grid h-4 w-4 place-items-center rounded-full bg-yellow-300 text-white ring-2 ring-white"
                      aria-hidden
                      title="Menunggu / Diproses"
                    >
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor">
                        <path d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.262 10.262 0 0 0 12 1.75Zm0 18.5A8.25 8.25 0 1 1 20.25 12 8.26 8.26 0 0 1 12 20.25Zm.75-13.5h-1.5v6l5 3 .75-1.23-4.25-2.55Z" />
                      </svg>
                    </span>
                  </>
                )}
                {isRejected && (
                  <span
                    className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-white ring-2 ring-white"
                    aria-hidden
                    title="Ditolak"
                  >
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor">
                      <path d="M18.3 5.71 12 12.01 5.71 5.71 4.3 7.12l6.29 6.28-6.3 6.3 1.42 1.41 6.3-6.3 6.29 6.3 1.41-1.41-6.29-6.3 6.29-6.29z" />
                    </svg>
                  </span>
                )}
              </span>

              {/* label — sejajar dengan bullet */}
              <div className="ml-8 min-h-[2.25rem] flex items-center">
                <p
                  className={[
                    "text-sm font-semibold",
                    isRejected
                      ? "text-rose-600"
                      : isCompleted
                      ? "text-emerald-700"
                      : isCurrent
                      ? "text-yellow-600"
                      : "text-slate-700",
                  ].join(" ")}
                >
                  {toLabel(stage)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}