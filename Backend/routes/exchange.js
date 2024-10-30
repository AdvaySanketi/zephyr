const express = require("express");
const fetch = require("node-fetch2");
var jwt = require("jsonwebtoken");
var fetchUser = require("../middleware/fetchuser");
const router = express.Router();

// Route 1: Get all the tokens from the external API. If loggedIn, get watchlisted tokens.
router.get("/fetchalltokens", async (req, res) => {
  let user = null;
  const token = req.header("auth-token");
  if (token) {
    try {
      const data = jwt.verify(token, "zephyr");
      user = data.user;
    } catch (error) {
      user = null;
    }
  }
  try {
    const { page } = req.query;
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&order=market_cap_desc&per_page=10&page=${page}&sparkline=false`;
    const response = await fetch(url, {
      header: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36",
      },
    });
    const tokens = await response.json();

    if (tokens.status && tokens.status.error_code === 429) {
      res.json({ status: 429, message: "Exceeded the limit" });
    } else {
      if (user) {
        const [rows] = db.query("SELECT watchlist FROM users WHERE id = ?", [
          user.id,
        ]);
        const watchlist = rows[0].watchlist
          ? JSON.parse(rows[0].watchlist)
          : [];
        tokens.forEach((token) => {
          token.iswatchlisted = watchlist.includes(token.id);
        });
      }

      res.json(tokens);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Some error occurred" });
  }
});

// Route 2: Get Watchlisted tokens/coins
router.get("/fetchwatchlisted", fetchUser, async (req, res) => {
  try {
    db.query(
      "SELECT watchlist FROM users WHERE id = ?",
      [req.user.id],
      (err, rows) => {
        if (err) {
          console.error(err.message);
          return res
            .status(500)
            .send("Some error occurred while fetching watchlisted coins");
        }

        if (rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        const watchlist = rows[0].watchlist ? rows[0].watchlist : [];
        res.json(watchlist);
      }
    );
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send("Some error occurred while fetching watchlisted coins");
  }
});

// Route 3: Get specific token details from the external API. If loggedIn, check if watchlisted.
router.get("/fetchtoken/:symbol", async (req, res) => {
  let user = null;
  const token = req.header("auth-token");
  if (token) {
    try {
      const data = jwt.verify(token, "zephyr");
      user = data.user;
    } catch (error) {
      user = null;
    }
  }

  try {
    const symbol = req.params.symbol;
    const url = `https://api.coingecko.com/api/v3/coins/${symbol}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
    const response = await fetch(url);

    if (response.status === 404) {
      const error = await response.json();
      res.status(404).json({ error: error.error });
      return;
    }

    const token = await response.json();

    delete token.asset_platform_id;
    delete token.platforms;
    delete token.detail_platforms;
    delete token.ico_data;
    delete token.public_interest_stats;

    delete token.links.chat_url;
    delete token.links.announcement_url;
    delete token.links.facebook_username;
    delete token.links.repos_url;
    delete token.links.bitcointalk_thread_identifier;

    delete token.market_data.ath;
    delete token.market_data.ath_change_percentage;
    delete token.market_data.ath_date;
    delete token.market_data.atl;
    delete token.market_data.atl_change_percentage;
    delete token.market_data.atl_date;
    delete token.market_data.fully_diluted_valuation;
    delete token.market_data.high_24h;
    delete token.market_data.low_24h;

    for (let currency in token.market_data.current_price) {
      if (!["inr", "usd", "eur", "btc", "eth", "gbp"].includes(currency)) {
        delete token.market_data.current_price[currency];
        delete token.market_data.market_cap[currency];
        delete token.market_data.total_volume[currency];
      }
    }

    if (user) {
      const [rows] = db.query("SELECT watchlist FROM users WHERE id = ?", [
        user.id,
      ]);
      const watchlist = rows[0].watchlist ? JSON.parse(rows[0].watchlist) : [];
      token.iswatchlisted = watchlist.includes(token.id);
    }

    res.status(200).json(token);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Some error occurred" });
  }
});

