import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fetch from "node-fetch";
import { Location } from "../model";
import { isLocationValid } from "./utils";
import {
  saveLocation,
  getUnhandledLocationNumber,
  getEveryKindowmEarlestUnhandledLocation,
  getLocationHistory,
  setLocationHandled,
} from "../db";

const app = express();
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);
app.use(cors());

const port = 3019;

let open = true;
const kindomFailCountsMap = new Map();

function addKindomFailCounts(kindom: string) {
  const failCounts = kindomFailCountsMap.get(kindom);
  kindomFailCountsMap.set(kindom, (failCounts ? failCounts : 0) + 1);
}
function resetKindomFailCounts(kindom: string) {
  kindomFailCountsMap.set(kindom, 0);
}

async function setAddress(req, res, next) {
  const ip = req.headers["x-real-ip"];
  console.log("ip:", ip);
  const url = `https://qifu-api.baidubce.com/ip/geo/v1/district?ip=${ip}`;
  try {
    const address = await fetch(url)
      .then((response) => response.json())
      .then((json) => {
        const data = json.data;
        console.log("ip resolved data:", data);
        return `${data.prov}${data.city}${data.district}`;
      });
    req.rok_address = address;
  } catch (error) {
    console.log("ip error:", error);
    req.rok_address = "未知";
  }
  next();
}

app.post("/api/ask", setAddress, (req, res) => {
  const location: Location = req.body;
  const valid = isLocationValid(location);
  if (!valid) {
    res.status(400).send("密码错误");
    return;
  }
  const unhandledLocationNumber = getUnhandledLocationNumber(location.kindom);
  saveLocation({ ...location, address: req.rok_address });
  res
    .status(200)
    .send(`请求已收到，前方还有${unhandledLocationNumber}个请求排队中`);
});

app.get("/api/getLocations", (req, res) => {
  res.status(200).send(getEveryKindowmEarlestUnhandledLocation());
});

app.get("/api/history", (req, res) => {
  const length = req.query.page_size || 5;
  const list = getLocationHistory(Number(length));
  res.status(200).send(list);
});

app.get("/api/queue", (req, res) => {
  const kindom = req.query.kindom;
  const unhandledLocationNumber = getUnhandledLocationNumber(kindom);
  res.status(200).send(`有${unhandledLocationNumber}个请求排队中`);
});

app.get("/api/failCounts", (req, res) => {
  const kindom = req.query.kindom;
  const failCounts = kindomFailCountsMap.get(kindom) || 0;
  res.status(200).send(failCounts);
});

app.post("/api/updateLocation", (req, res) => {
  const location: Location = req.body;
  if (location.failed) {
    addKindomFailCounts(location.kindom);
  } else {
    resetKindomFailCounts(location.kindom);
  }
  setLocationHandled(location);
  res.status(200).send("true");
});

/**
 * 小程序setting
 */
const adminPass = "333";
app.post("/api/open", (req, res) => {
  const pass = req.body.password;
  if (pass === adminPass) {
    open = true;
    res.send({ msg: `小程序已打开` });
    return;
  }
  res.send({ msg: `密码错误` });
});

app.post("/api/close", (req, res) => {
  const pass = req.body.password;
  if (pass === adminPass) {
    open = false;
    res.send({ msg: `小程序已关闭` });
    return;
  }
  res.send({ msg: `密码错误` });
});

app.get("/api/status", (req, res) => {
  res.send({ status: open });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
