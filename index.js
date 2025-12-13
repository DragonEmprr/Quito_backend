import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import SibApiV3Sdk from "sib-api-v3-sdk";

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

    if (
      !customer_details?.name ||
      !customer_details?.address ||
      !customer_details?.phone ||
      !customer_details?.email
    ) {
      return res.status(400).json({ message: "Missing customer details" });
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 🔑 Brevo setup
    const client = SibApiV3Sdk.ApiClient.instance;
    client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const orderItemsHtml = cart
      .map(
        (item, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${item.id}</td>
            <td>${item.color}</td>
            <td>${item.size}</td>
            <td>${item.quantity}</td>
          </tr>
        `
      )
      .join("");

    const emailData = {
      sender: { name: "Quito", email: process.env.BREVO_API_EMAIL },
      to: [{ email: customer_details.email, name: customer_details.name }],
      subject: "Order Confirmed - Factory Store",
      htmlContent: `
        <h2>Hi ${customer_details.name},</h2>
        <p>Your order has been placed successfully.</p>

        <p><b>Payment Method:</b> ${payment_method}</p>

        <h3>Delivery Details</h3>
        <p>
          ${customer_details.address}<br/>
          Phone: ${customer_details.phone}
        </p>

        <h3>Order Items</h3>
        <table border="1" cellpadding="8">
          <tr>
            <th>#</th>
            <th>Product ID</th>
            <th>Color</th>
            <th>Size</th>
            <th>Qty</th>
          </tr>
          ${orderItemsHtml}
        </table>

        <p>Thank you for shopping with us.</p>
      `,
    };

    await apiInstance.sendTransacEmail(emailData);

    res.json({ message: "Order confirmed & email sent" });
  } catch (err) {
    console.error("Order confirmation error:", err);
    res.status(500).json({ message: "Email sending failed" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));