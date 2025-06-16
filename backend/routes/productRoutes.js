const express = require("express");
const Product = require("../models/Product");
const Chatbot = require("../models/Chatbot");
const auth = require("../middleware/auth");
const router = express.Router();

// Get all products for a specific chatbot
router.get("/chatbot/:chatbotId", auth, async (req, res) => {
  try {
    // Verify ownership of chatbot
    const chatbot = await Chatbot.findOne({
      _id: req.params.chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    const products = await Product.find({ chatbotId: req.params.chatbotId });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single product
router.get("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Verify ownership
    const chatbot = await Chatbot.findOne({
      _id: product.chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this product" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new product
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, price, imageUrl, category, inStock, chatbotId } =
      req.body;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(403)
        .json({ message: "Not authorized to add products to this chatbot" });
    }

    const product = new Product({
      name,
      description,
      price,
      imageUrl,
      category,
      inStock,
      chatbotId,
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a product
router.put("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: product.chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this product" });
    }

    const updates = req.body;

    // Apply updates
    Object.keys(updates).forEach((key) => {
      // Don't allow updating chatbotId
      if (key !== "chatbotId") {
        product[key] = updates[key];
      }
    });

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a product
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: product.chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this product" });
    }

    await Product.deleteOne({ _id: req.params.id });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
