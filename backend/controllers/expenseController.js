import { query } from "../db/db.js"

export const addExpense = async (req, res) => {
    const { user_id, amount, message, shop_id } = req.body;

    let liquor_type
  
    try {
      const user = await query(`SELECT * FROM users WHERE id = $1`, [user_id]);
      if (user.rowCount === 0) return res.status(404).json({ success: false, error: "User not found" });
  
      if (shop_id) {
        const shop = await query(`SELECT liquor_type FROM shops WHERE shop_id = $1`, [shop_id]);
        if (shop.rowCount === 0) return res.status(404).json({ success: false, error: "Shop not found" });
        
        liquor_type = shop.rows[0]?.liquor_type
        
        if (shop.rows[0].liquor_type !== liquor_type) {
          return res.status(400).json({ success: false, error: "Shop ID does not match liquor type" });
        }
      }
  
      const expense = await query(
        `INSERT INTO manageral_expenses (user_id, amount, message, shop_id, liquor_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user_id, amount, message, shop_id, liquor_type]
      );
  
      const currentDate = new Date().toISOString().split('T')[0];
      const expenseId = expense.rows[0].id;
  
      const insertBalanceEntry = async (type) => {
        const prevBalanceRes = await query(
          `SELECT balance FROM balance_sheets 
           WHERE type = $1 
           ORDER BY date DESC, id DESC 
           LIMIT 1`,
          [type]
        );
        const previousBalance = Number(prevBalanceRes.rows[0]?.balance) || 0;
        const newBalance = previousBalance - amount;
  
        await query(
          `INSERT INTO balance_sheets 
           (type, date, details, debit, credit, balance, manageral_expense_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [type, currentDate, message || "Expense", amount, 0, newBalance, expenseId]
        );
      };
  
      if (shop_id) await insertBalanceEntry(shop_id);
      await insertBalanceEntry("all");
  
      res.status(200).json({ success: true, message: "Expense added", data: expense.rows[0] });
  
    } catch (error) {
      console.error("Error in addExpense:", error);
      res.status(500).json({ error: error.message });
    }
  };
  


  export const updateExpense = async (req, res) => {
    const { id } = req.params;
    const { amount, message } = req.body;
  
    try {
      // Get the old expense
      const expenseRes = await query(`SELECT * FROM manageral_expenses WHERE id = $1`, [id]);
      if (expenseRes.rowCount === 0) {
        return res.status(404).json({ success: false, error: "Expense not found" });
      }
  
      const oldExpense = expenseRes.rows[0];
  
      // Update the manageral_expense record
      await query(
        `UPDATE manageral_expenses 
         SET amount = COALESCE($1, amount), 
             message = COALESCE($2, message) 
         WHERE id = $3`,
        [amount, message, id]
      );
      
  
      // Get the affected balance sheet rows for this expense
      const balanceRowsRes = await query(
        `SELECT * FROM balance_sheets 
         WHERE manageral_expense_id = $1 
         ORDER BY type, date, id`,
        [id]
      );
  
      const affectedTypes = new Set(balanceRowsRes.rows.map(row => row.type));
  
      // Update debit, details for current balance row, and cascade changes below it
      for (const row of balanceRowsRes.rows) {
        const { type, id: balanceId, date } = row;
  
        // Update the expense row itself
        await query(
          `UPDATE balance_sheets 
           SET debit = $1, details = $2 
           WHERE id = $3`,
          [amount, message || row.details, balanceId]
        );
      }
  
      // For each type (e.g., "all", shop_id), recalculate balances from scratch
      for (const type of affectedTypes) {
        const rowsRes = await query(
          `SELECT * FROM balance_sheets 
           WHERE type = $1
           ORDER BY date, id`,
          [type]
        );
  
        let runningBalance = 0;
  
        for (const row of rowsRes.rows) {
          const { id: rowId, credit, debit } = row;
          runningBalance = runningBalance + Number(credit || 0) - Number(debit || 0);
  
          await query(
            `UPDATE balance_sheets SET balance = $1 WHERE id = $2`,
            [runningBalance, rowId]
          );
        }
      }
  
      res.status(200).json({ success: true, message: "Expense and balances updated successfully" });
  
    } catch (error) {
      console.error("Error in updateExpense:", error);
      res.status(500).json({ error: error.message });
    }
  };
  
  