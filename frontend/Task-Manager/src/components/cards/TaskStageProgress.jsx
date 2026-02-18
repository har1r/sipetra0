import React from "react";

const STEPS = ["diinput", "ditata", "diteliti", "diarsipkan", "dikirim", "diperiksa", "selesai"];

const LABELS = {
  diinput: "Diinput",
  ditata: "Ditata",
  diteliti: "Diteliti",
  diarsipkan: "Diarsipkan",
  dikirim: "Dikirim",
  diperiksa: "Pemeriksaan",
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

  // 1. Tentukan index saat ini
  const currentIdx = steps.indexOf(task.currentStage);
  
  // 2. Cari stage yang ditolak (rejected) atau diminta revisi (revised)
  const approvals = Array.isArray(task?.approvals) ? task.approvals : [];
  
  const rejectedApproval = approvals.find(a => a.status === "rejected");
  const revisedApproval = approvals.find(a => a.status === "revised");

  const rejectedIdx = rejectedApproval ? steps.indexOf(rejectedApproval.stage) : -1;
  const revisedIdx = revisedApproval ? steps.indexOf(revisedApproval.stage) : -1;

  // 3. Logika Indexing untuk pewarnaan Rail/Garis dan Bullet
  let activeIdx = currentIdx;
  let completedIdx = currentIdx - 1;

  const issueIdx = rejectedIdx !== -1 ? rejectedIdx : revisedIdx;

  if (issueIdx !== -1) {
    activeIdx = issueIdx;
    completedIdx = issueIdx - 1;
  } else if (task.overallStatus === "approved" || task.currentStage === "selesai") {
    completedIdx = steps.length - 1;
    activeIdx = -1;
  }

  const limitIdx = issueIdx !== -1 ? issueIdx : activeIdx !== -1 ? activeIdx : completedIdx;

  /* ========================= HORIZONTAL ========================= */
  if (orientation === "horizontal") {
    return (
      <div className="mb-0">
        <div className="flex items-start" role="list" aria-label="Progress tahapan">
          {steps.map((stage, i) => {
            const isRejected = i === rejectedIdx;
            const isRevised = i === revisedIdx; // Revised dipisahkan dari Rejected
            const isCurrent = i === activeIdx && !isRejected && !isRevised;
            const isCompleted = i <= completedIdx;

            const leftGreen = i > 0 && i <= limitIdx;
            const rightGreen = i < limitIdx;

            // WARNA BULLET
            const bulletBorder = isRejected
              ? "border-rose-500"
              : isRevised
              ? "border-amber-500" // WARNA AMBER UNTUK REVISI
              : isCompleted
              ? "border-emerald-500"
              : isCurrent
              ? "border-yellow-300"
              : "border-slate-300";

            // WARNA ANGKA
            const numberColor = isRejected
              ? "text-rose-600"
              : isRevised
              ? "text-amber-600" // WARNA AMBER UNTUK REVISI
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
                        leftGreen ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-slate-300"
                      }`}
                    />
                  )}
                  {/* konektor kanan */}
                  {i < steps.length - 1 && (
                    <div
                      aria-hidden
                      className={`absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full ${
                        rightGreen ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-slate-300"
                      }`}
                    />
                  )}

                  {/* bullet */}
                  <div
                    className={[
                      "relative z-10 grid h-12 w-12 place-items-center rounded-full border-4 bg-white transition-transform",
                      bulletBorder,
                      isCompleted || isRejected || isRevised ? "shadow-sm" : "",
                      isCompleted ? "shadow-emerald-200" : "",
                      isCurrent ? "ring-4 ring-yellow-200/60" : "",
                    ].join(" ")}
                  >
                    <span className={`text-sm font-bold leading-none ${numberColor}`}>{i + 1}</span>

                    {/* Badge Selesai */}
                    {isCompleted && !isRejected && !isRevised && (
                      <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                          <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" />
                        </svg>
                      </span>
                    )}
                    {/* Badge Current */}
                    {isCurrent && !isRejected && !isRevised && (
                      <span className="absolute -right-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-yellow-300 text-white ring-2 ring-white">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                          <path d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.262 10.262 0 0 0 12 1.75Zm0 18.5A8.25 8.25 0 1 1 20.25 12 8.26 8.26 0 0 1 12 20.25Zm.75-13.5h-1.5v6l5 3 .75-1.23-4.25-2.55Z" />
                        </svg>
                      </span>
                    )}
                    {/* Badge Revised (Amber) */}
                    {isRevised && (
                      <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-amber-500 text-white ring-2 ring-white">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </span>
                    )}
                    {/* Badge Rejected (Rose) */}
                    {isRejected && (
                      <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white ring-2 ring-white">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                          <path d="M18.3 5.71 12 12.01 5.71 5.71 4.3 7.12l6.29 6.28-6.3 6.3 1.42 1.41 6.3-6.3 6.29 6.3 1.41-1.41-6.29-6.3 6.29-6.29z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
                <p className={["mt-2 text-center text-xs md:text-sm font-semibold", isRejected ? "text-rose-600" : isRevised ? "text-amber-600" : isCompleted ? "text-emerald-700" : isCurrent ? "text-yellow-600" : "text-slate-600"].join(" ")}>
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
          const isRevised = i === revisedIdx;
          const isCurrent = i === activeIdx && !isRejected && !isRevised;
          const isCompleted = i <= completedIdx;

          const topGreen = i > 0 && i <= limitIdx;
          const bottomGreen = i < limitIdx;

          const dotBorder = isRejected ? "border-rose-500" : isRevised ? "border-amber-500" : isCompleted ? "border-emerald-500" : isCurrent ? "border-yellow-300" : "border-slate-300";
          const numberColor = isRejected ? "text-rose-600" : isRevised ? "text-amber-600" : isCompleted ? "text-emerald-600" : isCurrent ? "text-yellow-600" : "text-slate-400";

          return (
            <li key={stage} className="relative pl-12" role="listitem">
              {/* Rail logic */}
              {i > 0 && <span className="absolute left-6 w-0.5 bg-slate-300 rounded" style={{ top: "-8px", height: "calc(50% + 8px)", transform: "translateX(-50%)" }} />}
              {i < steps.length - 1 && <span className="absolute left-6 w-0.5 bg-slate-300 rounded" style={{ bottom: "-8px", height: "calc(50% + 8px)", transform: "translateX(-50%)" }} />}
              {topGreen && <span className="absolute left-6 w-0.5 bg-emerald-500 rounded" style={{ top: "-8px", height: "calc(50% + 8px)", transform: "translateX(-50%)" }} />}
              {bottomGreen && <span className="absolute left-6 w-0.5 bg-emerald-500 rounded" style={{ bottom: "-8px", height: "calc(50% + 8px)", transform: "translateX(-50%)" }} />}

              {/* Bullet */}
              <span className={["absolute left-6 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 grid h-9 w-9 place-items-center rounded-full border-4 bg-white", dotBorder, isCompleted ? "shadow-emerald-200 shadow-sm" : "", isCurrent ? "ring-4 ring-yellow-200/60" : ""].join(" ")}>
                <span className={`text-[11px] font-bold leading-none ${numberColor}`}>{i + 1}</span>
                {isCompleted && !isRejected && !isRevised && (
                  <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor"><path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" /></svg>
                  </span>
                )}
                {isRevised && (
                  <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-amber-500 text-white ring-2 ring-white">
                    <span className="text-[8px] font-bold">!</span>
                  </span>
                )}
                {isRejected && (
                  <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-white ring-2 ring-white">
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor"><path d="M18.3 5.71 12 12.01 5.71 5.71 4.3 7.12l6.29 6.28-6.3 6.3 1.42 1.41 6.3-6.3 6.29 6.3 1.41-1.41-6.29-6.3 6.29-6.29z" /></svg>
                  </span>
                )}
              </span>

              <div className="ml-8 min-h-[2.25rem] flex items-center">
                <p className={["text-sm font-semibold", isRejected ? "text-rose-600" : isRevised ? "text-amber-600" : isCompleted ? "text-emerald-700" : isCurrent ? "text-yellow-600" : "text-slate-700"].join(" ")}>
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