// Route 4: Get active tokens owned by the user
router.get("/fetchactive", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    db.query(
      `SELECT *, getAverageCost(?, token_id) AS averageCost, 
      (SELECT SUM(quantity * getAverageCost(user_id, token_id)) FROM active WHERE user_id = ?) AS totalInvested
      FROM active 
      WHERE user_id = ? 
      GROUP BY id`,
      [userId, userId, userId],
      async (err, tokens) => {
        if (err) {
          console.error(err.message);
          return res
            .status(500)
            .send("Some error occurred while fetching active tokens");
        }

        if (tokens.length === 0) {
          return res.json({ tokenIds: [], tokens: [] });
        }

        const totalInvested = tokens[0].totalInvested;

        const tokenIds = tokens.map((token) =>
          encodeURIComponent(token.token_id)
        );

        res.json({ tokenIds, tokens, totalInvested });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Some error occurred while fetching active tokens");
  }
});

// Route 5: Get the transaction history of the user
router.get("/fetchtransactions", fetchUser, async (req, res) => {
  try {
    db.query(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY txn_timestamp DESC",
      [req.user.id],
      (err, transactions) => {
        if (err) {
          console.error(err.message);
          return res
            .status(500)
            .send("Some error occurred while fetching transactions");
        }

        res.json(transactions);
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Some error occurred while fetching transactions");
  }
});

// Route 6: Get details of a particular token owned by the user
router.get("/fetchdetails-legacy", fetchUser, async (req, res) => {
  try {
    const { token_id } = req.query;

    db.query(
      "SELECT * FROM active WHERE user_id = ? AND token_id = ?",
      [req.user.id, token_id],
      async (err, activeTokens) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send("Error fetching active tokens");
        }

        db.query(
          "SELECT * FROM transactions WHERE user_id = ? AND token_id = ? ORDER BY txn_timestamp DESC",
          [req.user.id, token_id],
          async (err, transactions) => {
            if (err) {
              console.error(err.message);
              return res.status(500).send("Error fetching transactions");
            }

            if (activeTokens.length > 0) {
              const averageCost = await getAverageCostLegacy(
                req.user.id,
                activeTokens[0].token_id
              );
              activeTokens[0].averageCost = averageCost;
            }

            db.query(
              "SELECT watchlist FROM users WHERE id = ?",
              [req.user.id],
              (err, rows) => {
                if (err) {
                  console.error(err.message);
                  return res.status(500).send("Error fetching watchlist");
                }

                const iswatchlisted = rows[0]?.watchlist
                  ? rows[0].watchlist.includes(token_id)
                  : false;

                res.json({ activeTokens, transactions, iswatchlisted });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Some error occurred while fetching token details");
  }
});

// Route 6.2: Get details of a particular token owned by the user
router.get("/fetchdetails", fetchUser, async (req, res) => {
  try {
    const { token_id } = req.query;

    db.query(
      `SELECT a.*, t.*, getAverageCost(a.user_id, a.token_id) AS averageCost FROM active a JOIN transactions t ON a.user_id = t.user_id AND a.token_id = t.token_id WHERE a.user_id = ? AND a.token_id = ?`,
      [req.user.id, token_id],
      async (err, result) => {
        if (err) {
          console.error(err.message);
          return res
            .status(500)
            .send("Error fetching active tokens and transactions");
        }

        db.query(
          "SELECT watchlist FROM users WHERE id = ?",
          [req.user.id],
          (err, rows) => {
            if (err) {
              console.error(err.message);
              return res.status(500).send("Error fetching watchlist");
            }

            const iswatchlisted = rows[0]?.watchlist
              ? rows[0].watchlist.includes(token_id)
              : false;

            res.json({ result, iswatchlisted });
          }
        );
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Some error occurred while fetching token details");
  }
});

const getAverageCostLegacy = async (user_id, token_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM transactions WHERE user_id = ? AND token_id = ?",
      [user_id, token_id],
      (err, transactions) => {
        if (err) {
          console.error(err.message);
          return reject("Error fetching transactions");
        }

        let quantitySum = 0;
        let priceSum = 0;

        transactions.forEach((transaction) => {
          quantitySum += transaction.quantity;
          priceSum += transaction.price * transaction.quantity;
        });

        const averageCost = quantitySum > 0 ? priceSum / quantitySum : 0;
        resolve(averageCost);
      }
    );
  });
};

module.exports = router;
