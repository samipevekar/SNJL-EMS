import { query } from "../db/db.js";

export const createSaleSheet = async (req, res) => {
  const {
    shop_id,
    brand_name,
    volume_ml,
    sale,
    expenses,
    upi,
    canteen,
    stock_increment_id,
    sale_date,
    w_stock = false
  } = req.body;

  try {
    await query('BEGIN');

    // Use sale_date from request if provided, otherwise use current date
    const currentDate = sale_date || new Date().toISOString().split("T")[0];
    const currentDateTime = sale_date ? new Date(sale_date) : new Date();

    // Check for existing sale sheet for this date, brand, and shop
    const existingSheet = await query(
      `SELECT * FROM sale_sheets 
       WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 AND sale_date = $4`,
      [shop_id, brand_name, volume_ml, currentDate]
    );

    if(existingSheet.rowCount > 0) {
      await query('ROLLBACK');
      return res.status(400).json({ message: "Sale sheet already exists for this date" });
    }

    // Get shop details
    const shop = await query(`SELECT * FROM shops WHERE shop_id = $1`, [shop_id]);
    if (shop.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ message: "Shop not found" });
    }

    const liquor_type = shop.rows[0].liquor_type;

    // Validate liquor type
    if (liquor_type === "country" && shop.rows[0].liquor_type !== "country") {
      await query('ROLLBACK');
      return res.status(400).json({ success: false, error: "Shop does not sell country liquor" });
    }

    if ((liquor_type === "foreign" || liquor_type === "beer") && shop.rows[0].liquor_type !== "foreign") {
      await query('ROLLBACK');
      return res.status(400).json({ success: false, error: "Shop does not sell foreign liquor" });
    }

    // Get brand details
    const brandData = await query(
      `SELECT mrp_per_unit FROM brands 
       WHERE brand_name = $1 AND liquor_type = $2 AND volume_ml = $3`,
      [brand_name, liquor_type, volume_ml]
    );

    if (brandData.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: "Brand not found with given volume or liquor type",
      });
    }

    const { mrp_per_unit } = brandData.rows[0];

    // Get opening balance logic
    let opening_balance;

    if (sale_date) {
      // For backdated entries, find the most recent sale sheet BEFORE the provided date
      const previousEntry = await query(
        `SELECT closing_balance FROM sale_sheets 
         WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 AND sale_date < $4
         ORDER BY sale_date DESC LIMIT 1`,
        [shop_id, brand_name, volume_ml, currentDate]
      );

      if (previousEntry.rowCount > 0) {
        opening_balance = previousEntry.rows[0].closing_balance;
      } else {
        // If no previous sale sheet, get sum of pieces from stock_increments before this date
        const stockSum = await query(
          `SELECT COALESCE(SUM(pieces), 0) as total_pieces 
           FROM stock_increments 
           WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 
           AND created_at <= $4`,
          [shop_id, brand_name, volume_ml, currentDateTime]
        );
        opening_balance = stockSum.rows[0].total_pieces;
      }
    } else {
      // For current date entries, use the latest closing balance regardless of date
      const previousEntry = await query(
        `SELECT closing_balance FROM sale_sheets 
         WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3
         ORDER BY sale_date DESC, created_at DESC LIMIT 1`,
        [shop_id, brand_name, volume_ml]
      );

      if (previousEntry.rowCount > 0) {
        opening_balance = previousEntry.rows[0].closing_balance;
      } else {
        // If no previous sale sheet, get total pieces from stock_increments
        const stockSum = await query(
          `SELECT COALESCE(SUM(pieces), 0) as total_pieces 
           FROM stock_increments 
           WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3`,
          [shop_id, brand_name, volume_ml]
        );
        opening_balance = stockSum.rows[0].total_pieces;
      }
    }

    if (!opening_balance && opening_balance !== 0) {
      await query('ROLLBACK');
      return res.status(400).json({success:false, error:"You don't have stock for this brand"});
    }

    // Check if sale is greater than opening_balance
    if (sale > opening_balance) {
      await query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: `Sale (${sale}) cannot be greater than available stock (${opening_balance})`
      });
    }

    const daily_sale = sale * mrp_per_unit;
    const total_expenses = expenses?.length > 0
      ? expenses.reduce((sum, exp) => sum + exp.amount, 0)
      : 0;

    const net_cash = daily_sale - total_expenses + (canteen || 0);
    const cash_in_hand = (net_cash - upi) || 0;
    const closing_balance = opening_balance - sale;

    // Insert the new sale sheet with w_stock flag
    const result = await query(
      `INSERT INTO sale_sheets 
       (shop_id, liquor_type, brand_name, volume_ml, opening_balance, sale, mrp, 
        daily_sale, closing_balance, expenses, upi, net_cash, canteen, cash_in_hand, 
        sale_date, created_at, stock_increment_id, w_stock) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
       RETURNING *`,
      [
        shop_id,
        liquor_type,
        brand_name,
        volume_ml,
        opening_balance,
        sale,
        mrp_per_unit,
        daily_sale,
        closing_balance,
        JSON.stringify(expenses),
        upi,
        net_cash,
        canteen,
        cash_in_hand,
        currentDate,
        currentDateTime,
        stock_increment_id,
        w_stock
      ]
    );

    // If this is a backdated entry, we need to update all subsequent sale sheets
    if (sale_date) {
      // Get all sale sheets for this shop/brand/volume after our inserted date
      const subsequentSheets = await query(
        `SELECT id, opening_balance, sale, closing_balance 
         FROM sale_sheets 
         WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 
         AND sale_date > $4
         ORDER BY sale_date ASC, created_at ASC`,
        [shop_id, brand_name, volume_ml, currentDate]
      );

      // Calculate the new opening balance for the first subsequent sheet
      let newOpeningBalance = closing_balance;
      
      // Update each subsequent sheet
      for (const sheet of subsequentSheets.rows) {
        // Calculate new closing balance
        const newClosingBalance = newOpeningBalance - sheet.sale;
        
        await query(
          `UPDATE sale_sheets 
           SET opening_balance = $1, closing_balance = $2 
           WHERE id = $3`,
          [newOpeningBalance, newClosingBalance, sheet.id]
        );
        
        // The next sheet's opening balance is this sheet's new closing balance
        newOpeningBalance = newClosingBalance;
      }
    }

    // Balance Sheet Update Logic
    const balanceSheetTypes = w_stock ? ['all', 'w_stock'] : ['all', shop_id];

    for (const type of balanceSheetTypes) {
      // Get the balance just before our current date
      const prevBalanceResult = await query(
        `SELECT balance FROM balance_sheets 
         WHERE type = $1 AND date <= $2 
         ORDER BY date DESC, id DESC LIMIT 1`,
        [type, currentDate]
      );

      const previousBalance = prevBalanceResult.rows.length > 0
        ? Number(prevBalanceResult.rows[0]?.balance)
        : 0;

      const newBalance = previousBalance + net_cash;

      // Insert the new balance sheet entry
      await query(
        `INSERT INTO balance_sheets 
         (type, date, details, debit, credit, balance, sale_sheet_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          type,
          currentDate,
          "Net Cash",
          0,
          net_cash,
          newBalance,
          result.rows[0].id,
        ]
      );

      // If this is a backdated entry, update all subsequent balance entries
      if (sale_date) {
        // Get all balance entries after our current date
        const subsequentBalances = await query(
          `SELECT id, credit, balance FROM balance_sheets 
           WHERE type = $1 AND date > $2 
           ORDER BY date ASC, id ASC`,
          [type, currentDate]
        );

        // Update each subsequent balance entry
        let runningBalance = newBalance;
        for (const balanceEntry of subsequentBalances.rows) {
          runningBalance += Number(balanceEntry.credit);
          
          await query(
            `UPDATE balance_sheets 
             SET balance = $1 
             WHERE id = $2`,
            [runningBalance, balanceEntry.id]
          );
        }
      }
    }

    await query('COMMIT');

    res.json({
      success: true,
      message: "Sale sheet created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await query('ROLLBACK');
    res.status(500).json({ error: error.message });
    console.log("Error in createSaleSheet:", error);
  }
};



// update sale sheet
export const updateSaleSheet = async (req, res) => {
  const { id } = req.params;
  const {
    sale,
    expenses,
    brand_name,
    liquor_type,
    volume_ml,
    upi,
    canteen,
    opening_balance: rawOpeningBalance,
  } = req.body;

  const parseNumber = (val, fallback = 0) =>
    isNaN(Number(val)) ? fallback : Number(val);

  try {
    // Start a transaction
    await query('BEGIN');

    // Get existing sale sheet
    const existingSheetResult = await query(
      `SELECT * FROM sale_sheets WHERE id = $1`,
      [id]
    );
    if (existingSheetResult.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ message: "Sale sheet not found" });
    }

    const existingSheet = existingSheetResult.rows[0];
    const shop_id = existingSheet.shop_id;

    const updatedLiquorType = liquor_type ?? existingSheet.liquor_type;
    const updatedVolume = volume_ml ?? existingSheet.volume_ml;
    const updatedBrand = brand_name ?? existingSheet.brand_name;

    // Get brand MRP
    const brandData = await query(
      `SELECT mrp_per_unit FROM brands WHERE brand_name = $1 AND liquor_type = $2 AND volume_ml = $3`,
      [updatedBrand, updatedLiquorType, updatedVolume]
    );

    if (brandData.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ message: "Brand not found with given details" });
    }

    const { mrp_per_unit } = brandData.rows[0];

    const validSale = parseNumber(sale, existingSheet.sale);
    const opening_balance = parseNumber(
      rawOpeningBalance,
      existingSheet.opening_balance
    );

    // Validate sale doesn't exceed opening balance
    if (validSale > opening_balance) {
      await query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Sale (${validSale}) cannot be greater than available stock (${opening_balance})`,
      });
    }

    // Handle expenses
    let parsedExpenses = [];
    if (expenses) {
      parsedExpenses = Array.isArray(expenses)
        ? expenses.map((exp) => ({
            message: exp.message || '',
            amount: parseNumber(exp.amount, 0)
          }))
        : JSON.parse(existingSheet.expenses || "[]");
    } else {
      parsedExpenses = Array.isArray(existingSheet.expenses)
        ? existingSheet.expenses
        : JSON.parse(existingSheet.expenses || "[]");
    }

    const total_expenses = parsedExpenses.reduce(
      (sum, e) => sum + parseNumber(e.amount),
      0
    );

    const daily_sale = validSale * mrp_per_unit;
    const net_cash = daily_sale - total_expenses + (canteen || 0); 
    const cash_in_hand = net_cash - parseNumber(upi ?? existingSheet.upi, 0);
    const closing_balance = opening_balance - validSale;

    // Update the current sale sheet
    const result = await query(
      `UPDATE sale_sheets
       SET brand_name = $1, liquor_type = $2, volume_ml = $3, mrp = $4, sale = $5,
           closing_balance = $6, expenses = $7, net_cash = $8, opening_balance = $9, 
           daily_sale = $10, upi = $11, cash_in_hand = $12
       WHERE id = $13 RETURNING *`,
      [
        updatedBrand,
        updatedLiquorType,
        updatedVolume,
        mrp_per_unit,
        validSale,
        closing_balance,
        JSON.stringify(parsedExpenses),
        net_cash,
        opening_balance,
        daily_sale,
        parseNumber(upi ?? existingSheet.upi),
        cash_in_hand,
        id,
      ]
    );

    // Get all subsequent sale sheets for the same brand, volume and shop
    const subsequentSheets = await query(
      `SELECT id, opening_balance, sale, closing_balance 
       FROM sale_sheets 
       WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 
       AND sale_date > $4
       ORDER BY sale_date ASC`,
      [shop_id, updatedBrand, updatedVolume, existingSheet.sale_date]
    );

    // Calculate new opening and closing balances for subsequent sheets
    let previousClosing = closing_balance;
    let hasStockError = false;

    for (const sheet of subsequentSheets.rows) {
      // Check if the new opening balance would be less than the sale
      if (previousClosing < sheet.sale) {
        hasStockError = true;
        break;
      }
      
      const newClosing = previousClosing - sheet.sale;
      
      // Update the subsequent sheet
      await query(
        `UPDATE sale_sheets 
         SET opening_balance = $1, closing_balance = $2 
         WHERE id = $3`,
        [previousClosing, newClosing, sheet.id]
      );
      
      previousClosing = newClosing;
    }

    if (hasStockError) {
      await query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: "Cannot update as it would make opening balance less than sale for subsequent sheets"
      });
    }

    const currentDate = new Date().toISOString().split("T")[0];

    // Update and cascade balance sheets
    const updateAndCascadeBalances = async (typeValue) => {
      const current = await query(
        `SELECT id, balance, credit FROM balance_sheets WHERE type = $1 AND sale_sheet_id = $2`,
        [typeValue, id]
      );

      if (current.rowCount > 0) {
        const prevCredit = parseNumber(current.rows[0].credit);
        const prevBalance = parseNumber(current.rows[0].balance);
        const newBalance = prevBalance - prevCredit + net_cash;

        await query(
          `UPDATE balance_sheets SET date = $1, details = $2, debit = $3, credit = $4, balance = $5 WHERE id = $6`,
          [currentDate, "Net Cash", 0, net_cash, newBalance, current.rows[0].id]
        );

        // Cascade update all future balance rows
        const futureRows = await query(
          `SELECT id, credit, debit FROM balance_sheets WHERE type = $1 AND sale_sheet_id > $2 ORDER BY sale_sheet_id ASC`,
          [typeValue, id]
        );

        let runningBalance = newBalance;
        for (const row of futureRows.rows) {
          runningBalance += parseNumber(row.credit) - parseNumber(row.debit);
          await query(`UPDATE balance_sheets SET balance = $1 WHERE id = $2`, [
            runningBalance,
            row.id,
          ]);
        }
      }
    };

    await updateAndCascadeBalances(shop_id);
    await updateAndCascadeBalances("all");

    // Commit the transaction
    await query('COMMIT');

    res.json({
      success: true,
      message: "Sale sheet updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    await query('ROLLBACK');
    console.error("Error in updateSaleSheet:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// delete sale_sheet
export const deleteSaleSheet = async (req, res) => {
  const { id } = req.params;

  try {
    // ✅ Step 1: Check if sale sheet exists
    const existingEntry = await query(
      `SELECT * FROM sale_sheets WHERE id = $1`,
      [id]
    );

    if (existingEntry.rowCount === 0) {
      return res.status(404).json({ message: "Sale sheet not found." });
    }

    //  Step 6: Delete the sale sheet
    await query(`DELETE FROM sale_sheets WHERE id = $1`, [id]);

    res.status(200).json({ message: "Sale sheet deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in deleteSaleSheet:", error.message);
  }
};

// get specific sale sheet
export const getSpecificSaleSheet = async (req, res) => {
  const { id } = req.params;
  try {
    const sale_sheet = await query(
      `
      SELECT * FROM sale_sheets 
      WHERE id = $1
      `,
      [id]
    );

    if (sale_sheet.rowCount === 0) {
      return res.status(404).json({ message: "Sale sheet not found" });
    }

    res.status(200).json(sale_sheet.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in getSpecificSaleSheet:", error.message);
  }
};

// get sale_sheets by specific shop_id
export const getSaleSheetByShopId = async (req, res) => {
  const { shop_id } = req.params;
  const { sale_date, latest } = req.query;

  try {
    // ✅ Check if the shop exists
    const shop = await query(`SELECT * FROM shops WHERE shop_id = $1`, [
      shop_id,
    ]);

    if (shop.rowCount === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    let sale_sheets;

    if (sale_date) {
      // ✅ If sale_date is provided, fetch for that date
      sale_sheets = await query(
        `SELECT * FROM sale_sheets WHERE shop_id = $1 AND sale_date = $2`,
        [shop_id, sale_date]
      );
    } else if (latest === "true") {
      // ✅ If latest=true, find the latest date for this shop
      const latestDateRes = await query(
        `SELECT MAX(sale_date) as latest_date FROM sale_sheets WHERE shop_id = $1`,
        [shop_id]
      );

      const latestDate = latestDateRes.rows[0]?.latest_date;

      if (!latestDate) {
        return res
          .status(404)
          .json({ message: "No sale sheets found for this shop" });
      }

      // ✅ Fetch all sale sheets for that latest date
      sale_sheets = await query(
        `SELECT * FROM sale_sheets WHERE shop_id = $1 AND sale_date = $2`,
        [shop_id, latestDate]
      );
    } else {
      // ✅ If neither sale_date nor latest, fetch all
      sale_sheets = await query(
        `SELECT * FROM sale_sheets WHERE shop_id = $1`,
        [shop_id]
      );
    }

    res.status(200).json(sale_sheets.rows.reverse());
  } catch (error) {
    console.error("Error in getSaleSheetByShopId:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// add expenses
export const addExpenseToSaleSheet = async (req, res) => {
  const { expenses } = req.body; // Array of expenses [{ amount, message }]
  const { shop_id } = req.params;

  try {
    // Ensure expenses is always an array
    const expenseList = Array.isArray(expenses) ? expenses : [expenses];

    // Check if today's sale sheet exists
    const existingEntry = await query(
      `SELECT expenses, net_cash FROM sale_sheets WHERE shop_id = $1 AND sale_date = CURRENT_DATE`,
      [shop_id]
    );

    if (existingEntry.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "No sale sheet found for today." });
    }

    // Extract current expenses and net_cash
    const currentExpenses = existingEntry.rows[0].expenses || [];
    const currentNetCash = existingEntry.rows[0].net_cash;

    // Merge new expenses with existing ones
    const updatedExpenses = [...currentExpenses, ...expenseList];

    // Calculate new net_cash
    const totalNewExpenses = expenseList.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const updatedNetCash = currentNetCash - totalNewExpenses;

    // Update the sale sheet with new expenses and net_cash
    await query(
      `UPDATE sale_sheets SET expenses = $1, net_cash = $2 WHERE shop_id = $3 AND sale_date = CURRENT_DATE`,
      [JSON.stringify(updatedExpenses), updatedNetCash, shop_id]
    );

    res.json({
      message: `${expenseList.length} expense(s) added successfully.`,
      addedExpenses: expenseList, // Show newly added expenses
      totalExpenses: updatedExpenses, // Show all expenses (old + new)
      updatedNetCash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in addExpenseToSaleSheet:", error.message);
  }
};

// calculate daily net cash for country liquor
export const dailyNetCashForCountryLiquor = async (req, res) => {
  const { shop_id } = req.body;
  try {
    // check shop_id
    if (!shop_id) {
      return res.status(400).json({ error: "shop_id is required" });
    }

    const shop = await query(
      `
      SELECT * from sale_sheets 
      WHERE shop_id = $1 AND sale_date = CURRENT_DATE
      `,
      [shop_id]
    );
    if (shop.rowCount === 0) {
      return res.status(404).json({ error: "shop not found" });
    }

    // Get the current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split("T")[0];

    // Fetch sum of net_cash for the current date where liquor_type = 'Country'
    const totalNetCashResult = await query(
      `SELECT COALESCE(SUM(net_cash), 0) AS total_net_cash 
       FROM sale_sheets 
       WHERE liquor_type = 'country' AND DATE(created_at) = $1`,
      [currentDate]
    );

    const totalNetCash = totalNetCashResult.rows[0].total_net_cash;

    // Check if entry already exists
    const existingEntry = await query(
      `SELECT id FROM daily_sales_summary WHERE sale_date = $1 AND liquor_type = 'country'`,
      [currentDate]
    );

    if (existingEntry.rows.length > 0) {
      // Entry exists, update it
      await query(
        `UPDATE daily_sales_summary SET total_net_cash = $1 WHERE sale_date = $2 AND liquor_type = 'country'`,
        [totalNetCash, currentDate]
      );
    } else {
      // Insert new entry
      await query(
        `INSERT INTO daily_sales_summary (sale_date, liquor_type, total_net_cash,shop_id) VALUES ($1, $2, $3,$4)`,
        [currentDate, "country", totalNetCash, shop_id]
      );
    }

    res.json({
      message: "Daily net cash updated successfully",
      date: currentDate,
      totalNetCash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// calculate daily net cash for foreign liquor
export const dailyNetCashForForeignLiquor = async (req, res) => {
  const { shop_id } = req.body;
  try {
    // check shop_id
    if (!shop_id) {
      return res.status(400).json({ error: "shop_id is required" });
    }

    const shop = await query(
      `
      SELECT * from sale_sheets 
      WHERE shop_id = $1 AND sale_date = CURRENT_DATE
      `,
      [shop_id]
    );
    if (shop.rowCount === 0) {
      return res.status(404).json({ error: "shop not found" });
    }

    // Get the current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split("T")[0];

    // Fetch sum of net_cash for the current date where liquor_type = 'foreign'
    const totalNetCashResult = await query(
      `SELECT COALESCE(SUM(net_cash), 0) AS total_net_cash 
       FROM sale_sheets 
       WHERE liquor_type = 'foreign' AND DATE(created_at) = $1`,
      [currentDate]
    );

    const totalNetCash = totalNetCashResult.rows[0].total_net_cash;

    // Check if entry already exists
    const existingEntry = await query(
      `SELECT id FROM daily_sales_summary WHERE sale_date = $1 AND liquor_type = 'foreign'`,
      [currentDate]
    );

    if (existingEntry.rows.length > 0) {
      // Entry exists, update it
      await query(
        `UPDATE daily_sales_summary SET total_net_cash = $1 WHERE sale_date = $2 AND liquor_type = 'foreign'`,
        [totalNetCash, currentDate]
      );
    } else {
      // Insert new entry
      await query(
        `INSERT INTO daily_sales_summary (sale_date, liquor_type, total_net_cash,shop_id) VALUES ($1, $2, $3,$4)`,
        [currentDate, "foreign", totalNetCash, shop_id]
      );
    }

    res.json({
      message: "Daily net cash updated successfully",
      date: currentDate,
      totalNetCash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// calculate daily net cash for foreign liquor
export const dailyNetCashForBeerLiquor = async (req, res) => {
  const { shop_id } = req.body;
  try {
    // check shop_id
    if (!shop_id) {
      return res.status(400).json({ error: "shop_id is required" });
    }

    const shop = await query(
      `
      SELECT * from sale_sheets 
      WHERE shop_id = $1 AND sale_date = CURRENT_DATE
      `,
      [shop_id]
    );
    if (shop.rowCount === 0) {
      return res.status(404).json({ error: "shop not found" });
    }

    // Get the current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split("T")[0];

    // Fetch sum of net_cash for the current date where liquor_type = 'foreign'
    const totalNetCashResult = await query(
      `SELECT COALESCE(SUM(net_cash), 0) AS total_net_cash 
       FROM sale_sheets 
       WHERE liquor_type = 'beer' AND DATE(created_at) = $1`,
      [currentDate]
    );

    const totalNetCash = totalNetCashResult.rows[0].total_net_cash;

    // Check if entry already exists
    const existingEntry = await query(
      `SELECT id FROM daily_sales_summary WHERE sale_date = $1 AND liquor_type = 'beer'`,
      [currentDate]
    );

    if (existingEntry.rows.length > 0) {
      // Entry exists, update it
      await query(
        `UPDATE daily_sales_summary SET total_net_cash = $1 WHERE sale_date = $2 AND liquor_type = 'beer'`,
        [totalNetCash, currentDate]
      );
    } else {
      // Insert new entry
      await query(
        `INSERT INTO daily_sales_summary (sale_date, liquor_type, total_net_cash,shop_id) VALUES ($1, $2, $3,$4)`,
        [currentDate, "beer", totalNetCash, shop_id]
      );
    }

    res.json({
      message: "Daily net cash updated successfully",
      date: currentDate,
      totalNetCash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get accouting data
export const getAccountingData = async (req, res) => {
  try {
    const { shop_ids, month, year, type } = req.query;
    const manager_id = req.user.id; // Manager ID

    console.log(manager_id, shop_ids, month, year, type);

    // Get Current Year and Month if not provided
    const now = new Date();
    const queryYear = year ? Number(year) : now.getFullYear();
    const queryMonth = month ? Number(month) : now.getMonth() + 1;

    const startOfMonth = `${queryYear}-${queryMonth}-01`;
    const endOfMonth = `${queryYear}-${queryMonth}-${new Date(
      queryYear,
      queryMonth,
      0
    ).getDate()}`;
    const startOfYear = `${queryYear}-01-01`;

    // Convert shop_ids to an integer array, ensuring it's never null
    const shopIdsArray = shop_ids ? shop_ids.split(",").map(Number) : [];

    // Filter shops based on type if provided
    let filteredShopIds = shopIdsArray;
    if (shopIdsArray.length && type) {
      const validShopsQuery = await query(
        `SELECT shop_id FROM shops WHERE shop_id = ANY($1::int[]) AND liquor_type = $2::text`,
        [shopIdsArray, type]
      );
      filteredShopIds = validShopsQuery.rows.map((row) => row.shop_id);
    }

    // Function to execute sales queries dynamically
    const salesQuery = async (startDate, endDate) => {
      let queryStr = `
        SELECT COALESCE(SUM(net_cash), 0) AS total_net_cash 
        FROM sale_sheets 
        WHERE sale_date BETWEEN $1 AND $2`;

      const params = [startDate, endDate];

      if (type) {
        queryStr += ` AND liquor_type = $${params.length + 1}::text`;
        params.push(type);
      }
      if (filteredShopIds.length) {
        queryStr += ` AND shop_id = ANY($${params.length + 1}::int[])`;
        params.push(filteredShopIds);
      }

      const result = await query(queryStr, params);
      return result.rows[0]?.total_net_cash || 0;
    };

    // Get Monthly & Yearly Sales
    const monthlySale = await salesQuery(startOfMonth, endOfMonth);
    const yearlySale = await salesQuery(startOfYear, `${queryYear}-12-31`);

    // Function to execute stock increment queries dynamically
    const stockIncrementQuery = async (startDate, endDate) => {
      let queryStr = `
        SELECT stock_increment FROM sale_sheets 
        WHERE sale_date BETWEEN $1 AND $2`;

      const params = [startDate, endDate];

      if (type) {
        queryStr += ` AND liquor_type = $${params.length + 1}::text`;
        params.push(type);
      }
      if (filteredShopIds.length) {
        queryStr += ` AND shop_id = ANY($${params.length + 1}::int[])`;
        params.push(filteredShopIds);
      }

      const result = await query(queryStr, params);

      let totalStock = 0;
      result.rows.forEach((row) => {
        const stockArray = row.stock_increment || [];
        stockArray.forEach((stock) => {
          totalStock += stock.cases || 0;
        });
      });

      return totalStock;
    };

    // Get Monthly & Yearly Cost Price
    const monthlyStock = await stockIncrementQuery(startOfMonth, endOfMonth);
    const yearlyStock = await stockIncrementQuery(
      startOfYear,
      `${queryYear}-12-31`
    );
    const monthlyCostPrice = monthlyStock * 2667;
    const yearlyCostPrice = yearlyStock * 2667;

    // Calculate Profits
    const monthlyProfit = monthlySale - monthlyCostPrice;
    const yearlyProfit = yearlySale - yearlyCostPrice;

    // Function to execute payment queries dynamically
    const paymentQuery = async (startDate, endDate) => {
      let queryStr = `
        SELECT COALESCE(SUM(amount), 0) AS total_payment 
        FROM warehouse_payments 
        WHERE payment_date BETWEEN $1 AND $2 
        AND user_id = $3`;

      const params = [startDate, endDate, manager_id];

      if (type) {
        queryStr += ` AND liquor_type = $${params.length + 1}::text`;
        params.push(type);
      }
      if (filteredShopIds.length) {
        queryStr += ` AND shop_id = ANY($${params.length + 1}::int[])`;
        params.push(filteredShopIds);
      }

      const result = await query(queryStr, params);
      return result.rows[0]?.total_payment || 0;
    };

    // Get Monthly & Yearly Payments
    const monthlyPayment = await paymentQuery(startOfMonth, endOfMonth);
    const yearlyPayment = await paymentQuery(startOfYear, `${queryYear}-12-31`);

    // Warehouse Balance
    const monthlyWarehouseBalance = monthlyCostPrice - monthlyPayment;
    const yearlyWarehouseBalance = yearlyCostPrice - yearlyPayment;

    // Final Response
    res.status(200).json({
      monthly_sale: monthlySale,
      yearly_sale: yearlySale,
      monthly_profit: monthlyProfit,
      yearly_profit: yearlyProfit,
      monthly_warehouse_balance: monthlyWarehouseBalance,
      yearly_warehouse_balance: yearlyWarehouseBalance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error("❌ Error in getAccountingData:", error);
  }
};
