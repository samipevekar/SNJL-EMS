import { query } from "../db/db.js";

export const addPayment = async (req, res) => {
  const {
    user_id,
    warehouse_name,
    bill_id,
    brand,
    cases,
    amount,
    shop_id,
    liquor_type,
  } = req.body;

  try {
    // Check if user exists
    const user = await query(`SELECT * FROM users WHERE id = $1`, [user_id]);

    if (user.rowCount === 0) {
      return res.status(404).json({success:false, error: "User not found" });
    }

    // Check if shop_id matches liquor_type
    if (shop_id) {
      const shop = await query(
        `SELECT liquor_type FROM shops WHERE shop_id = $1`,
        [shop_id]
      );

      if (shop.rowCount === 0) {
        return res.status(404).json({success:false,error: "Shop not found" });
      }

      if (shop.rows[0].liquor_type !== liquor_type) {
        return res
          .status(400)
          .json({success:false, error: "Shop ID does not match liquor type" });
      }
    }

    // Insert warehouse payment record
    const payment = await query(
      `INSERT INTO warehouse_payments (user_id, warehouse_name, bill_id, brand, cases, amount, shop_id, liquor_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user_id, warehouse_name, bill_id, brand, cases, amount, shop_id, liquor_type]
    );

    const currentDate = new Date().toISOString().split("T")[0];

    // Function to update balance in balance_sheets
    const updateBalance = async (type) => {
      try {
        // Fetch correct last balance
        const prevBalanceResult = await query(
          `SELECT balance FROM balance_sheets 
           WHERE type = $1 
           ORDER BY id DESC 
           LIMIT 1`,
          [type]
        );

        const previousBalance = prevBalanceResult.rows.length > 0 ? Number(prevBalanceResult.rows[0].balance) : 0;
        const newBalance = previousBalance - amount;

        // Insert new balance entry
        await query(
          `INSERT INTO balance_sheets (type, date, details, debit, credit, balance)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [type, currentDate, `Warehouse Payment`, amount, 0, newBalance]
        );

        console.log(`✅ Updated balance_sheets: ${type} | Previous Balance: ${previousBalance} | New Balance: ${newBalance}`);
      } catch (error) {
        console.error(`❌ Error updating balance_sheets for ${type}:`, error);
      }
    };

    // Function to update balance in warehouse_balance_sheets
    const updateWarehouseBalance = async (type) => {
      try {
        const prevBalanceResult = await query(
          `SELECT balance FROM warehouse_balance_sheets 
           WHERE type = $1 
           ORDER BY id DESC 
           LIMIT 1`,
          [type]
        );

        const previousBalance = prevBalanceResult.rows.length > 0 ? Number(prevBalanceResult.rows[0].balance) : 0;
        const newBalance = previousBalance - amount;

        await query(
          `INSERT INTO warehouse_balance_sheets (type, date, details, debit, credit, balance)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [type, currentDate, `Warehouse Payment`, amount, 0, newBalance]
        );

        console.log(`✅ Updated warehouse_balance_sheets: ${type} | Previous Balance: ${previousBalance} | New Balance: ${newBalance}`);
      } catch (error) {
        console.error(`❌ Error updating warehouse_balance_sheets for ${type}:`, error);
      }
    };

    // Deduct from warehouse balance
    await updateWarehouseBalance(warehouse_name);
    await updateWarehouseBalance("all");

    // Deduct from shop balance if shop_id exists
    if (shop_id) {
      await updateBalance(shop_id);
    }

    // ✅ FIX: Ensure "all" in balance_sheets updates correctly
    await updateBalance("all"); 

    res.status(200).json({
      success:true,
      message: "Payment recorded successfully",
      data: payment.rows[0],
    });

  } catch (error) {
    res.status(500).json({success:false, error: error.message });
    console.log("Error in addPayment controller:", error);
  }
};


