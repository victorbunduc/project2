// Requiring our models and passport as we've configured it
const db = require("../models");
const passport = require("../config/passport");
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: true,
    ciphers: "SSLv3",
  },
});

module.exports = function(app) {
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Sending back a password, even a hashed password, isn't a good idea
    res.json({
      email: req.user.email,
      id: req.user.id,
    });
  });

  // Route for signing up a user. The user's password is automatically hashed and stored securely thanks to
  // how we configured our Sequelize User Model. If the user is created successfully, proceed to log the user in,
  // otherwise send back an error
  app.post("/api/signup", (req, res) => {
    db.User.create({
      email: req.body.email,
      password: req.body.password,
    })
      .then(() => {
        res.redirect(307, "/api/login");
      })
      .catch((err) => {
        res.status(401).json(err);
      });
  });

  // Route for logging user out
  app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", (req, res) => {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.email,
        id: req.user.id,
      });
    }
  });

  // ========== NODEMAILER ========== //

  // verify connection configuration
  transporter.verify(function(error, success) {
    if (success) {
      console.log("verification success");
    } else {
      console.log("error", error);
    }
  });

  

  app.post("/api/mailer", (req, res) => {
    console.log("******", req.body);
    const mailOptions = {
      from: req.body.email,
      to: "codebasicsonlineportal@gmail.com",
      subject: "Welcome to CODEBASICS",
      text: req.body.message,
    };
    
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.log("Error has occured");
      } else {
        console.log("Email Sent");
      }
    });

    res.json({
      success: true
    });
  });
  // ========== END NODEMAILER ========== //
};
