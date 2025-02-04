const express = require("express");
const bodyParser = require("body-parser");
const db = require("../models");

const userRoute = express.Router();

userRoute.post("/create", async (req, res, next) => {
  try {
    const { username, email, password, fullName, phone, address, role } = req.body;
    const newUser = await db.User.create({ username, email, password, fullName, phone, address, role });

    //Insert one
    await newUser.save().then((newDoc) => {
      res.status(201).json({
        message: "User created successfully",
        result: {
          newDoc,
        },
      });
    });
  } catch (err) {
    next(err);
  }
});

module.exports = userRoute;
