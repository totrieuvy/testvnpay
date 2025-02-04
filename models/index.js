const mongoose = require("mongoose");

const User = require("./Users.model");
const Category = require("./Categories.model");
const Product = require("./Products.model");
const Order = require("./Order.model");

const db = {};

db.User = User;
db.Category = Category;
db.Product = Product;
db.Order = Order;

db.connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI).then(() => {
      console.log("Database connection successful!!!");
    });
  } catch (error) {
    next(error);
    process.exit();
  }
};

module.exports = db;
