const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskControllers");
const { protect } = require("../middlewares/authMiddlewares");

// Terapkan middleware 'protect' ke seluruh route di file ini 
// agar tidak perlu menulisnya satu per satu di setiap baris
router.use(protect);

/**
 * --- ROUTES UNTUK DASHBOARD & STATISTIK ---
 */
router.get("/stats/admin", taskController.getAdminDashboardStats);
router.get("/stats/user", taskController.getUserDashboardStats);
router.get("/stats/performance", taskController.getAllUserPerformance);

/**
 * --- ROUTES UTAMA (CRUD & ACTIONS) ---
 */

// 1. Ambil semua task & Buat task baru
router.route("/")
  .get(taskController.getAllTasks)
  .post(taskController.createTask);

// 2. Operasi berdasarkan ID Task
router.route("/:taskId")
  .get(taskController.getTaskById)
  .patch(taskController.updateTask)   // Menggunakan PATCH untuk update data
  .delete(taskController.deleteTask);

// 3. Aksi Khusus: Approval/Status
router.patch("/:taskId/approve", taskController.updateTaskApproval);

module.exports = router;
