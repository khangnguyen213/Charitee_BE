const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const port = process.env.PORT || 5000;
const mongodbURL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.btdla2l.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const Cause = require("./model/cause");
const Donation = require("./model/donation");
const Account = require("./model/account");

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res, next) => {
  console.log("Connected");
});

app.post("/cause/add-cause", (req, res, next) => {
  Cause.findOne({ title: req.body.title }).then((data) => {
    if (!data) {
      const cause = new Cause({
        title: req.body.title,
        description: req.body.description,
        goal: req.body.goal,
        raised: req.body.raised,
        deadline: new Date(req.body.deadline),
        image: req.body.image,
      });
      cause
        .save()
        .then((cause) => {
          if (cause) {
            console.log("New cause created");
            res.sendStatus(201);
          }
        })
        .catch((err) => res.sendStatus(500));
    } else {
      res.statusCode = 402;
      res.statusMessage =
        "The cause's title already exist - which may confuse donors";
      return res.end();
    }
  });
});

app.post("/account/add-account", (req, res, next) => {
  Account.findOne({ email: req.body.email }).then((data) => {
    if (!data) {
      const account = new Account({
        ...req.body,
        password: bcrypt.hashSync(req.body.password, 12),
      });
      account
        .save()
        .then((account) => {
          if (account) {
            console.log("New account created");
            res.sendStatus(201);
          }
        })
        .catch((err) => res.sendStatus(500));
    } else {
      res.statusCode = 402;
      res.statusMessage = "This email already existed";
      return res.end();
    }
  });
});

app.post("/donation/add-donation", (req, res, next) => {
  const donation = new Donation({
    cause: req.body.cause,
    account: req.body.account,
    amount: req.body.amount,
  });
  donation
    .save()
    .then((donation) => {
      if (donation) {
        console.log("New donation created");
        res.sendStatus(201);
      }
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.get("/donation/detail/:donationID", (req, res, next) => {
  Donation.findById(req.params.donationID)
    .populate(["account", "cause"])
    .then((data) => {
      if (data) {
        return res.sendStatus(200).json(data);
      } else {
        return res.sendStatus(404);
      }
    })
    .catch((err) => res.sendStatus(404));
});

mongoose
  .connect(mongodbURL)
  .then((result) => {
    app.listen(port);
  })
  .catch((err) => {
    console.log(err);
  });
