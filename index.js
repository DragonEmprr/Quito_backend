import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());




mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "all_data",   // your database name
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

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

app.post("/order_confirmation", async (req, res) => {
  try {
    const { customer_details, cart, payment_method } = req.body;

    // 🛑 Validate customer details
    if (
      !customer_details ||
      !customer_details.name ||
      !customer_details.address ||
      !customer_details.phone ||
      !customer_details.email
    ) {
      return res.status(400).json({
        message: "All customer details are required",
      });
    }

    console.log("yu");
    
    // 🛑 Validate cart
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }
    console.log("yu");
    
    // 📧 Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    console.log("yu");
    
    // 🧾 Build order table
    const orderItemsHtml = cart
    .map(
      (item, index) => `
          <tr>
          <td>${index + 1}</td>
          <td>${item.id}</td>
          <td>${item.color}</td>
          <td>${item.size}</td>
          <td>${item.quantity}</td>
          </tr>
          `
        )
        .join("");
        
    console.log("yu");
    
    // ✉️ Email
    const mailOptions = {
      from: `"Factory Store" <${process.env.GMAIL_USER}>`,
      to: customer_details.email,
      subject: "Order Confirmation – Factory Store",
      html: `
        <h2>Thank you for your order, ${customer_details.name}!</h2>

        <p><b>Payment Method:</b> ${payment_method}</p>

        <h3>Delivery Details</h3>
        <p>
          <b>Address:</b> ${customer_details.address}<br/>
          <b>Phone:</b> ${customer_details.phone}<br/>
          <b>Email:</b> ${customer_details.email}
        </p>

        <h3>Order Items</h3>
        <table border="1" cellpadding="8" cellspacing="0">
          <tr>
            <th>#</th>
            <th>Product ID</th>
            <th>Color</th>
            <th>Size</th>
            <th>Quantity</th>
          </tr>
          ${orderItemsHtml}
        </table>

        <p>Your order has been placed successfully and will be processed soon.</p>
        <p><b>Factory Store</b></p>
      `,
    };

    console.log("yu");

    // 🚀 Send email
    await transporter.sendMail(mailOptions);

    console.log("yu");

    res.status(200).json({
      message: "Order confirmed and confirmation email sent",
    });
  } catch (error) {
    console.error("Order confirmation error:", error);
    res.status(500).json({
      message: "Failed to confirm order",
    });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));