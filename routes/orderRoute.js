const express = require("express");
const bodyParser = require("body-parser");
const db = require("../models");
const crypto = require("crypto"); // Required for VNPay signature generation

const OrderRouter = express.Router();

// VNPay Configuration
const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"; // VNPay sandbox URL
const vnpTmnCode = "9TKDVWYK"; // Your Merchant ID from VNPay
const vnpHashSecret = "LH6SD44ECTBWU1PHK3D2YCOI5HLUWGPH"; // Your Hash Secret from VNPay

OrderRouter.post("/create", async (req, res, next) => {
  try {
    const { user, items } = req.body;

    // Check if request has necessary fields
    if (!user || !items || items.length === 0) {
      return res.status(400).json({ message: "An order must contain at least one product." });
    }

    let totalAmount = 0;
    const updatedProducts = [];

    // Check product availability
    for (const item of items) {
      const product = await db.Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.product} not found.` });
      }

      if (product.unitInStock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}. Available: ${product.unitInStock}, Requested: ${item.quantity}`,
        });
      }

      // Calculate total order amount
      totalAmount += item.quantity * product.price;

      // Reduce stock
      product.unitInStock -= item.quantity;
      updatedProducts.push(product);
    }

    // Save updated stock quantities
    for (const product of updatedProducts) {
      await product.save();
    }

    // Create order
    const newOrder = new db.Order({
      user,
      items,
      totalAmount,
      status: "Pending",
    });

    await newOrder.save();

    // Prepare VNPay payment parameters
    const vnpParams = {
      vnp_Version: "2.0.0",
      vnp_TmnCode: vnpTmnCode,
      vnp_Amount: totalAmount * 100, // Amount in the smallest unit (VND is in "dong")
      vnp_OrderInfo: `Order #${newOrder._id}`,
      vnp_OrderType: "billpayment",
      vnp_TxnRef: newOrder._id.toString(),
      vnp_ReturnUrl: "http://localhost:5000/payment/return", // Replace with your return URL
      vnp_IpAddr: req.ip,
      vnp_CreateDate: new Date().toISOString().replace(/T/, " ").replace(/\..+/, ""),
    };

    // Generate the secure hash
    const queryString = Object.keys(vnpParams)
      .sort()
      .map((key) => {
        return key + "=" + encodeURIComponent(vnpParams[key]);
      })
      .join("&");

    const signData =
      queryString +
      `&vnp_SecureHashType=SHA256&vnp_SecureHash=${crypto
        .createHmac("sha256", vnpHashSecret)
        .update(queryString)
        .digest("hex")}`;

    // Send request to VNPay to get payment link
    const paymentUrl = `${vnpUrl}?${signData}`;

    // Respond to user with the payment URL
    res.status(201).json({
      message: "Order created successfully. Please complete the payment.",
      order: newOrder,
      paymentUrl: paymentUrl,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

module.exports = OrderRouter;
