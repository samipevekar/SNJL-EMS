import { query } from "../db/db.js";

export const addPayment = async (req, res) => {
  const {
    user_id,
    warehouse_name,
    bill_id,
    amount,
    shop_id,
    payment_date, // New field
  } = req.body;

  let liquor_type = req.body

  try {
    const user = await query(`SELECT * FROM users WHERE id = $1`, [user_id]);
    if (user.rowCount === 0) return res.status(404).json({ success: false, error: "User not found" });

    if (shop_id) {
      const shop = await query(`SELECT liquor_type FROM shops WHERE shop_id = $1`, [shop_id]);
      if (shop.rowCount === 0) return res.status(404).json({ success: false, error: "Shop not found" });
      
      liquor_type = shop.rows[0].liquor_type
      
    }

    // Use payment_date if provided, otherwise current date
    const effectiveDate = payment_date || new Date().toISOString().split("T")[0];

    const payment = await query(
      `INSERT INTO warehouse_payments (user_id, warehouse_name, bill_id, amount, shop_id, liquor_type, payment_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, warehouse_name, bill_id, amount, shop_id, liquor_type, effectiveDate]
    );

    const paymentId = payment.rows[0].id;

    const updateBalance = async (type) => {
      // Get the balance just before our payment date
      const prev = await query(
        `SELECT balance FROM balance_sheets 
         WHERE type = $1 AND date <= $2 
         ORDER BY date DESC, id DESC LIMIT 1`,
        [type, effectiveDate]
      );
      
      const previousBalance = prev.rows.length > 0 ? Number(prev.rows[0].balance) : 0;
      const newBalance = previousBalance - amount;

      // Get all entries after our payment date to update their balances
      const subsequentEntries = await query(
        `SELECT id, credit, debit FROM balance_sheets 
         WHERE type = $1 AND date > $2 
         ORDER BY date, id`,
        [type, effectiveDate]
      );

      // Insert the new payment record
      await query(
        `INSERT INTO balance_sheets (type, date, details, debit, credit, balance, warehouse_payment_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [type, effectiveDate, "Warehouse Payment", amount, 0, newBalance, paymentId]
      );

      // Update subsequent balances
      let runningBalance = newBalance;
      for (const entry of subsequentEntries.rows) {
        runningBalance = runningBalance + Number(entry.credit) - Number(entry.debit);
        
        await query(
          `UPDATE balance_sheets 
           SET balance = $1 
           WHERE id = $2`,
          [runningBalance, entry.id]
        );
      }
    };

    const updateWarehouseBalance = async (type) => {
      // Get the balance just before our payment date
      const prev = await query(
        `SELECT balance FROM warehouse_balance_sheets 
         WHERE type = $1 AND date <= $2 
         ORDER BY date DESC, id DESC LIMIT 1`,
        [type, effectiveDate]
      );
      
      const previousBalance = prev.rows.length > 0 ? Number(prev.rows[0].balance) : 0;
      const newBalance = previousBalance - amount;

      // Get all entries after our payment date to update their balances
      const subsequentEntries = await query(
        `SELECT id, credit, debit FROM warehouse_balance_sheets 
         WHERE type = $1 AND date > $2 
         ORDER BY date, id`,
        [type, effectiveDate]
      );

      // Insert the new payment record
      await query(
        `INSERT INTO warehouse_balance_sheets (type, date, details, debit, credit, balance, warehouse_payment_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [type, effectiveDate, "Warehouse Payment", amount, 0, newBalance, paymentId]
      );

      // Update subsequent balances
      let runningBalance = newBalance;
      for (const entry of subsequentEntries.rows) {
        runningBalance = runningBalance + Number(entry.credit) - Number(entry.debit);
        
        await query(
          `UPDATE warehouse_balance_sheets 
           SET balance = $1 
           WHERE id = $2`,
          [runningBalance, entry.id]
        );
      }
    };

    // Update balances with proper ledger-style calculation
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
  const { 
    amount, 
    payment_date, 
    warehouse_name, 
    shop_id,
    liquor_type
  } = req.body;

  try {
    await query('BEGIN'); // Start transaction

    // 1. Get the existing payment data
    const paymentRes = await query(
      `SELECT * FROM warehouse_payments WHERE id = $1`, 
      [id]
    );
    
    if (paymentRes.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    const oldPayment = paymentRes.rows[0];
    const oldAmount = Number(oldPayment.amount);
    const oldDate = oldPayment.payment_date;
    const oldWarehouse = oldPayment.warehouse_name;
    const oldShopId = oldPayment.shop_id;

    // Determine the effective new values
    const newAmount = amount !== undefined ? Number(amount) : oldAmount;
    const newDate = payment_date || oldDate;
    const newWarehouse = warehouse_name || oldWarehouse;
    const newShopId = shop_id !== undefined ? shop_id : oldShopId;
    const newLiquorType = liquor_type || oldPayment.liquor_type;

    // Calculate the difference for balance adjustments
    const amountDifference = newAmount - oldAmount;
    const dateChanged = newDate !== oldDate;
    const warehouseChanged = newWarehouse !== oldWarehouse;
    const shopChanged = newShopId !== oldShopId;

    // 2. First delete all related balance entries (we'll recreate them)
    await query(
      `DELETE FROM balance_sheets WHERE warehouse_payment_id = $1`,
      [id]
    );
    
    await query(
      `DELETE FROM warehouse_balance_sheets WHERE warehouse_payment_id = $1`,
      [id]
    );

    // 3. Update the payment record
    await query(
      `UPDATE warehouse_payments 
       SET amount = $1, 
           payment_date = $2,
           warehouse_name = $3,
           shop_id = $4,
           liquor_type = $5
       WHERE id = $6`,
      [newAmount, newDate, newWarehouse, newShopId, newLiquorType, id]
    );

    // 4. Recreate balance entries with proper ledger calculations
    const updateBalanceSheet = async (type, tableName) => {
      // Get the balance just before our payment date
      const prev = await query(
        `SELECT balance FROM ${tableName} 
         WHERE type = $1 AND date <= $2 
         ORDER BY date DESC, id DESC LIMIT 1`,
        [type, newDate]
      );
      
      const previousBalance = prev.rows.length > 0 ? Number(prev.rows[0].balance) : 0;
      const newBalance = previousBalance - newAmount;

      // Get all entries after our payment date to update their balances
      const subsequentEntries = await query(
        `SELECT id, credit, debit FROM ${tableName} 
         WHERE type = $1 AND date > $2 
         ORDER BY date, id`,
        [type, newDate]
      );

      // Insert the new payment record
      await query(
        `INSERT INTO ${tableName} 
         (type, date, details, debit, credit, balance, warehouse_payment_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [type, newDate, "Warehouse Payment", newAmount, 0, newBalance, id]
      );

      // Update subsequent balances
      let runningBalance = newBalance;
      for (const entry of subsequentEntries.rows) {
        runningBalance = runningBalance + Number(entry.credit) - Number(entry.debit);
        
        await query(
          `UPDATE ${tableName} 
           SET balance = $1 
           WHERE id = $2`,
          [runningBalance, entry.id]
        );
      }
    };

    // Update warehouse balances (for both specific warehouse and 'all')
    await updateBalanceSheet(newWarehouse, 'warehouse_balance_sheets');
    await updateBalanceSheet('all', 'warehouse_balance_sheets');

    // Update shop balances if shop_id exists
    if (newShopId) {
      await updateBalanceSheet(newShopId, 'balance_sheets');
    }
    await updateBalanceSheet('all', 'balance_sheets');

    // 5. If date or warehouse/shop changed, we need to clean up old balances
    if (dateChanged || warehouseChanged || shopChanged) {
      // For old warehouse (if changed)
      if (warehouseChanged) {
        await recalculateBalancesFromDate(oldWarehouse, 'warehouse_balance_sheets', oldDate);
        await recalculateBalancesFromDate('all', 'warehouse_balance_sheets', oldDate);
      }

      // For old shop (if changed)
      if (shopChanged && oldShopId) {
        await recalculateBalancesFromDate(oldShopId, 'balance_sheets', oldDate);
        await recalculateBalancesFromDate('all', 'balance_sheets', oldDate);
      }
    }

    await query('COMMIT');
    res.status(200).json({ 
      success: true, 
      message: "Payment and all related balances updated successfully" 
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error("Error in updatePayment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to recalculate balances from a specific date
async function recalculateBalancesFromDate(type, tableName, fromDate) {
  // Get all entries from this date forward
  const entries = await query(
    `SELECT * FROM ${tableName} 
     WHERE type = $1 AND date >= $2 
     ORDER BY date, id`,
    [type, fromDate]
  );

  if (entries.rowCount === 0) return;

  // Get balance before this date
  const prev = await query(
    `SELECT balance FROM ${tableName} 
     WHERE type = $1 AND date < $2 
     ORDER BY date DESC, id DESC LIMIT 1`,
    [type, fromDate]
  );

  let runningBalance = prev.rows.length > 0 ? Number(prev.rows[0].balance) : 0;

  // Recalculate all balances
  for (const entry of entries.rows) {
    runningBalance = runningBalance + Number(entry.credit) - Number(entry.debit);
    
    await query(
      `UPDATE ${tableName} 
       SET balance = $1 
       WHERE id = $2`,
      [runningBalance, entry.id]
    );
  }
}
