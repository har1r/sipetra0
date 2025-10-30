import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BiSolidDetail } from "react-icons/bi";

const DF_ID = new Intl.DateTimeFormat("id-ID");

const getNewName = (task) => {
  const arr = task?.additionalData || [];
  if (!arr.length) return "-";
  return arr[0]?.newName || "-";
};

// Highlight util (case-insensitive), aman karena React escape string.
const highlight = (text = "", q = "") => {
  if (!q) return text || "-";
  const source = String(text ?? "");
  const idx = source.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return source || "-";
  return (
    <>
      {source.slice(0, idx)}
      <mark className="bg-yellow-200 px-0.5 rounded">
        {source.slice(idx, idx + q.length)}
      </mark>
      {source.slice(idx + q.length)}
    </>
  );
};

/**
 * Props:
 * - tableData: any[]
 * - loading?: boolean
 * - page?: number
 * - limit?: number
 * - searchNopel?: string
 * - onSearchNopel?: (q: string) => void
 */
const TaskListTable = ({
  tableData = [],
  loading = false,
  page = 1,
  limit = 10,
  searchNopel = "",
  onSearchNopel,
}) => {
  const rows = useMemo(
    () => (Array.isArray(tableData) ? tableData : []),
    [tableData]
  );
  const offset = (Number(page) - 1) * Number(limit);
  const [localQuery, setLocalQuery] = useState(searchNopel ?? "");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearchNopel?.(localQuery.trim());
  };

  return (
    <div className="overflow-x-auto">
      {/* Bar pencarian NOPel */}
      <form onSubmit={handleSearch} className="mb-3 flex items-center gap-2">
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Cari Nopel"
          className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Cari Nopel"
          inputMode="text"
        />
        <button
          type="submit"
          className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Cari
        </button>
        {searchNopel ? (
          <button
            type="button"
            onClick={() => {
              setLocalQuery("");
              onSearchNopel?.("");
            }}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Reset
          </button>
        ) : null}
      </form>

      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-slate-100 text-slate-800">
          <tr>
            <th className="border-b px-3 py-2 text-left">No</th>
            <th className="border-b px-3 py-2 text-left">Tanggal</th>
            <th className="border-b px-3 py-2 text-left">NOPEL</th>
            <th className="border-b px-3 py-2 text-left">NOP</th>
            <th className="border-b px-3 py-2 text-left">Nama</th>
            <th className="border-b px-3 py-2 text-left">Jenis</th>
            <th className="border-b px-3 py-2 text-center">Aksi</th>
          </tr>
        </thead>

        <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
          {rows.map((task, idx) => {
            const nopel = task?.mainData?.nopel ?? "-";
            return (
              <tr
                key={task?._id || `${offset}-${idx}`}
                className="transition-colors hover:bg-indigo-50/40"
              >
                <td className="border-b px-3 py-2">{offset + idx + 1}</td>
                <td className="border-b px-3 py-2">
                  {task?.createdAt
                    ? DF_ID.format(new Date(task.createdAt))
                    : "-"}
                </td>
                <td className="border-b px-3 py-2">
                  {highlight(nopel, searchNopel)}
                </td>
                <td className="border-b px-3 py-2">
                  {task?.mainData?.nop ?? "-"}
                </td>
                <td className="border-b px-3 py-2">
                  <div
                    className="max-w-[220px] truncate"
                    title={getNewName(task)}
                  >
                    {getNewName(task)}
                  </div>
                </td>
                <td className="border-b px-3 py-2 capitalize">
                  <div
                    className="max-w-[260px] truncate"
                    title={task?.title || ""}
                  >
                    {task?.title || ""}
                  </div>
                </td>
                <td className="border-b px-3 py-2">
                  <div className="flex justify-center gap-1 sm:gap-2">
                    <Link
                      to={`/task-detail/${task?._id}`}
                      className="rounded-full bg-blue-100 p-1.5 transition hover:bg-blue-200 sm:p-2"
                      title="Detail"
                    >
                      <BiSolidDetail className="text-lg text-blue-600 sm:text-xl" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
          {/* 
          {loading &&
            Array.from({ length: Math.max(3, 5 - rows.length) }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="[&>td]:border-b">
                {[...Array(7)].map((__, j) => (
                  <td key={j} className="px-3 py-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                  </td>
                ))}
              </tr>
            ))} */}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(TaskListTable);
