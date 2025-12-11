import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// CONNECT TO MONGO ATLAS
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "all_data",   // your database name
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// CATEGORY SCHEMA (matching your JSON schema)
const CategorySchema = new mongoose.Schema(
  {
    _id: {
      $oid: { type: String, match: /^[0-9a-fA-F]{24}$/ },
    },
    id: Number,
    img: String,
    name: String,
  },
  { collection: "category_data" }
);

const ProductSchema = new mongoose.Schema(
  {
    _id: {
      $oid: { type: String, match: /^[0-9a-fA-F]{24}$/ },
    },
    id: Number,
    name: String,
    category: Number,
    img: String,
    description: String,
    price: String,
    colors: Object,
    sizes: [String],
  },
  { collection: "products" }
);

const Product = mongoose.model("Product", ProductSchema);
const Category = mongoose.model("Category", CategorySchema);

// ROUTE: GET ALL CATEGORIES
app.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Error fetching categories" });
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Error fetching products" });
  }
})

app.get("/product/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));