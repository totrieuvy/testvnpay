const express = require("express");
const bodyParser = require("body-parser");
const db = require("../models");

const CategoryRouter = express.Router();

CategoryRouter.post("/create", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const newCategory = await db.Category.create({ name, description });

    //Insert one
    await newCategory.save().then((newDoc) => {
      res.status(201).json({
        message: "Category created successfully",
        result: {
          categoryCode: newDoc._id,
          desc: newDoc.description,
        },
      });
    });
  } catch (err) {
    next(err);
  }
});

module.exports = CategoryRouter;
