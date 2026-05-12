const OtherProject = require("../Models/otherProjectModel");

const getAllProjects = async (req, res) => {
  try {
    const projects = await OtherProject.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, description, img } = req.body;
    const project = new OtherProject({ title, description, img });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, img } = req.body;
    const project = await OtherProject.findByIdAndUpdate(
      id,
      { title, description, img },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await OtherProject.findByIdAndDelete(id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllProjects, createProject, updateProject, deleteProject };
