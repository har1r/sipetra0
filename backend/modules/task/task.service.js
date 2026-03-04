const repository = require("./task.repository");

const ROLE_STAGE_MAP = {
  diinput: "penginput",
  diteliti: "peneliti",
  diarsipkan: "pengarsip",
  dikirim: "pengirim",
  diperiksa: "pemeriksa",
  selesai: "admin",
};

// Helper internal service
const getBadgeColor = (status) => {
  const colors = { rejected: "red", revised: "orange", approved: "green" };
  return colors[status] || "blue";
};

const getTasksService = async (filters, pagination, user) => {
  const { page, limit } = pagination;
  const { tasks, totalCount } = await repository.findTasksWithPagination(
    filters,
    page,
    limit,
  );

  const role = String(user.role || "").toLowerCase();
  const isAdmin = role === "admin";

  const formattedTasks = tasks.map((task) => {
    const statusLabels = {
      rejected: "DITOLAK",
      approved: "SELESAI",
      revised: "REVISI",
      in_progress: "PROSES",
    };

    const requiredRole = ROLE_STAGE_MAP[task.currentStage];
    const hasRoleAccess = isAdmin || role === requiredRole;
    const isTerminal = ["approved", "rejected"].includes(task.overallStatus);
    const isAccessible = hasRoleAccess && !isTerminal;

    return {
      ...task,
      uiHelpers: {
        displayStatus: statusLabels[task.overallStatus] || "PROSES",
        isAccessible,
        canEdit: isAccessible,
        badgeColor: getBadgeColor(task.overallStatus),
      },
    };
  });

  return {
    tasks: formattedTasks,
    pagination: {
      totalData: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit: limit,
    },
  };
};

module.exports = { getTasksService };
