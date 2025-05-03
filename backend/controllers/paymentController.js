import { query } from "../db/db.js";

export const addPayment = async (req, res) => {
  const {
    user_id,
    warehouse_name,
    bill_id,
    brand,
    cases,
    amount,
    volume_ml,
    shop_id,
  } = req.body;

  let liquor_type;

  try {
    const user = await query(`SELECT * FROM users WHERE id = $1`, [user_id]);
    if (user.rowCount === 0) return res.status(404).json({ success: false, error: "User not found" });

    if (shop_id) {
      const shop = await query(`SELECT liquor_type FROM shops WHERE shop_id = $1`, [shop_id]);
      if (shop.rowCount === 0) return res.status(404).json({ success: false, error: "Shop not found" });

      liquor_type = shop.rows[0].liquor_type

      if (shop.rows[0].liquor_type !== liquor_type) return res.status(400).json({ success: false, error: "Shop ID does not match liquor type" });
    }

    const payment = await query(
      `INSERT INTO warehouse_payments (user_id, warehouse_name, bill_id, brand, cases, amount, shop_id, liquor_type,volume_ml)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9)
       RETURNING *`,
      [user_id, warehouse_name, bill_id, brand, cases, amount, shop_id, liquor_type,volume_ml]
    );

    const paymentId = payment.rows[0].id;
    const currentDate = new Date().toISOString().split("T")[0];

    const updateBalance = async (type) => {
      const prev = await query(
        `SELECT balance FROM balance_sheets WHERE type = $1 ORDER BY id DESC LIMIT 1`,
        [type]
      );
      const previousBalance = prev.rows.length > 0 ? Number(prev.rows[0].balance) : 0;
      const newBalance = previousBalance - amount;

      await query(
        `INSERT INTO balance_sheets (type, date, details, debit, credit, balance, warehouse_payment_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [type, currentDate, "Warehouse Payment", amount, 0, newBalance, paymentId]
      );
    };

    const updateWarehouseBalance = async (type) => {
      const prev = await query(
        `SELECT balance FROM warehouse_balance_sheets WHERE type = $1 ORDER BY id DESC LIMIT 1`,
        [type]
      );
      const previousBalance = prev.rows.length > 0 ? Number(prev.rows[0].balance) : 0;
      const newBalance = previousBalance - amount;

      await query(
        `INSERT INTO warehouse_balance_sheets (type, date, details, debit, credit, balance, warehouse_payment_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [type, currentDate, "Warehouse Payment", amount, 0, newBalance, paymentId]
      );
    };

    await updateWarehouseBalance(warehouse_name);
    await updateWarehouseBalance("all");
    if (shop_id) await updateBalance(shop_id);
    await updateBalance("all");

    res.status(200).json({ success: true, message: "Payment recorded successfully", data: payment.rows[0] });

  } catch (error) {
    console.error("Error in addPayment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



export const updatePayment = async (req, res) => {
  const { id } = req.params;
  const { amount, brand, cases, volume_ml } = req.body;

  try {
    const paymentRes = await query(`SELECT * FROM warehouse_payments WHERE id = $1`, [id]);
    if (paymentRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    const oldPayment = paymentRes.rows[0];
    const difference = amount - oldPayment.amount;

    // ✅ Update the warehouse_payment record
    await query(
      `UPDATE warehouse_payments 
       SET amount = COALESCE($1, amount), brand = COALESCE($2, brand), cases = COALESCE($3, cases), volume_ml = COALESCE($4,volume_ml)
       WHERE id = $5`,
      [amount, brand, cases,volume_ml, id]
    );

    // 🔁 Update balance_sheets and warehouse_balance_sheets
    const updateBalances = async (tableName) => {
      const relatedRes = await query(
        `SELECT * FROM ${tableName} 
         WHERE warehouse_payment_id = $1`,
        [id]
      );

      const relatedRows = relatedRes.rows;

      for (const row of relatedRows) {
        const type = row.type;
        const rowId = row.id;

        // ✅ First update the current row’s debit
        await query(
          `UPDATE ${tableName}
           SET debit = $1
           WHERE id = $2`,
          [amount, rowId]
        );

        // 🔁 Get all rows of this type in order (ledger-style)
        const ledgerRes = await query(
          `SELECT * FROM ${tableName}
           WHERE type = $1
           ORDER BY id ASC`,
          [type]
        );

        let runningBalance = 0;

        for (const ledgerRow of ledgerRes.rows) {
          const credit = Number(ledgerRow.credit) || 0;
          const debit = ledgerRow.id === rowId ? Number(amount) : Number(ledgerRow.debit) || 0;

          runningBalance += credit - debit;

          await query(
            `UPDATE ${tableName}
             SET balance = $1
             WHERE id = $2`,
            [runningBalance, ledgerRow.id]
          );
        }
      }
    };

    await updateBalances("balance_sheets");
    await updateBalances("warehouse_balance_sheets");

    res.status(200).json({ success: true, message: "Payment and balances updated successfully" });

  } catch (error) {
    console.error("Error in updatePayment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

