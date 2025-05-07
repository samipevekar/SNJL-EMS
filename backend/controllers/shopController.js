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
    mgq_q4
  } = req.body;

  try {
    // check if shop_id is unique
    const checkUniqueShopId = await query(
      `SELECT shop_id FROM shops WHERE shop_id = $1`,
      [shop_id]
    );

    if (checkUniqueShopId.rowCount > 0) {
      return res.status(400).json({ error: "shop_id already exists." });
    }

    // Ensure all mgq values are numbers (default to 0 if undefined)
    const q1 = mgq_q1 || 0;
    const q2 = mgq_q2 || 0;
    const q3 = mgq_q3 || 0;
    const q4 = mgq_q4 || 0;

    // Validation
    if (liquor_type === "foreign" && (!mgq_q1 || !mgq_q2 || !mgq_q3 || !mgq_q4)) {
      return res.status(400).json({ error: "Enter all mgq values for foreign liquor" });
    }

    if (liquor_type === "country" && !mgq) {
      return res.status(400).json({ error: "Enter mgq for country liquor" });
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

// edit shop
export const editShop = async (req, res) => {
  const {
    shop_id,
    shop_name,
    mgq,
    liquor_type,
    mgq_q1,
    mgq_q2,
    mgq_q3,
    mgq_q4
  } = req.body;

  const {id} = req.params

  try {
    // Check if shop exists
    const existingShop = await query(`SELECT * FROM shops WHERE id = $1`, [id]);
    if (existingShop.rowCount === 0) {
      return res.status(404).json({ message: "Shop not found." });
    }

    const current = existingShop.rows[0];

    // If liquor_type is changing to 'foreign', validate all quarters
    const newLiquorType = liquor_type || current.liquor_type;

    if (
      newLiquorType === "foreign" &&
      [mgq_q1, mgq_q2, mgq_q3, mgq_q4].some((val, i) => val === undefined && current[`mgq_q${i + 1}`] === null)
    ) {
      return res.status(400).json({ message: "Enter all MGQ values for foreign liquor" });
    }

    if (newLiquorType === "country" && mgq === undefined && current.mgq === null) {
      return res.status(400).json({ message: "Enter MGQ for country liquor" });
    }

    // Calculate mgqs if liquor_type is country
    const final_mgq = newLiquorType === "country" ? (mgq ?? current.mgq) : 0;
    const yearly_mgq = newLiquorType === "country" ? Math.round(final_mgq / 9) : 0;
    const monthly_mgq = newLiquorType === "country" ? Math.round(final_mgq / 9 / 12) : 0;

    // Update with COALESCE to keep existing values if not passed
    const updated = await query(
      `
      UPDATE shops SET
        shop_name = COALESCE($1, shop_name),
        mgq = COALESCE($2, mgq),
        yearly_mgq = COALESCE($3, yearly_mgq),
        monthly_mgq = COALESCE($4, monthly_mgq),
        liquor_type = COALESCE($5, liquor_type),
        mgq_q1 = COALESCE($6, mgq_q1),
        mgq_q2 = COALESCE($7, mgq_q2),
        mgq_q3 = COALESCE($8, mgq_q3),
        mgq_q4 = COALESCE($9, mgq_q4),
        shop_id = COALESCE($10, shop_id)
      WHERE id = $11
      RETURNING *;
      `,
      [
        shop_name,
        newLiquorType === "country" ? final_mgq : null,
        newLiquorType === "country" ? yearly_mgq : null,
        newLiquorType === "country" ? monthly_mgq : null,
        liquor_type,
        mgq_q1,
        mgq_q2,
        mgq_q3,
        mgq_q4,
        shop_id,
        id
      ]
    );

    res.status(200).json({
      success: true,
      message: "Shop updated successfully.",
      data: updated.rows[0],
    });
  } catch (error) {
    console.error("Error in editShop controller:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
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

// get all shop
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

export const getShopById = async (req, res) => {
  const {shop_id} = req.params
  try {
    const shops = await query(
      `
            SELECT * FROM shops
            WHERE shop_id = $1
            `,
            [shop_id]
    );

    if (shops.rowCount === 0) {
      return res.status(404).json({ message: "No shop registered" });
    }

    res.status(200).json(shops.rows[0]);
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

    // Transform expenses into the desired format
    const formattedExpenses = expenses.rows.flatMap(row => {
      if (!row.expenses || row.expenses.length === 0) return [];
      
      // Format date as DD-MM-YYYY
      const dateObj = new Date(row.sale_date);
      const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
      
      return row.expenses.map(exp => ({
        sale_date: formattedDate,
        amount: exp.amount || 0,
        message: exp.message || ''
      }));
    });

    res.status(200).json(formattedExpenses);

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
