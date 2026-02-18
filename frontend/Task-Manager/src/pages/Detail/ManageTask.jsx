import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Pagination from "../../components/ui/Pagination";
import VerificationModal from "../../components/modals/VerificationModal";
import RowActions from "../../components/actions/RowActions";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDateId } from "../../utils/formatDateId";
import toast from "react-hot-toast";
import { HiOutlineRefresh, HiOutlineSearch, HiOutlineInbox, HiOutlineInformationCircle } from "react-icons/hi";

const FilterInput = ({ label, icon: Icon, ...props }) => (
  <div className="group space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest group-focus-within:text-emerald-500 transition-colors">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
      <input {...props} className={`w-full ${Icon ? 'pl-10' : 'px-4'} py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:text-slate-300`} />
    </div>
  </div>
);

const FilterSelect = ({ label, options, ...props }) => (
  <div className="group space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest group-focus-within:text-emerald-500 transition-colors">{label}</label>
    <select {...props} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none cursor-pointer focus:border-emerald-500 transition-all">
      <option value="">Semua Data</option>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

const TaskRow = ({ task, isExpanded, onToggle, onApprove }) => {
  const primaryData = task.additionalData?.[0] || {};
  const hasPecahan = task.additionalData?.length > 1;
  const statusLabel = task.status || "PROSES";
  const revisionNote = task.revisedHistory?.revisedNote || "Mohon lakukan perbaikan data.";

  return (
    <React.Fragment>
      <tr className="hover:bg-slate-50/50 transition-colors group">
        <td className="px-6 py-5 text-[12px] font-bold text-slate-500 font-mono">
          {task.createdAt ? formatDateId(task.createdAt) : "-"}
        </td>
        <td className="px-6 py-5">
          <div className="font-black text-slate-800 text-base tracking-tight">{task.nopel}</div>
          <div className="text-[11px] text-slate-400 font-mono uppercase font-bold">NOP: {task.nop}</div>
        </td>
        <td className="px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-black text-slate-700 uppercase tracking-tight leading-none">
              {primaryData.newName || "N/A"}
            </span>
            {hasPecahan && (
              <button onClick={onToggle} className={`w-fit text-[10px] px-2.5 py-1 rounded-lg border font-black transition-all shadow-sm ${isExpanded ? "bg-slate-800 text-white border-slate-800" : "bg-white text-indigo-600 border-indigo-100 hover:border-indigo-400"}`}>
                {isExpanded ? "TUTUP" : `+${task.additionalData.length - 1} PECAHAN LAIN`}
              </button>
            )}
          </div>
        </td>
        <td className="px-6 py-5 text-center">
          <span className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-blue-50 text-blue-600 border-blue-100">
            {task.currentStage}
          </span>
        </td>
        <td className="px-6 py-5 text-center">
          <div className="relative group/tooltip inline-block">
            <div className={`inline-flex items-center px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-tighter shadow-sm cursor-help ${
              statusLabel === "SELESAI" ? "text-emerald-600 bg-emerald-50 border-emerald-200" : 
              statusLabel === "DITOLAK" ? "text-rose-600 bg-rose-50 border-rose-200" : 
              statusLabel === "REVISI" ? "text-amber-600 bg-amber-50 border-amber-200" :
              "text-slate-600 bg-slate-50 border-slate-200"
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${statusLabel === "SELESAI" ? 'bg-emerald-500' : statusLabel === "DITOLAK" ? 'bg-rose-500' : 'bg-current animate-pulse'}`} />
              {statusLabel}
            </div>

            {statusLabel === "REVISI" && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                <p className="font-black text-amber-400 uppercase mb-1 tracking-widest flex items-center gap-1">
                   <HiOutlineInformationCircle /> Catatan Revisi:
                </p>
                <p className="font-medium leading-relaxed">{revisionNote}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
              </div>
            )}
          </div>
        </td>
        <td className="px-6 py-5 text-center">
          <RowActions task={task} onApprove={() => onApprove(task)} />
        </td>
      </tr>
      
      {isExpanded && task.additionalData?.slice(1).map((pec, pIdx) => (
        <tr key={pec._id || pIdx} className="bg-slate-50/30 border-l-4 border-indigo-500 animate-slideDown shadow-inner">
          <td className="px-6 py-4"></td>
          <td className="px-6 py-4 text-[11px] font-black text-slate-400 text-right uppercase tracking-widest">Pecahan {pIdx + 2}</td>
          <td className="px-6 py-4">
              <div className="text-[12px] font-black text-slate-700 uppercase">{pec.newName}</div>
              <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase mt-0.5 ${pec.addStatus === 'approved' ? 'text-emerald-500' : 'text-slate-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pec.addStatus === 'approved' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                {pec.addStatus || 'in_progress'}
              </div>
          </td>
          <td className="px-6 py-4 text-center" colSpan={3}>
            <div className="inline-block text-[11px] font-black text-indigo-500 bg-white px-5 py-2 rounded-full border border-indigo-100 shadow-sm">
              Luas T: {pec.landWide} m² • Luas B: {pec.buildingWide} m²
            </div>
          </td>
        </tr>
      ))}
    </React.Fragment>
  );
};

const ManageTask = () => {
  const initialFilters = { search: "", startDate: "", endDate: "", status: "", stage: "" };
  const [taskList, setTaskList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(filters.search), 500);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.get(API_PATHS.TASK.GET_ALL_TASKS, {
        params: { 
          nopel: debouncedSearch, 
          startDate: filters.startDate, 
          endDate: filters.endDate, 
          status: filters.status, 
          currentStage: filters.stage, 
          page: currentPage, 
          limit: 10 
        },
      });
      setTaskList(data?.tasks || []);
      setTotalCount(data?.total || 0);
    } catch (err) {
      toast.error("Gagal sinkronisasi data");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filters, currentPage]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Fungsi Reaktif untuk Checklist agar tidak hilang saat modal ditutup
  const handleItemUpdate = (taskId, itemId, newStatus) => {
    setTaskList(prevList => 
      prevList.map(task => {
        if ((task.id || task._id) === taskId) {
          return {
            ...task,
            additionalData: task.additionalData.map(item => 
              item._id === itemId ? { ...item, addStatus: newStatus } : item
            )
          };
        }
        return task;
      })
    );
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="max-w-7xl mx-auto py-6 space-y-6 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            Monitoring Berkas 
            <span className="text-emerald-500 text-[9px] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest font-black">System Ready</span>
          </h1>
          <button 
            onClick={() => { setFilters(initialFilters); setCurrentPage(1); }} 
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <HiOutlineRefresh className={isLoading ? "animate-spin" : ""} /> RESET FILTER
          </button>
        </div>

        {/* Filter Card */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <FilterInput label="Cari Nopel / NOP" name="search" value={filters.search} onChange={handleFilterChange} icon={HiOutlineSearch} placeholder="Contoh: 32.01..." />
          <FilterSelect 
            label="Status" 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange} 
            options={[
              {v:"PROSES", l:"Dalam Proses"},
              {v:"REVISI", l:"Perlu Revisi"},
              {v:"SELESAI", l:"Selesai (Final)"},
              {v:"DITOLAK", l:"Ditolak (Final)"}
            ]} 
          />
          <FilterSelect 
            label="Tahapan" 
            name="stage" 
            value={filters.stage} 
            onChange={handleFilterChange} 
            options={[
              {v:"diinput", l:"Penginputan"},
              {v:"ditata", l:"Penataan"},
              {v:"diteliti", l:"Penelitian"},
              {v:"diperiksa", l:"Pemeriksaan"},
              {v:"dikirim", l:"Pengiriman"},
              {v:"diarsipkan", l:"Pengarsipan"},
              {v:"selesai", l:"Selesai"}
            ]} 
          />
          <FilterInput label="Tgl Mulai" name="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} />
          <FilterInput label="Tgl Akhir" name="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} />
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b">
                  <th className="px-6 py-5">Tgl Masuk</th>
                  <th className="px-6 py-5">Identitas Berkas</th>
                  <th className="px-6 py-5">Nama Pemohon Utama</th>
                  <th className="px-6 py-5 text-center">Tahapan Aktif</th>
                  <th className="px-6 py-5 text-center">Status Berkas</th>
                  <th className="px-6 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                   Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-50">
                      <td colSpan="6" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded-full w-full"></div></td>
                    </tr>
                   ))
                ) : taskList.map(task => (
                  <TaskRow 
                    key={task.id || task._id} 
                    task={task} 
                    isExpanded={expandedRows[task.id || task._id]} 
                    onToggle={() => setExpandedRows(p => ({...p, [task.id || task._id]: !p[task.id || task._id]}))} 
                    onApprove={(t) => setSelectedTask(t)} 
                  />
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && taskList.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <HiOutlineInbox className="w-12 h-12 opacity-20" />
              <div className="text-center">
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Data Kosong</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Gunakan filter lain untuk mencari data</p>
              </div>
            </div>
          )}

          <div className="p-6 border-t flex flex-col sm:flex-row justify-between items-center bg-slate-50/30 gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border shadow-sm">
              Total Database: {totalCount} Berkas
            </span>
            <Pagination 
              page={currentPage} 
              totalPages={Math.ceil(totalCount / 10) || 1} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </div>

        {/* Modal Verifikasi */}
        {selectedTask && (
          <VerificationModal 
            taskData={taskList.find(t => (t.id || t._id) === (selectedTask.id || selectedTask._id))} 
            onClose={() => setSelectedTask(null)} 
            onItemUpdate={handleItemUpdate}
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
