const express = require("express");
const bodyParser = require("body-parser");
const db = require("../models");
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require("vnpay");

const OrderRouter = express.Router();

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

    const vnpay = new VNPay({
      tmnCode: "9TKDVWYK",
      secureSecret: "LH6SD44ECTBWU1PHK3D2YCOI5HLUWGPH",
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true, // tùy chọn
      hashAlgorithm: "SHA512", // tùy chọn
      enableLog: true, // tùy chọn
      loggerFn: ignoreLogger, // tùy chọn
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const vnpayResponse = await vnpay.createPayment({
      vnpAmount: newOrder.totalAmount,
      vnp_IpAddr: "127.0.0.1",
      vnp_TxnRef: newOrder._id,
      vnp_OrderInfo: `${newOrder._id}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: "https://www.youtube.com/watch?v=XdO7YQchnlI",
      vnp_Locale: VnpLocale.VN,
      vnp_CreatedDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    await newOrder.save();

    res.status(201).json({ message: "Order created successfully.", vnpay_url: vnpayResponse });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

module.exports = OrderRouter;
