const express = require("express");
const { protect } = require("../middlewares/authMiddlewares");

const {
  getCardTasks,
  getDelayedTasks,
} = require("../modules/dashboard/dashboard.controller");

const router = express.Router();

router.get("/get-card-task", protect, getCardTasks);
router.get("/get-delayed-task", protect, getDelayedTasks);

module.exports = router;
