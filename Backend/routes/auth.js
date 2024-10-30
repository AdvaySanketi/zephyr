const express = require("express");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var fetchUser = require("../middleware/fetchuser");
const router = express.Router();

const { body, validationResult } = require("express-validator");

// Route 1: Create a user using POST, no login required
router.post(
  "/createuser",
  [
    body(
      "username",
      "Enter a valid username (The username should be at least 3 characters long)"
    ).isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "The password should be 5 characters long").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      db.query(
        "SELECT * FROM users WHERE name = ?",
        [req.body.username],
        async (err, result) => {
          if (result.length > 0) {
            return res.status(400).json({
              error:
                "Username is already taken. Please try again with a different username",
            });
          }

          db.query(
            "SELECT * FROM users WHERE email = ?",
            [req.body.email],
            async (err, result) => {
              if (result.length > 0) {
                return res.status(400).json({
                  error:
                    "User with given email already exists. Please try again with another email",
                });
              }

              let password = req.body.password.trim();
              if (password.length < 5) {
                return res
                  .status(400)
                  .json({ error: "Please enter a valid password" });
              }

              const salt = await bcrypt.genSalt();
              let securePass = await bcrypt.hash(password, salt);

              db.query(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                [req.body.username.trim(), req.body.email, securePass],
                (err, result) => {
                  if (err) throw err;

                  const userId = result.insertId;
                  const data = {
                    user: {
                      id: userId,
                    },
                  };
                  const authToken = jwt.sign(data, "zephyr");
                  success = true;
                  res.json({ success, authToken });
                }
              );
            }
          );
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred");
    }
  }
);

// Route 2: Authenticate a user using POST, no login required
router.post(
  "/login",
  [
    body("username", "Enter a valid username").isLength({ min: 3 }),
    body("password", "The password should be 5 characters long").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      db.query(
        "SELECT * FROM users WHERE name = ?",
        [username],
        async (err, result) => {
          if (result.length === 0) {
            return res
              .status(400)
              .json({ error: "Please try again with valid credentials." });
          }

          const user = result[0];
          const passCompare = await bcrypt.compare(password, user.password);
          if (!passCompare) {
            success = false;
            return res.status(400).json({
              success,
              error: "The Password entered is incorrect. Please try again.",
            });
          }

          const data = {
            user: {
              id: user.id,
            },
          };
          const authToken = jwt.sign(data, "zephyr");
          success = true;
          res.json({ success, authToken });
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred");
    }
  }
);

// Route 3: Get logged-in user details, user needs to be logged in
router.get("/getuser", fetchUser, async (req, res) => {
  try {
    let userId = req.user.id;

    db.query(
      "SELECT id, name, email, CAST(cash AS DOUBLE) AS cash FROM users WHERE id = ?",
      [userId],
      (err, result) => {
        if (err) throw err;
        if (result.length === 0) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user: result[0] });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Some error occurred");
  }
});

module.exports = router;
