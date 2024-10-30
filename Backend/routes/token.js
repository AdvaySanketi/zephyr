const express = require("express");
var fetchUser = require("../middleware/fetchuser");
const router = express.Router();

const { body, validationResult } = require("express-validator");

// Route 1: (Post) Buying the stock
router.post(
  "/buy",
  fetchUser,
  [
    body("symbol", "Enter a symbol").exists(),
    body("name", "Enter name").exists(),
    body("token_id", "Enter token_id").exists(),
    body("quantity", "Enter quantity").exists(),
    body("price", "Enter price").exists(),
    body("image_url", "image url is required").exists(),
  ],
  async (req, res) => {
    try {
      const { symbol, token_id, name, quantity, price, image_url } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;

      db.query(
        "SELECT cash FROM users WHERE id = ?",
        [userId],
        (err, fetchedUser) => {
          if (err) {
            console.error(err.message);
            return res.status(500).send("Error fetching user cash");
          }

          if (fetchedUser.length === 0) {
            return res.status(404).json({ error: "User not found" });
          }

          const availableCash = fetchedUser[0].cash;
          const totalValue = parseFloat(quantity) * parseFloat(price);

          if (totalValue > availableCash) {
            return res.status(400).json({
              success: false,
              error: "You do not have enough balance",
            });
          }

          db.query(
            "SELECT * FROM active WHERE user_id = ? AND token_id = ?",
            [userId, token_id],
            (err, activeSymbol) => {
              if (err) {
                console.error(err.message);
                return res.status(500).send("Error checking active symbols");
              }

              if (activeSymbol.length > 0) {
                db.query(
                  "UPDATE active SET quantity = quantity + ? WHERE user = ? AND token_id = ?",
                  [quantity, userId, token_id],
                  (err) => {
                    if (err) {
                      console.error(err.message);
                      return res
                        .status(500)
                        .send("Error updating active tokens");
                    }
                  }
                );
              } else {
                db.query(
                  "INSERT INTO active (user_id, symbol, name, token_id, quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)",
                  [userId, symbol, name, token_id, quantity, image_url],
                  (err) => {
                    if (err) {
                      console.error(err.message);
                      return res
                        .status(500)
                        .send("Error inserting active token");
                    }
                  }
                );
              }

              db.query(
                "INSERT INTO transactions (user_id, symbol, name, token_id, quantity, price, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [userId, symbol, name, token_id, quantity, price, image_url],
                (err) => {
                  if (err) {
                    console.error(err.message);
                    return res.status(500).send("Error inserting transaction");
                  }

                  res.json({
                    success: true,
                    details: { name, quantity, price, totalValue },
                  });
                }
              );
            }
          );
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred while buying the token");
    }
  }
);

// Route 2: (Post) Selling the stock
router.post(
  "/sell",
  fetchUser,
  [
    body("symbol", "Enter a symbol").exists(),
    body("name", "Enter name").exists(),
    body("token_id", "Enter token ID").exists(),
    body("quantity", "Enter quantity").exists(),
    body("price", "Enter price").exists(),
  ],
  async (req, res) => {
    try {
      const { symbol, name, token_id, quantity, price, image_url } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;

      db.query(
        "SELECT quantity FROM active WHERE user_id = ? AND token_id = ?",
        [userId, token_id],
        (err, active) => {
          if (err) {
            console.error(err.message);
            return res
              .status(500)
              .send("Some error occurred while fetching active stock.");
          }

          if (active.length === 0) {
            return res
              .status(404)
              .json({ success: false, error: "No stock to sell" });
          }

          const userQuantity = active[0].quantity;
          if (userQuantity < parseFloat(quantity)) {
            return res
              .status(400)
              .json({ success: false, error: "Insufficient quantity to sell" });
          }

          const newQuantity = userQuantity - parseFloat(quantity);

          if (newQuantity === 0) {
            db.query("DELETE FROM active WHERE user_id = ? AND token_id = ?", [
              userId,
              token_id,
            ]);
          } else {
            db.query(
              "UPDATE active SET quantity = ? WHERE user_id = ? AND token_id = ?",
              [newQuantity, userId, token_id]
            );
          }

          db.query(
            "INSERT INTO transactions (user_id, symbol, name, token_id, quantity, price, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [userId, symbol, name, token_id, -1 * quantity, price, image_url],
            (err) => {
              if (err) {
                console.error(err.message);
                return res
                  .status(500)
                  .send("Some error occurred while recording the transaction.");
              }

              const totalValue = parseFloat(quantity) * parseFloat(price);

              res.json({
                success: true,
                details: { name, quantity, price, totalValue },
              });
            }
          );
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred while selling the token.");
    }
  }
);

// Route 3: (Post) Watchlisting the stock. Pass token_id as symbol
router.post(
  "/watchlist",
  fetchUser,
  [body("symbol", "Enter a symbol").exists()],
  async (req, res) => {
    try {
      const { symbol } = req.body;
      const userId = req.user.id;

      db.query(
        "SELECT watchlist FROM users WHERE id = ?",
        [userId],
        (err, userObj) => {
          if (err) {
            console.error(err.message);
            return res
              .status(500)
              .send("Some error occurred while fetching the user.");
          }

          if (userObj.length === 0) {
            return res.status(404).json({ message: "User not found." });
          }

          let watchlisted = false;
          let message = "";

          let watchlist = userObj[0].watchlist;

          if (!watchlist) {
            watchlist = [];
          }

          if (watchlist.includes(symbol)) {
            watchlist = watchlist.filter((item) => item !== symbol);
            db.query(
              "UPDATE users SET watchlist = ? WHERE id = ?",
              [JSON.stringify(watchlist), userId],
              (updateErr) => {
                if (updateErr) {
                  console.error(updateErr.message);
                  return res
                    .status(500)
                    .send("Some error occurred while updating the watchlist.");
                }
                watchlisted = false;
                message = "Token removed from the watchlist.";
                res.json({ watchlisted, message });
              }
            );
          } else {
            db.query(
              "UPDATE users SET watchlist = JSON_ARRAY_APPEND(COALESCE(watchlist, JSON_ARRAY()), '$', ?) WHERE id = ?",
              [symbol, userId],
              (updateErr) => {
                if (updateErr) {
                  console.error(updateErr.message);
                  return res
                    .status(500)
                    .send("Some error occurred while updating the watchlist.");
                }
                watchlisted = true;
                message = "Token added to the watchlist.";
                res.json({ watchlisted, message });
              }
            );
          }
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occurred while watchlisting the token.");
    }
  }
);

module.exports = router;
