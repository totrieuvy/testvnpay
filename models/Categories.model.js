const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: { type: String, required: [true, "Category name is required"] },
  description: { type: String },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
