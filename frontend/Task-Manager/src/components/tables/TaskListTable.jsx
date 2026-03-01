// Styled TaskListTable - Emerald/Lime dashboard theme
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BiSolidDetail } from "react-icons/bi";

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID");
const getApplicantName = (task) => {
  const additional = task?.additionalData || [];
  return additional.length ? additional[0]?.newName || "-" : "-";
};

const highlightText = (text = "", query = "") => {
  if (!query) return text || "-";
  const str = String(text ?? "");
  const index = str.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return str || "-";

  return (
    <>
      {str.slice(0, index)}
      <mark className="bg-lime-200/70 text-emerald-900 px-0.5 rounded">
        {str.slice(index, index + query.length)}
      </mark>
      {str.slice(index + query.length)}
    </>
  );
};

const TaskListTable = ({
  tableData = [],
  page = 1,
  limit = 10,
  searchNopel = "",
  onSearchNopel,
  loading = false,
}) => {
  const [localQuery, setLocalQuery] = useState(searchNopel);
  const tasks = useMemo(
    () => (Array.isArray(tableData) ? tableData : []),
    [tableData]
  );
  const startIndex = (Number(page) - 1) * Number(limit);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearchNopel?.(localQuery.trim());
  };

  const handleResetSearch = () => {
    setLocalQuery("");
    onSearchNopel?.("");
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-emerald-200/50 bg-white/70 backdrop-blur-sm p-4 shadow-md hover:shadow-lg transition-all duration-200">
      {/* Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="mb-4 flex items-center gap-2"
      >
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Cari NOPel..."
          className="w-full max-w-xs rounded-xl border border-emerald-300 bg-white/70 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400"
        >
          Cari
        </button>

        {searchNopel && (
          <button
            type="button"
            onClick={handleResetSearch}
            className="rounded-xl border border-lime-400 bg-lime-100/50 px-4 py-2 text-sm text-emerald-700 shadow hover:bg-lime-200 focus:ring-2 focus:ring-lime-400"
          >
            Reset
          </button>
        )}
      </form>

      {/* Table */}
      <table className="min-w-full text-sm rounded-xl overflow-hidden">
        <thead className="sticky top-0 bg-emerald-50 text-emerald-900 border-b border-emerald-200/70">
          <tr>
            <th className="px-3 py-2 text-left">No</th>
            <th className="px-3 py-2 text-left">Tanggal</th>
            <th className="px-3 py-2 text-left">Nopel</th>
            <th className="px-3 py-2 text-left">NOP</th>
            <th className="px-3 py-2 text-left">Nama</th>
            <th className="px-3 py-2 text-left">Jenis</th>
            <th className="px-3 py-2 text-center">Aksi</th>
          </tr>
        </thead>

        <tbody className="[&>tr:nth-child(even)]:bg-emerald-50/30">
          {tasks.map((task, index) => {
            const nopel = task?.mainData?.nopel ?? "-";
            const createdDate = task?.createdAt
              ? DATE_FORMATTER.format(new Date(task.createdAt))
              : "-";
            const applicantName = getApplicantName(task);
            const title = task?.title || "-";

            const isWarning =
              task?.createdAt &&
              Date.now() - new Date(task.createdAt).getTime() >
                5 * 24 * 60 * 60 * 1000;

            return (
              <tr
                key={task?._id || `${startIndex}-${index}`}
                className={`transition-colors ${
                  isWarning
                    ? "bg-yellow-50 border-l-4 border-yellow-400 hover:bg-yellow-100"
                    : "hover:bg-emerald-50"
                }`}
              >
                <td className="px-3 py-2 border-b">{startIndex + index + 1}</td>
                <td className="px-3 py-2 border-b">{createdDate}</td>
                <td className="px-3 py-2 border-b">
                  {highlightText(nopel, searchNopel)}
                </td>
                <td className="px-3 py-2 border-b">
                  {task?.mainData?.nop ?? "-"}
                </td>
                <td
                  className="px-3 py-2 border-b max-w-[220px] truncate"
                  title={applicantName}
                >
                  {applicantName}
                </td>
                <td
                  className="px-3 py-2 border-b max-w-[260px] truncate capitalize"
                  title={title}
                >
                  {title}
                </td>

                <td className="px-3 py-2 border-b">
                  <div className="flex justify-center">
                    <Link
                      to={`/task-detail/${task?._id}`}
                      className={`rounded-full p-2 shadow transition ${
                        isWarning
                          ? "bg-yellow-100 hover:bg-yellow-200"
                          : "bg-emerald-100 hover:bg-emerald-200"
                      }`}
                      title="Detail"
                    >
                      <BiSolidDetail
                        className={`text-xl ${
                          isWarning ? "text-yellow-600" : "text-emerald-700"
                        }`}
                      />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}

          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} className="px-3 py-2 border-b">
                    <div className="h-3 w-24 animate-pulse rounded bg-emerald-200/40" />
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(TaskListTable);
