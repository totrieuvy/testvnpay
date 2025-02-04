var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();

const db = require("./models");
db.connectDb().catch(console.error);

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const productRouter = require("./routes/productRoute");
const categoryRouter = require("./routes/categoryRoute");
const userRouter = require("./routes/userRoute");
const orderRouter = require("./routes/orderRoute");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/product", productRouter);
app.use("/category", categoryRouter);
app.use("/user", userRouter);
app.use("/order", orderRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

const HOST_NAME = process.env.HOST_NAME;
const PORT = process.env.PORT;

app.listen(PORT, HOST_NAME, () => {
  console.log(`Server is running on http://${HOST_NAME}:${PORT}`);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
