import React from "react";

const TableSkeleton = ({ rows = 5, cols= 7 }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead className="sticky top-0 bg-slate-100 text-slate-800">
        <tr>
          {Array.from(cols).map((_, i) => (
            <th key={i} className="border-b px-3 py-2 text-left">
              <div className="h-3 w-24 rounded bg-slate-200" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
        {Array.from(rows).map((_, r) => (
          <tr key={r} className="[&>td]:border-b">
            {Array.from(cols).map((__, c) => (
              <td key={c} className="px-3 py-2">
                <div className="h-3 w-28 rounded bg-slate-200 animate-pulse" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default React.memo(TableSkeleton);