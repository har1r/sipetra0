import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Pagination from "../../components/ui/Pagination";
import VerificationModal from "../../components/modals/VerificationModal";
import RowActions from "../../components/actions/RowActions";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDateId } from "../../utils/formatDateId";
import toast from "react-hot-toast";
import {
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineInbox,
  HiOutlineExternalLink,
  HiFilter,
} from "react-icons/hi";

// --- Sub-Komponen Reusable ---
const FilterInput = ({ label, icon: Icon, ...props }) => (
  <div className="group space-y-1.5">
    <label className="text-[10px] font-bold text-slate-500 ml-1 tracking-widest group-focus-within:text-emerald-600 transition-colors">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      )}
      <input
        {...props}
        className={`w-full ${Icon ? "pl-10" : "px-4"} py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:text-slate-300 shadow-sm`}
      />
    </div>
  </div>
);

const FilterSelect = ({ label, options, ...props }) => (
  <div className="group space-y-1.5">
    <label className="text-[10px] font-bold text-slate-500 ml-1 tracking-widest group-focus-within:text-emerald-600 transition-colors">
      {label}
    </label>
    <select
      {...props}
      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:border-emerald-500 transition-all shadow-sm"
    >
      <option value="">Semua Data</option>
      {options.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  </div>
);

const TaskRow = ({ task, index, isExpanded, onToggle, onApprove }) => {
  const primaryData = task.additionalData?.[0] || {};
  const hasPecahan = task.additionalData?.length > 1;
  const { uiHelpers } = task;

  return (
    <React.Fragment>
      <tr className="hover:bg-slate-50/80 transition-all group border-b border-slate-100">
        <td className="px-4 py-4 text-center">
          <span className="text-[11px] font-bold text-slate-600 font-mono">
            {index}
          </span>
        </td>

        <td className="px-4 py-4">
          <div className="flex flex-col gap-0.5 whitespace-nowrap">
            <span className="text-[13px] font-bold text-slate-700 leading-none">
              {formatDateId(task.createdAt)}
            </span>
            <span className="text-[11px] text-slate-600 font-bold capitalize tracking-tight">
              Oleh:{" "}
              {task.createdBy?.name?.split(" ")[0]?.toLowerCase() || "system"}
            </span>
          </div>
        </td>

        <td className="px-4 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold text-emerald-700 leading-none uppercase">
              {task.mainData?.nopel || "TIDAK ADA NOPEL"}
            </span>
            <span className="text-[11px] text-slate-600 font-bold font-mono tracking-tight">
              {task.mainData?.nop}
            </span>
          </div>
        </td>

        <td className="px-4 py-4">
          <div className="flex flex-col gap-0.5">
            <div className="text-[13px] font-bold text-slate-700 capitalize truncate max-w-[180px] leading-none">
              {(primaryData.newName || task.mainData?.oldName)?.toLowerCase()}
            </div>
            <div className="text-[11px] text-emerald-600 font-bold capitalize tracking-tight">
              {task.title?.toLowerCase()}
            </div>
          </div>
        </td>

        <td className="px-4 py-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 text-[11px] font-bold whitespace-nowrap">
              <span className="text-slate-400 w-4">T:</span>
              <span className="text-slate-700">
                {task.mainData?.oldlandWide || 0} m²
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold whitespace-nowrap">
              <span className="text-slate-400 w-4">B:</span>
              <span className="text-slate-600">
                {task.mainData?.oldbuildingWide || 0} m²
              </span>
            </div>
          </div>
        </td>

        <td className="px-4 py-4 text-center">
          <span className="inline-block px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100">
            {task.currentStage?.toLowerCase()}
          </span>
        </td>

        <td className="px-4 py-4 text-center">
          <div className="relative group/tooltip inline-block">
            <div
              className={`flex items-center px-3 py-1.5 rounded-lg border text-[11px] font-bold capitalize tracking-tight transition-all ${
                uiHelpers?.badgeColor === "green"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : uiHelpers?.badgeColor === "red"
                    ? "text-rose-700 bg-rose-50 border-rose-200"
                    : uiHelpers?.badgeColor === "orange"
                      ? "text-amber-700 bg-amber-50 border-amber-200"
                      : "text-slate-700 bg-slate-50 border-slate-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${uiHelpers?.badgeColor === "green" ? "bg-emerald-500" : uiHelpers?.badgeColor === "red" ? "bg-rose-500" : "bg-current animate-pulse"}`}
              />
              {uiHelpers?.displayStatus?.toLowerCase()}
            </div>
          </div>
        </td>

        <td className="px-4 py-4 text-right">
          <div className="flex items-center justify-end gap-3 min-w-[100px]">
            {hasPecahan && (
              <button
                onClick={onToggle}
                className={`p-2 rounded-lg border transition-all duration-300 ${isExpanded ? "bg-slate-800 text-white border-slate-800" : "bg-slate-50 text-slate-400 border-slate-200 hover:border-emerald-500 hover:text-emerald-500"}`}
              >
                <HiOutlineExternalLink
                  className={`w-4 h-4 ${isExpanded ? "rotate-45" : ""}`}
                />
              </button>
            )}
            <RowActions task={task} onApprove={() => onApprove(task)} />
          </div>
        </td>
      </tr>

      {isExpanded &&
        task.additionalData?.slice(1).map((pec, pIdx) => (
          <tr
            key={pec._id || pIdx}
            className="bg-slate-50/50 border-l-4 border-emerald-500"
          >
            <td className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 italic">
              {index}.{pIdx + 2}
            </td>
            <td colSpan={2} className="px-4 py-3">
              <div className="text-[11px] font-bold text-slate-500 capitalize italic">
                Data pecahan lainnya
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="text-[11px] font-bold text-slate-700 capitalize">
                {pec.newName?.toLowerCase()}
              </div>
              <div className="text-[10px] font-bold text-slate-500">
                {pec.certificate}
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="text-[11px] font-bold text-emerald-700">
                {pec.landWide} / {pec.buildingWide} m²
              </div>
            </td>
            <td
              colSpan={3}
              className="px-4 py-3 italic text-[11px] text-slate-500"
            >
              Status pecahan:{" "}
              <span className="font-bold text-slate-700 capitalize">
                {pec.addStatus?.toLowerCase() || "in progress"}
              </span>
            </td>
          </tr>
        ))}
    </React.Fragment>
  );
};

const ManageTask = () => {
  const initialFilters = {
    search: "",
    startDate: "",
    endDate: "",
    status: "",
    stage: "",
  };
  const [filterDraft, setFilterDraft] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [taskList, setTaskList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.get(API_PATHS.TASK.GET_ALL_TASKS, {
        params: { ...appliedFilters, page: currentPage, limit: 10 },
      });
      setTaskList(data?.tasks || []);
      setTotalCount(data?.pagination?.totalData || 0);
    } catch (err) {
      toast.error("Sinkronisasi data gagal");
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, currentPage]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDraftChange = (e) => {
    const { name, value } = e.target;
    setFilterDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filterDraft);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilterDraft(initialFilters);
    setAppliedFilters(initialFilters);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="max-w-[1600px] mx-auto py-8 px-6 space-y-8 animate-fadeIn">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-4">
              Monitoring Permohonan
              <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                Live
              </div>
            </h1>
            <p className="text-slate-400 text-xs font-semibold mt-1 tracking-wide capitalize">
              Kelola dan pantau alur kerja pelayanan pajak bumi dan bangunan
              secara real-time
            </p>
          </div>

          <button
            onClick={handleReset}
            className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-600 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all active:scale-95"
          >
            <HiOutlineRefresh
              className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-500" : "group-hover:rotate-180 transition-transform duration-500"}`}
            />
            Reset Filter
          </button>
        </div>

        <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner flex flex-col lg:flex-row items-end gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 flex-grow w-full">
            <FilterInput
              label="Pencarian"
              name="search"
              value={filterDraft.search}
              onChange={handleDraftChange}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              icon={HiOutlineSearch}
              placeholder="Nopel / Nama..."
            />
            <FilterSelect
              label="Status"
              name="status"
              value={filterDraft.status}
              onChange={handleDraftChange}
              options={[
                { v: "proses", l: "Proses" },
                { v: "revisi", l: "Revisi" },
                { v: "selesai", l: "Selesai" },
                { v: "ditolak", l: "Ditolak" },
              ]}
            />
            <FilterSelect
              label="Tahapan"
              name="stage"
              value={filterDraft.stage}
              onChange={handleDraftChange}
              options={[
                { v: "diinput", l: "Diinput" },
                { v: "ditata", l: "Ditata" },
                { v: "diteliti", l: "Diteliti" },
                { v: "diarsipkan", l: "Diarsipkan" },
                { v: "dikirim", l: "Dikirim" },
                { v: "diperiksa", l: "Diperiksa" },
                { v: "selesai", l: "Selesai" },
              ]}
            />
            <FilterInput
              label="Mulai"
              name="startDate"
              type="date"
              value={filterDraft.startDate}
              onChange={handleDraftChange}
            />
            <FilterInput
              label="Sampai"
              name="endDate"
              type="date"
              value={filterDraft.endDate}
              onChange={handleDraftChange}
            />
          </div>
          <button
            onClick={handleApplyFilters}
            className="w-full lg:w-auto px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <HiFilter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-800 text-slate-200 text-[10px] font-bold tracking-wider">
                  <th className="px-4 py-5 text-center w-12">No</th>
                  <th className="px-4 py-5">Tgl Masuk</th>
                  <th className="px-4 py-5">Nopel & NOP</th>
                  <th className="px-4 py-5">Nama Pemohon & Layanan</th>
                  <th className="px-4 py-5">Luas T / B</th>
                  <th className="px-4 py-5 text-center">Tahapan</th>
                  <th className="px-4 py-5 text-center">Status</th>
                  <th className="px-4 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading
                  ? Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan="8" className="px-6 py-8">
                            <div className="h-5 bg-slate-100 rounded-full w-full" />
                          </td>
                        </tr>
                      ))
                  : taskList.map((task, idx) => (
                      <TaskRow
                        key={task.id || task._id}
                        index={(currentPage - 1) * 10 + idx + 1}
                        task={task}
                        isExpanded={expandedRows[task.id || task._id]}
                        onToggle={() =>
                          setExpandedRows((p) => ({
                            ...p,
                            [task.id || task._id]: !p[task.id || task._id],
                          }))
                        }
                        onApprove={(t) => setSelectedTask(t)}
                      />
                    ))}
              </tbody>
            </table>
          </div>

          {!isLoading && taskList.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center text-slate-400 space-y-4 bg-slate-50/20">
              <HiOutlineInbox className="w-12 h-12 text-slate-200" />
              <h3 className="text-base font-black text-slate-600 uppercase tracking-widest">
                Tidak Ada Data Ditemukan
              </h3>
              <p className="text-sm text-slate-400 font-medium">
                Maaf, kami tidak menemukan berkas yang sesuai dengan filter
                Anda.
              </p>
            </div>
          )}

          <div className="p-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/30 gap-6">
            <span className="text-[10px] font-bold text-slate-500 capitalize tracking-widest bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
              Total berkas: {totalCount}
            </span>
            <Pagination
              page={currentPage}
              totalPages={Math.ceil(totalCount / 10) || 1}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {selectedTask && (
          <VerificationModal
            taskData={taskList.find(
              (t) => (t.id || t._id) === (selectedTask.id || selectedTask._id),
            )}
            onClose={() => setSelectedTask(null)}
            onSuccess={() => {
              setSelectedTask(null);
              fetchTasks();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageTask;
