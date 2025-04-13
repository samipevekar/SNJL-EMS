import { query } from "../db/db.js";

export const createShop = async (req, res) => {
  const {
    shop_id,
    shop_name,
    mgq,
    liquor_type,
    mgq_q1,
    mgq_q2,
    mgq_q3,
    mgq_q4,
  } = req.body;

  try {
    // check if shop_id is unique
    const checkUniqueShopId = await query(
      `SELECT shop_id FROM shops WHERE shop_id = $1`,
      [shop_id]
    );

    if (checkUniqueShopId.rowCount > 0) {
      return res.status(400).json({ message: "shop_id already exists." });
    }

    // Ensure all mgq values are numbers (default to 0 if undefined)
    const q1 = mgq_q1 || 0;
    const q2 = mgq_q2 || 0;
    const q3 = mgq_q3 || 0;
    const q4 = mgq_q4 || 0;

    // Validation
    if (liquor_type === "foreign" && (!mgq_q1 || !mgq_q2 || !mgq_q3 || !mgq_q4)) {
      return res.status(400).json({ message: "Enter all mgq values for foreign liquor" });
    }

    if (liquor_type === "country" && !mgq) {
      return res.status(400).json({ message: "Enter mgq for country liquor" });
    }

    // Calculate mgq based on liquor type
    let final_mgq = liquor_type === "country" ? mgq : { q1, q2, q3, q4 };
    let yearly_mgq = liquor_type === "country" ? Math.round(mgq / 9) : 0;
    let monthly_mgq = liquor_type === "country" ? Math.round(mgq / 9 / 12) : 0;

    // Insert shop data
    const shop = await query(
      `
      INSERT INTO shops (shop_id, shop_name, mgq, yearly_mgq, monthly_mgq, liquor_type,mgq_q1,mgq_q2,mgq_q3,mgq_q4)
      VALUES ($1, $2, $3, $4, $5, $6,$7,$8,$9,$10) RETURNING *;
      `,
      [shop_id, shop_name, final_mgq, yearly_mgq, monthly_mgq, liquor_type,mgq_q1,mgq_q2,mgq_q3,mgq_q4]
    );

    res.status(200).json(shop.rows[0]);
  } catch (error) {
    console.error("Error in createShop controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// delete shop
export const deleteShop = async (req, res) => {
  const { id } = req.params;
  try {
    const shop = await query(
      `
            SELECT * FROM shops 
            WHERE id = $1
            `,
      [id]
    );

    if (shop.rowCount === 0) {
      return res.status(404).json({ message: "Shop not found." });
    }

    await query(
      `
            DELETE FROM shops
            WHERE id = $1
            `,
      [id]
    );

    res.status(200).json({ message: "Shop Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in deleteShop controller", error);
  }
};

// get sale_sheets of a shop
export const getAllShops = async (req, res) => {
  try {
    const shops = await query(
      `
            SELECT * FROM shops
            `
    );

    if (shops.rowCount === 0) {
      return res.status(404).json({ message: "No shop registered" });
    }

    res.status(200).json(shops.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in getAllShops controller", error);
  }
};

// get all expenses of a shop
export const getAllExpensesOfShop = async (req, res) => {
  const { shop_id } = req.params;
  const { sale_date } = req.query;

  try {
    // Check if the shop exists
    const shop = await query(`SELECT * FROM shops WHERE shop_id = $1`, [shop_id]);

    if (shop.rowCount === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    let expenses;

    if (sale_date) {
      // Fetch expenses for specific shop_id and sale_date
      expenses = await query(
        `SELECT expenses, sale_date FROM sale_sheets WHERE shop_id = $1 AND sale_date = $2`,
        [shop_id, sale_date]
      );
    } else {
      // Fetch all expenses for the shop_id ordered by date (newest first)
      expenses = await query(
        `SELECT expenses, sale_date FROM sale_sheets WHERE shop_id = $1 ORDER BY sale_date DESC`,
        [shop_id]
      );
    }

    let totalExpense = 0;
    let latestTotalExpense = 0;

    // Map expenses with their corresponding date
    const mappedExpenses = expenses.rows.map((row, index) => {
      let subtotal = 0;
      if (row.expenses && row.expenses.length > 0) {
        row.expenses.forEach(exp => {
          totalExpense += exp.amount || 0;
          subtotal += exp.amount || 0;
        });
      }

      // Set latestTotalExpense for the first row (latest)
      if (index === 0) {
        latestTotalExpense = subtotal;
      }

      // Format date as DD-MM-YYYY
      const dateObj = new Date(row.sale_date);
      const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;

      return {
        sale_date: formattedDate,
        expenses: row.expenses || []
      };
    });

    res.status(200).json({
      totalExpense,
      latestTotalExpense,
      expenses: mappedExpenses
    });

  } catch (error) {
    console.error("Error in getAllExpensesOfShop:", error.message);
    res.status(500).json({ error: error.message });
  }
};





// get latest sale sheet for a specific shop
export const getLatestSaleSheet = async (req, res) => {
  const { shop_id } = req.params;

  try {
    // Check if the shop exists
    const shop = await query(`SELECT * FROM shops WHERE shop_id = $1`, [
      shop_id,
    ]);

    if (shop.rowCount === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Fetch the latest sale sheet for the given shop_id (ordered by sale_date descending)
    const latestSaleSheet = await query(
      `SELECT * FROM sale_sheets WHERE shop_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [shop_id]
    );

    if (latestSaleSheet.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "No sale sheets found for this shop" });
    }

    res.status(200).json(latestSaleSheet.rows[0]); // Return the most recent sale sheet
  } catch (error) {
    console.error("Error in getLatestSaleSheet:", error.message);
    res.status(500).json({ error: error.message });
  }
};
