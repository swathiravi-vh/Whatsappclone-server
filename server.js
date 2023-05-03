const express = require("express");
const mongoose = require("mongoose");
const Rooms = require("./dbRooms");
const cors = require("cors");
const Messages = require("./dbMessages");
const Pusher = require("pusher");

const app = express();
const port = process.env.PORT || 5000;

const pusher = new Pusher({
  appId: "1594267",
  key: "bc718ae56495b3e0f019",
  secret: "8ffd1fb611f4e5ed8542",
  cluster: "ap2",
  useTLS: true,
});

app.use(cors());
app.use(express.json());

const dbUrl =
  "mongodb+srv://123456:123456-1@cluster0.usjjlsk.mongodb.net/whatsappclone?retryWrites=true&w=majority";

mongoose.connect(dbUrl);

const db = mongoose.connection;

db.once("open", () => {
  console.log("Db connected");

  const roomCollection = db.collection("rooms");
  const changeStream = roomCollection.watch();

  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const roomDetails = change.fullDocument;
      pusher.trigger("room", "inserted", roomDetails);
    } else {
      console.log("Not expected event to triger");
    }
  });

  const msgCollection = db.collection("messages");
  const changeStream1 = msgCollection.watch();

  changeStream1.on("change", (change) => {
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", messageDetails);
    } else {
      console.log("Not expected event to triger");
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello from Server");
});

app.get("/room/:id", (req, res) => {
  Rooms.find({ _id: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data[0]);
    }
  });
});

app.get("/messages/:id", (req, res) => {
  Messages.find({ roomId: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(201).send(data);
    }
  });
});

app.post("/group/create", (req, res) => {
  const name = req.body.groupName;
  Rooms.create({ name }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(201).send(data);
    }
  });
});

app.get("/all/rooms", (req, res) => {
  Rooms.find({}, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data);
    }
  });
});

app.listen(port, () => {
  console.log(`listening on localhost:${port}`);
});
