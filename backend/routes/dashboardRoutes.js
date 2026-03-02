const express = require("express");
const { protect } = require("../middlewares/authMiddlewares");

const {
  getCardTasks,
  getDelayedTasks,
  getSubdistrictBarChart,
  getVillageBarChart
} = require("../modules/dashboard/dashboard.controller");

const router = express.Router();

router.get("/get-card-task", protect, getCardTasks);
router.get("/get-delayed-task", protect, getDelayedTasks);
router.get("/get-subdistrict-chart", protect, getSubdistrictBarChart);
router.get("/get-village-chart", protect, getVillageBarChart);

module.exports = router;
