import React from "react";
import {
  HiOutlineRefresh,
  HiOutlineLink,
  HiOutlineInbox,
} from "react-icons/hi";
import { FaSquareCheck, FaRegSquare } from "react-icons/fa6";
import { useManageReport } from "../../hooks/useManageReport";

// UI Components
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Pagination from "../../components/ui/Pagination";
import TaskTableRow from "../../components/tables/TaskTableRow";
import ReportTableRow from "../../components/tables/ReportTableRow";
import FilterSection from "../../components/filters/FilterSection";
import AddAttachmentModal from "../../components/input/AddReportAttachmentModal";
import VoidConfirmationModal from "../../components/modals/VoidConfirmationModal";

const ReportHistory = () => {
  const { state, actions } = useManageReport();

  return (
    <DashboardLayout activeMenu="Riwayat Pengantar">
      <div className="max-w-[1600px] mx-auto py-8 px-6 space-y-8 animate-fadeIn">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-4">
              Cetak Pengantar
              <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest shadow-lg">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                Valid
              </div>
            </h1>
            <p className="text-slate-400 text-xs font-semibold mt-1 tracking-wide uppercase">
              Kumpulkan permohonan tervalidasi ke dalam satu surat pengantar
              kolektif.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={actions.resetTaskFilter}
              className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-600 shadow-sm hover:border-emerald-500 transition-all active:scale-95"
            >
              <HiOutlineRefresh
                className={`w-4 h-4 ${state.isTaskLoading ? "animate-spin text-emerald-500" : "group-hover:rotate-180 transition-transform duration-500"}`}
              />
              Reset Filter
            </button>
            <button
              onClick={actions.createBatch}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-[11px] font-bold shadow-lg hover:bg-slate-900 transition-all disabled:opacity-50 active:scale-95"
            >
              <HiOutlineLink className="w-4 h-4" />
              Surat Pengantar ({state.selectedIds.length})
            </button>
          </div>
        </div>

        {/* Filter Section - Komponen Refactor */}
        <FilterSection
          configs={state.taskFilterConfigs}
          filterDraft={state.filterTaskDraft}
          setFilterDraft={actions.setFilterTaskDraft}
          onApply={actions.applyTaskFilter}
          isLoading={state.isTaskLoading}
        />

        {/* Table Section */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-800 text-slate-200 text-[10px] font-bold tracking-wider uppercase">
                <tr>
                  <th className="px-6 py-5 text-center w-16">
                    <button
                      onClick={actions.toggleSelectAll}
                      className="text-lg transition-all active:scale-90"
                    >
                      {state.selectedIds.length === state.tasks.length &&
                      state.tasks.length > 0 ? (
                        <FaSquareCheck className="text-emerald-400" />
                      ) : (
                        <FaRegSquare className="text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-5">Nopel & Nop</th>
                  <th className="px-4 py-5">Wajib Pajak & Layanan</th>
                  <th className="px-4 py-5 text-center">No. Pengantar</th>
                  <th className="px-4 py-5 text-center">Tgl Verifikasi</th>
                  <th className="px-4 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.isTaskLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="6" className="px-6 py-8">
                          <div className="h-5 bg-slate-100 rounded-full w-full" />
                        </td>
                      </tr>
                    ))
                ) : state.tasks.length > 0 ? (
                  state.tasks.map((task) => (
                    <TaskTableRow
                      key={task._id}
                      task={task}
                      isSelected={state.selectedIds.includes(task._id)}
                      onSelect={() => actions.toggleSelectOne(task._id)}
                      onPrint={() => actions.printPartial(task._id)}
                      onAddLink={() => actions.openTaskAttachmentModal(task)}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <HiOutlineInbox className="w-12 h-12 text-slate-200" />
                        </div>
                        <h3 className="text-base font-black text-slate-600 uppercase tracking-widest">
                          Tidak Ada Data
                        </h3>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          <div className="p-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/30 gap-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
              Total: {state.taskPagination.totalData} Permohonan
            </span>
            <Pagination
              page={state.taskPagination.currentPage}
              totalPages={state.taskPagination.totalPages}
              totalData={state.taskPagination.totalData}
              onPageChange={(newPage) => {
                actions.setTaskPage(newPage);
              }}
            />
          </div>
        </div>

        {/* History Table Section */}
        <div className="space-y-6 pt-10">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {/* Warna aksen diubah ke Indigo untuk membedakan dengan bagian atas */}
              <div className="h-6 w-1 bg-indigo-500 rounded-full" />
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Riwayat Surat Pengantar
              </h2>
            </div>

            <button
              onClick={actions.resetReportFilter}
              className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-600 shadow-sm hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95"
            >
              <HiOutlineRefresh
                className={`w-4 h-4 ${
                  state.isReportLoading
                    ? "animate-spin text-indigo-500"
                    : "group-hover:rotate-180 transition-transform duration-500"
                }`}
              />
              Reset Filter
            </button>
          </div>

          <FilterSection
            configs={state.reportFilterConfigs}
            filterDraft={state.filterReportDraft}
            setFilterDraft={actions.setFilterReportDraft}
            onApply={actions.applyReportFilter}
            isLoading={state.isReportLoading}
          />
        </div>

        {/* Table Section - Perubahan pada border dan shadow agar lebih 'deep' */}
        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-md shadow-slate-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              {/* Header menggunakan Gradient Slate ke Indigo-900 agar lebih premium */}
              <thead className="bg-gradient-to-r from-slate-800 to-indigo-950 text-slate-200 text-[10px] font-bold tracking-wider uppercase">
                <tr>
                  <th className="px-8 py-6 border-r border-white/5">
                    Detail Batch & Admin
                  </th>
                  <th className="px-6 py-6 text-center border-r border-white/5">
                    Status
                  </th>
                  <th className="px-6 py-6 text-center border-r border-white/5">
                    Tanggal Update
                  </th>
                  <th className="px-8 py-6 text-right">Aksi</th>
                </tr>
              </thead>

              {/* Body dengan hover effect berwarna Indigo muda */}
              <tbody className="divide-y divide-slate-100">
                {state.isReportLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="6" className="px-6 py-8">
                          <div className="h-5 bg-slate-100 rounded-full w-full" />
                        </td>
                      </tr>
                    ))
                ) : state.reports.length > 0 ? (
                  state.reports.map((report) => (
                    <ReportTableRow
                      key={report._id}
                      report={report}
                      onPrint={() => actions.printReport(report._id)}
                      onAddLink={() =>
                        actions.openReportAttachmentModal(report)
                      }
                      onVoid={() => actions.openVoidModal(report)}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                          <HiOutlineInbox className="w-14 h-14 text-indigo-200" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest">
                            Belum Ada Riwayat
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Data surat pengantar yang telah diproses akan muncul
                            di sini.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Section - Warna tombol diubah agar kontras */}
          <div className="p-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-indigo-50/20 gap-6">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white px-6 py-3 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              Total: {state.reportPagination.totalData} Laporan
            </span>
           <Pagination
              page={state.reportPagination.currentPage}
              totalPages={state.reportPagination.totalPages}
              totalData={state.reportPagination.totalData}
              onPageChange={(newPage) => {
                actions.setReportPage(newPage);
              }}
            />
          </div>
        </div>

        <AddAttachmentModal
          isOpen={state.taskAttachmentForm.isOpen}
          formData={state.taskAttachmentForm}
          onUpdateField={actions.updateTaskAttachmentField}
          onClose={actions.closeTaskAttachmentModal}
          onSubmit={actions.submitTaskAttachment}
        />

        <AddAttachmentModal
          isOpen={state.reportAttachmentForm.isOpen}
          formData={state.reportAttachmentForm}
          onUpdateField={actions.updateReportAttachmentField}
          onClose={actions.closeReportAttachmentModal}
          onSubmit={actions.submitReportAttachment}
        />
      </div>

      <VoidConfirmationModal
        isOpen={state.voidConfirm.isOpen}
        batchId={state.voidConfirm.batchId}
        onClose={actions.closeVoidModal}
        onConfirm={actions.confirmVoidReport}
      />
    </DashboardLayout>
  );
};

export default ReportHistory;
