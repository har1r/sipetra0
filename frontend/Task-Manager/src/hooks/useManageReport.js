import { useState, useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { reportService } from "../services/reportService";

export const useManageReport = () => {
  const ctrlRef = useRef(null);
  const historyTableRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    totalData: 0,
    totalPages: 1,
  });

  const [filterDraft, setFilterDraft] = useState({
    nopel: "",
    startDate: "",
    endDate: "",
    sortOrder: "desc",
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filterDraft });

  const [attachmentForm, setAttachmentForm] = useState({
    isOpen: false,
    taskId: null,
    nopel: "",
    fileName: "",
    driveLink: "",
  });

  console.log(attachmentForm);

  const fetchData = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setIsLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: 10,
        sortOrder: appliedFilters.sortOrder,
        ...(appliedFilters.nopel.trim() && {
          nopel: appliedFilters.nopel.trim(),
        }),
        ...(appliedFilters.startDate && {
          startDate: appliedFilters.startDate,
        }),
        ...(appliedFilters.endDate && {
          endDate: appliedFilters.endDate,
        }),
      };

      const data = await reportService.getVerifiedTasks(params, ctrl.signal);
      setTasks(data?.result?.tasks || []);
      setPagination((prev) => ({
        ...prev,
        totalData: data?.result?.pagination?.totalData || 0,
        totalPages: data?.result?.pagination?.totalPages || 1,
      }));
    } catch (err) {
      if (err?.name !== "CanceledError") toast.error("Gagal sinkronisasi data");
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, pagination.current]);

  useEffect(() => {
    fetchData();
    return () => ctrlRef.current?.abort();
  }, [fetchData]);

  const actions = {
    setFilterDraft,
    applyFilter: () => {
      setAppliedFilters(filterDraft);
      setPagination((page) => ({ ...page, current: 1 }));
    },
    resetFilter: () => {
      const init = { nopel: "", startDate: "", endDate: "", sortOrder: "desc" };
      setFilterDraft(init);
      setAppliedFilters(init);
      setPagination((page) => ({ ...page, current: 1 }));
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
      setIsExporting(true);
      const tid = toast.loading("Menyiapkan nomor pengantar...");
      try {
        const res = await reportService.createBatch(selectedIds);
        const { message } = res.data;
        toast.success(message, { id: tid });
        setSelectedIds([]);
        fetchData();
        historyTableRef.current?.refresh?.();
      } catch (err) {
        toast.error(err.response?.data?.message || "Gagal", { id: tid });
      } finally {
        setIsExporting(false);
      }
    },
    printPartial: async (id) => {
      const tid = toast.loading("Membuka dokumen...");
      try {
        const res = await reportService.downloadPartialMutation(id);
        const url = URL.createObjectURL(
          new Blob([res.data], { type: "application/pdf" }),
        );
        window.open(url, "_blank");
        toast.success("Berhasil", { id: tid });
      } catch (err) {
        toast.error("Gagal cetak", { id: tid });
      }
    },
    openAttachmentModal: (task) => {
      setAttachmentForm({
        isOpen: true,
        taskId: task._id,
        nopel: task.nopel,
        fileName: "",
        driveLink: "",
      });
    },
    closeAttachmentModal: () =>
      setAttachmentForm((p) => ({ ...p, isOpen: false })),

    updateAttachmentField: (name, value) =>
      setAttachmentForm((p) => ({ ...p, [name]: value })),

    submitAttachment: async (e) => {
      if (e) e.preventDefault();
      const { taskId, fileName, driveLink } = attachmentForm;
      const tid = toast.loading("Menyimpan lampiran...");

      try {
        const res = await reportService.addAttachmentToTask(taskId, {
          fileName,
          driveLink,
        });
        // Update state lokal
        setTasks((prev) =>
          prev.map((t) =>
            t._id === taskId ? { ...t, attachments: res.data.attachments } : t,
          ),
        );
        toast.success("Lampiran berhasil ditambahkan", { id: tid });
        setAttachmentForm({
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
  };

  return {
    state: {
      tasks,
      isLoading,
      isExporting,
      selectedIds,
      pagination,
      filterDraft,
      attachmentForm,
    },
    actions,
    refs: { historyTableRef },
  };
};
