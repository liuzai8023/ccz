const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const history = require("connect-history-api-fallback");
require("express-async-errors");
const { mobileRouter } = require("./routes/mobileRouter");
const { mysqlConfig, appConfig, Bark_Device_Key } = require("./config");
const { pcRouter } = require("./routes/pcRouter");
const { utilRouter } = require("./routes/utilRouter");
const fs = require("fs");
const fetch = require("node-fetch").default;
const compression = require("compression");

var pool = null;

app.use(express.json());
app.use(compression());

app.get("/pre-stop", async (req, res) => {
  await pool.end();
  res.send("pre-stop").end();
});
app.post("/initialize", async (req, res) => {
  pool = mysql.createPool(mysqlConfig);
  fs.writeFileSync("./error.log", "");
  res.send("initialize").end();
});
app.get("/error-log", async (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.end(fs.readFileSync("./error.log").toString());
});
app.get("/error-log/clear", async (req, res) => {
  fs.writeFileSync("./error.log", "");
  res.status(200).end();
});
app.get("/make-error", async (req, res) => {
  throw new Error("make-error");
});

app.use(cors());
app.use((req, res, next) => {
  if (!pool) pool = mysql.createPool(mysqlConfig);
  req.pool = pool;
  next();
});
app.use("/api/mobile", mobileRouter);
app.use("/api/pc", pcRouter);
app.use("/api/util", utilRouter);
app.use(async (err, req, res, next) => {
  console.error(err);
  if (Bark_Device_Key && process.env.NODE_ENV === "production") {
    await fetch("https://api.day.app/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: err.stack,
        title: "stust-server-error",
        device_key: Bark_Device_Key,
        level: "passive",
      }),
    })
      .catch(console.error)
      .then((res) => res.text())
      .catch(console.error)
      .then(console.log);
  }
  try {
    fs.appendFileSync(
      "./error.log",
      `${new Date().toLocaleString()}  ${req.url}\n`
    );
    fs.appendFileSync("./error.log", err.stack + "\n");
  } catch (error) {
    console.error("写入错误日志失败" + error);
  }
  res.send({
    code: 500,
    message: "系统异常",
  });
});
app.use(history());
app.use(express.static(path.join(__dirname, "static")));
app.listen(appConfig.port);
