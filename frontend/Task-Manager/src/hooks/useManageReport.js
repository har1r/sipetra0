import { useState, useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { reportService } from "../services/reportService";
import { HiOutlineSearch } from "react-icons/hi";

export const useManageReport = () => {
  const taskCtrlRef = useRef(null);
  const reportCtrlRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);

  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const [taskPagination, setTaskPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalData: 0,
    limit: 10,
    HasNextPage: false,
    HasPrevPage: false,
    activeSort: "terbaru",
  });
  const [reportPagination, setReportPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalData: 0,
    limit: 10,
    HasNextPage: false,
    HasPrevPage: false,
    activeSort: "terbaru",
  });

  // Kode untuk tasks
  const [isExporting, setIsCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const taskFilterConfigs = [
    {
      id: "nopel",
      label: "Pencarian Nopel",
      icon: HiOutlineSearch,
      placeholder: "Masukkan Nopel...",
    },
    { id: "startDate", label: "Mulai Tanggal", type: "date" },
    { id: "endDate", label: "Sampai Tanggal", type: "date" },
    {
      id: "sortOrder",
      label: "Urutan",
      type: "select",
      options: [
        { label: "Terbaru", value: "desc" },
        { label: "Terlama", value: "asc" },
      ],
    },
  ];

  const [filterTaskDraft, setFilterTaskDraft] = useState({
    nopel: "",
    startDate: "",
    endDate: "",
    sortOrder: "desc",
  });

  const [appliedTaskFilters, setAppliedTaskFilters] = useState({
    ...filterTaskDraft,
  });
  const [taskAttachmentForm, setTaskAttachmentForm] = useState({
    isOpen: false,
    taskId: null,
    nopel: "",
    fileName: "",
    driveLink: "",
  });
  const fetchVerifiedTaskDatas = useCallback(async () => {
    taskCtrlRef.current?.abort();
    const ctrl = new AbortController();
    taskCtrlRef.current = ctrl;

    setIsTaskLoading(true);
    try {
      const params = {
        page: taskPagination.currentPage,
        limit: 10,
        sortOrder: appliedTaskFilters.sortOrder,
        ...(appliedTaskFilters.nopel.trim() && {
          nopel: appliedTaskFilters.nopel.trim(),
        }),
        ...(appliedTaskFilters.startDate && {
          startDate: appliedTaskFilters.startDate,
        }),
        ...(appliedTaskFilters.endDate && {
          endDate: appliedTaskFilters.endDate,
        }),
      };

      const data = await reportService.getVerifiedTasks(params, ctrl.signal);

      setTasks(data?.result?.tasks || []);
      setTaskPagination(data?.result?.pagination);
    } catch (err) {
      if (err?.name !== "CanceledError") toast.error("Gagal sinkronisasi data");
    } finally {
      setIsTaskLoading(false);
    }
  }, [appliedTaskFilters, taskPagination.currentPage]);

  useEffect(() => {
    fetchVerifiedTaskDatas();
    return () => taskCtrlRef.current?.abort();
  }, [fetchVerifiedTaskDatas]);
  // Kode untuk tasks

  // Kode untuk reports
  const [voidConfirm, setVoidConfirm] = useState({
    isOpen: false,
    reportId: null,
    batchId: "",
  });
  const [reportAttachmentForm, setReportAttachmentForm] = useState({
    isOpen: false,
    reportId: null,
    batchId: "",
    fileName: "",
    driveLink: "",
  });
  const reportFilterConfigs = [
    {
      id: "batchId",
      label: "ID Batch",
      icon: HiOutlineSearch,
      placeholder: "Masukkan ID Batch...",
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Semua Status", value: "" },
        { label: "Final", value: "FINAL" },
        { label: "Void", value: "VOID" },
      ],
    },
    { id: "startDate", label: "Mulai", type: "date" },
    { id: "endDate", label: "Sampai", type: "date" },
    {
      id: "sortOrder",
      label: "Urutan",
      type: "select",
      options: [
        { label: "Terbaru", value: "desc" },
        { label: "Terlama", value: "asc" },
      ],
    },
  ];

  const [filterReportDraft, setFilterReportDraft] = useState({
    batchId: "",
    status: "",
    startDate: "",
    endDate: "",
    sortOrder: "desc",
  });
  const [appliedReportFilters, setAppliedReportFilters] = useState({
    ...filterReportDraft,
  });
  const fetchReportDatas = useCallback(async () => {
    reportCtrlRef.current?.abort();
    const ctrl = new AbortController();
    reportCtrlRef.current = ctrl;

    setIsReportLoading(true);
    try {
      const params = {
        page: reportPagination.currentPage,
        limit: 10,
        sortOrder: appliedReportFilters.sortOrder,
        ...(appliedReportFilters.batchId.trim() && {
          batchId: appliedReportFilters.batchId.trim(),
        }),
        ...(appliedReportFilters.status.trim() && {
          status: appliedReportFilters.status.trim(),
        }),
        ...(appliedReportFilters.startDate && {
          startDate: appliedReportFilters.startDate,
        }),
        ...(appliedReportFilters.endDate && {
          endDate: appliedReportFilters.endDate,
        }),
      };

      const data = await reportService.getReports(params, ctrl.signal);

      setReports(data?.result?.reports || []);
      setReportPagination(data?.result?.pagination);
    } catch (err) {
      if (err?.name !== "CanceledError") toast.error("Gagal sinkronisasi data");
    } finally {
      setIsReportLoading(false);
    }
  }, [appliedReportFilters, reportPagination.currentPage]);

  useEffect(() => {
    fetchReportDatas();
    return () => reportCtrlRef.current?.abort();
  }, [fetchReportDatas]);
  // Kode untuk reports

  const actions = {
    // Kode untuk tasks
    setFilterTaskDraft,
    applyTaskFilter: () => {
      setAppliedTaskFilters(filterTaskDraft);
      setTaskPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    resetTaskFilter: () => {
      const init = { nopel: "", startDate: "", endDate: "", sortOrder: "desc" };
      setFilterTaskDraft(init);
      setAppliedTaskFilters(init);
      setTaskPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    toggleSelectOne: (id) => {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
      );
    },
    toggleSelectAll: () => {
      setSelectedIds(
        selectedIds.length === tasks.length ? [] : tasks.map((t) => t._id),
      );
    },
    createBatch: async () => {
      if (selectedIds.length === 0)
        return toast.error("Pilih minimal satu berkas.");
      setIsCreating(true);
      const tid = toast.loading("Menyiapkan nomor pengantar...");
      try {
        const res = await reportService.createBatch(selectedIds);
        const { message } = res.data;
        toast.success(message, { id: tid });
        setSelectedIds([]);
        fetchVerifiedTaskDatas();
        fetchReportDatas();
      } catch (err) {
        toast.error(err.response?.data?.message || "Gagal", { id: tid });
      } finally {
        setIsCreating(false);
      }
    },
    printPartial: async (id) => {
      const tid = toast.loading("Membuka dokumen...");
      try {
        const res = await reportService.generatePartialMutation(id);
        const url = URL.createObjectURL(
          new Blob([res.data], { type: "application/pdf" }),
        );
        window.open(url, "_blank");
        toast.success("Berhasil", { id: tid });
      } catch (err) {
        toast.error("Gagal cetak", { id: tid });
      }
    },
    openTaskAttachmentModal: (task) => {
      setTaskAttachmentForm({
        isOpen: true,
        taskId: task._id,
        nopel: task.nopel,
        fileName: "",
        driveLink: "",
      });
    },
    closeTaskAttachmentModal: () =>
      setTaskAttachmentForm((p) => ({ ...p, isOpen: false })),

    updateTaskAttachmentField: (name, value) =>
      setTaskAttachmentForm((p) => ({ ...p, [name]: value })),

    submitTaskAttachment: async (e) => {
      if (e) e.preventDefault();
      const { taskId, fileName, driveLink } = taskAttachmentForm;
      const tid = toast.loading("Menyimpan lampiran...");

      try {
        const res = await reportService.addAttachmentToTask(taskId, {
          fileName,
          driveLink,
        });
        // Update state lokal
        setTasks((prev) =>
          prev.map((t) =>
            t._id === taskId ? { ...t, attachment: res.data.attachment } : t,
          ),
        );
        toast.success("Lampiran berhasil ditambahkan", { id: tid });
        setTaskAttachmentForm({
          isOpen: false,
          taskId: null,
          nopel: "",
          fileName: "",
          driveLink: "",
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Gagal simpan", { id: tid });
      }
    },
    setTaskPage: (newPage) => {
      setTaskPagination((prev) => ({ ...prev, currentPage: newPage }));
    },
    // Kode untuk tasks

    // Kode untuk reports
    setFilterReportDraft,
    applyReportFilter: () => {
      setAppliedReportFilters(filterReportDraft);
      setReportPagination((page) => ({ ...page, current: 1 }));
    },
    resetReportFilter: () => {
      const init = {
        batchId: "",
        status: "",
        startDate: "",
        endDate: "",
        sortOrder: "desc",
      };
      setFilterReportDraft(init);
      setAppliedReportFilters(init);
      setReportPagination((page) => ({ ...page, current: 1 }));
    },
    printReport: async (id) => {
      const tid = toast.loading("Membuka dokumen...");
      try {
        const res = await reportService.generateReport(id);
        const url = URL.createObjectURL(
          new Blob([res.data], { type: "application/pdf" }),
        );
        window.open(url, "_blank");
        toast.success("Berhasil", { id: tid });
      } catch (err) {
        toast.error("Gagal cetak", { id: tid });
      }
    },
    openReportAttachmentModal: (report) => {
      setReportAttachmentForm({
        isOpen: true,
        reportId: report._id,
        batchId: report.batchId,
        fileName: "",
        driveLink: "",
      });
    },
    closeReportAttachmentModal: () =>
      setReportAttachmentForm((p) => ({ ...p, isOpen: false })),

    updateReportAttachmentField: (name, value) =>
      setReportAttachmentForm((p) => ({ ...p, [name]: value })),
    submitReportAttachment: async (e) => {
      if (e) e.preventDefault();
      const { reportId, fileName, driveLink } = reportAttachmentForm;
      const tid = toast.loading("Menyimpan lampiran...");

      try {
        const res = await reportService.addAttachmentToReport(reportId, {
          fileName,
          driveLink,
        });
        // Update state lokal
        setReports((prev) =>
          prev.map((r) =>
            r._id === reportId ? { ...r, attachment: res.data.attachment } : r,
          ),
        );
        toast.success("Lampiran berhasil ditambahkan", { id: tid });
        setReportAttachmentForm({
          isOpen: false,
          reportId: null,
          batchId: "",
          fileName: "",
          driveLink: "",
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Gagal simpan", { id: tid });
      }
    },
    setReportPage: (newPage) => {
      setReportPagination((prev) => ({ ...prev, currentPage: newPage }));
    },

    openVoidModal: (report) => {
      setVoidConfirm({
        isOpen: true,
        reportId: report._id,
        batchId: report.batchId,
      });
    },
    closeVoidModal: () => setVoidConfirm({ isOpen: false, reportId: null, batchId: "" }),

    confirmVoidReport: async () => {
      const { reportId } = voidConfirm;
      const tid = toast.loading("Membatalkan surat pengantar...");
      
      try {
        await reportService.voidReport(reportId);
        toast.success("surat pengantar berhasil dibatalkan", { id: tid });

        fetchReportDatas();
        fetchVerifiedTaskDatas();
        
        actions.closeVoidModal();
        return true;
      } catch (err) {
        toast.error(err.response?.data?.message || "Gagal", { id: tid });
        return false;
      }
  },
    // Kode untuk reports
  };

  return {
    state: {
      // Kode untuk tasks
      tasks,
      isTaskLoading,
      isExporting,
      selectedIds,
      taskPagination,
      taskFilterConfigs,
      filterTaskDraft,
      taskAttachmentForm,
      // Kode untuk tasks

      // Kode untuk reports
      reports,
      isReportLoading,
      reportPagination,
      reportFilterConfigs,
      filterReportDraft,
      reportAttachmentForm,
      voidConfirm

      // Kode untuk reports
    },
    actions,
  };
};
