const express = require("express");
const router = express.Router();
const AgentTemplate = require("../models/AgentTemplate");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

// Get all public agent templates
router.get("/", async (req, res) => {
  try {
    const templates = await AgentTemplate.find({ isPublic: true });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific agent template
router.get("/:id", async (req, res) => {
  try {
    const template = await AgentTemplate.findOne({ id: req.params.id });
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new agent template (admin only)
router.post("/", auth, adminAuth, async (req, res) => {
  try {
    const { id, name, prompt, category, isDefault, isPublic } = req.body;

    // Check if template with this ID already exists
    const existingTemplate = await AgentTemplate.findOne({ id });
    if (existingTemplate) {
      return res.status(400).json({ message: "Template ID already exists" });
    }

    const template = new AgentTemplate({
      id,
      name,
      prompt,
      category: category || "general",
      isDefault: isDefault || false,
      isPublic: isPublic !== undefined ? isPublic : true,
      createdBy: req.user.id,
    });

    const savedTemplate = await template.save();
    res.status(201).json(savedTemplate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update an agent template (admin only)
router.put("/:id", auth, adminAuth, async (req, res) => {
  try {
    const { name, prompt, category, isDefault, isPublic } = req.body;

    const template = await AgentTemplate.findOne({ id: req.params.id });
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (name) template.name = name;
    if (prompt) template.prompt = prompt;
    if (category) template.category = category;
    if (isDefault !== undefined) template.isDefault = isDefault;
    if (isPublic !== undefined) template.isPublic = isPublic;

    const updatedTemplate = await template.save();
    res.json(updatedTemplate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an agent template (admin only)
router.delete("/:id", auth, adminAuth, async (req, res) => {
  try {
    const template = await AgentTemplate.findOne({ id: req.params.id });
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    await template.remove();
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initialize default templates
router.post("/init-defaults", auth, adminAuth, async (req, res) => {
  try {
    // Check if we already have templates
    const existingCount = await AgentTemplate.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({
        message: "Templates already exist. Cannot initialize defaults.",
      });
    }

    // Default templates will be added in a separate script
    res
      .status(200)
      .json({ message: "Default templates initialization endpoint" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
