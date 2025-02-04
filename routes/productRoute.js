const express = require("express");
const bodyParser = require("body-parser");
const db = require("../models");

const ProductRouter = express.Router();

ProductRouter.post("/create", async (req, res, next) => {
  try {
    const { name, price, description, unitInStock, category } = req.body;
    console.log(req.body);
    const newProduct = await db.Product.create({ name, price, description, unitInStock, category });

    //Insert one
    await newProduct.save().then((newDoc) => {
      res.status(201).json({
        message: "Product created successfully",
        result: {
          productCode: newDoc._id,
          name: newDoc.name,
          price: newDoc.price,
          description: newDoc.description,
          unitInStock: newDoc.unitInStock,
          category: newDoc.category,
        },
      });
    });
  } catch (err) {
    next(err);
  }
});

ProductRouter.get("/getAll", async (req, res, next) => {
  try {
    const products = await db.Product.find({}).populate("category").exec();

    if (products) {
      return res.status(200).json({
        message: "Products found",
        result: products?.map((p) => ({
          productCode: p._id,
          name: p.name,
          price: p.price,
          description: p.description,
          unitInStock: p.unitInStock,
          category: p.category.name,
        })),
      });
    } else {
      return res.status(404).json({
        message: "Products not found",
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = ProductRouter;
