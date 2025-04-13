import { query } from "../db/db.js";

export const getShopBalanceSheet = async (req, res) => {
  const { shop_id, date1, date2 } = req.query;

  console.log(shop_id, date1, date2)

  try {
      let queryStr = `SELECT * FROM balance_sheets WHERE 1=1`; // Always true to dynamically add conditions
      let queryParams = [];

      // Filter by shop_id if provided, otherwise show 'all'
      if (shop_id) {
          queryStr += ` AND type = $1`;
          queryParams.push(shop_id);
      } else {
          queryStr += ` AND type = 'all'`;
      }

      // Filter by date range if provided
      if (date1 && date2) {
          queryStr += ` AND date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
          queryParams.push(date1, date2);
      }

      // Order by date and id
      queryStr += ` ORDER BY date, id`;

      // Get transactions
      const result = await query(queryStr, queryParams);

      // Get current balance (latest entry)
      const balanceQuery = `SELECT balance FROM balance_sheets WHERE type = $1 ORDER BY date DESC, id DESC LIMIT 1`;
      const currentBalance = await query(balanceQuery, [shop_id || "all"]);

      res.json({
          message: "Shop balance retrieved successfully",
          transactions: result.rows,
          currentBalance: currentBalance.rows[0]?.balance || 0
      });

  } catch (error) {
      res.status(500).json({ error: error.message });
      console.log("Error in getShopBalance:", error);
  }
};


export const getWarehouseBalanceSheet = async (req, res) => {
  const { warehouse_name, date1, date2 } = req.query;
  console.log(warehouse_name, date1, date2)

  try {
      let queryStr = `SELECT * FROM warehouse_balance_sheets WHERE 1=1`; // Always true to dynamically add conditions
      let queryParams = [];

      // Filter by warehouse_name if provided, otherwise show 'all'
      if (warehouse_name) {
          queryStr += ` AND type = $1`;
          queryParams.push(warehouse_name);
      } else {
          queryStr += ` AND type = 'all'`;
      }

      // Filter by date range if provided
      if (date1 && date2) {
          queryStr += ` AND date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
          queryParams.push(date1, date2);
      }

      // Order by date and id
      queryStr += ` ORDER BY date, id`;

      // Get transactions
      const result = await query(queryStr, queryParams);

      // Get current balance (latest entry)
      const balanceQuery = `SELECT balance FROM warehouse_balance_sheets WHERE type = $1 ORDER BY date DESC, id DESC LIMIT 1`;
      const currentBalance = await query(balanceQuery, [warehouse_name || "all"]);

      res.json({
          message: "Warehouse balance retrieved successfully",
          transactions: result.rows,
          currentBalance: currentBalance.rows[0]?.balance || 0
      });

  } catch (error) {
      res.status(500).json({ error: error.message });
      console.log("Error in getWarehouseBalanceSheet:", error);
  }
};