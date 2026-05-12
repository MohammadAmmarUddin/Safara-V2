const express = require("express");
const router = express.Router();
const {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
} = require("../Controllers/otherProjectController");

router.get("/", getAllProjects);
router.post("/", createProject);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);

module.exports = router;
