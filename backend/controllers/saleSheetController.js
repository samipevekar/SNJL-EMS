import { query } from "../db/db.js";

// create sale sheet
export const createSaleSheet = async (req, res) => {
  const {
    shop_id,
    brand_name,
    volume_ml,
    sale,
    stock_increment,
    expenses,
    upi,
  } = req.body;

  let { opening_balance } = req.body;

  try {
    const currentDate = new Date().toISOString().split("T")[0];
    console.log(currentDate)

    // ✅ Check for existing sale sheet for same shop, brand, volume, and date
    const existingSheet = await query(
      `SELECT * FROM sale_sheets WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 AND sale_date = $4`,
      [shop_id, brand_name, volume_ml, currentDate]
    );

    if (existingSheet.rowCount > 0) {
      return res.status(400).json({
        success: false,
        error:
          "Sale sheet already exists for today",
      });
    }

    const shop = await query(`SELECT * FROM shops WHERE shop_id = $1`, [
      shop_id,
    ]);
    if (shop.rowCount === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const liquor_type = shop.rows[0].liquor_type;

    if (liquor_type === "country" && shop.rows[0].liquor_type !== "country") {
      return res
        .status(400)
        .json({ success: false, error: "Shop does not sell country liquor" });
    }

    if (
      (liquor_type === "foreign" || liquor_type === "beer") &&
      shop.rows[0].liquor_type !== "foreign"
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Shop does not sell foreign liquor" });
    }

    const brandData = await query(
      `SELECT mrp_per_unit, cost_price_per_case, duty, pieces_per_case FROM brands WHERE brand_name = $1 AND liquor_type = $2 AND volume_ml = $3`,
      [brand_name, liquor_type, volume_ml]
    );

    if (brandData.rowCount === 0) {
      return res
        .status(404)
        .json({
          success: false,
          error: "Brand not found with given volume or liquor type",
        });
    }

    const { mrp_per_unit, cost_price_per_case, duty, pieces_per_case } =
      brandData.rows[0];

    const previousEntry = await query(
      `SELECT closing_balance FROM sale_sheets WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 ORDER BY created_at DESC LIMIT 1`,
      [shop_id, brand_name, volume_ml]
    );

    opening_balance = previousEntry.rows[0]?.closing_balance || opening_balance;

    const stock_increment_cases = stock_increment
      ? stock_increment.reduce((sum, item) => sum + item.cases, 0)
      : 0;

    let stock_increment_pcs = 0;
    if (liquor_type === "country") {
      stock_increment_pcs = stock_increment_cases * 45;
    } else {
      stock_increment_pcs = stock_increment_cases * pieces_per_case;
    }

    const daily_sale = sale * mrp_per_unit;
    const total_expenses =
      expenses?.length > 0
        ? expenses.reduce((sum, exp) => sum + exp.amount, 0)
        : 0;

    const net_cash = daily_sale - total_expenses + 100;
    const cash_in_hand = net_cash - upi;

    if (liquor_type === "country") {
      await query(
        `UPDATE shops SET monthly_mgq = monthly_mgq - $1, yearly_mgq = yearly_mgq - $1 WHERE shop_id = $2`,
        [stock_increment_cases, shop_id]
      );
    } else {
      const month = new Date().getMonth() + 1;
      let quarterField;
      if (month <= 3) quarterField = "mgq_q1";
      else if (month <= 6) quarterField = "mgq_q2";
      else if (month <= 9) quarterField = "mgq_q3";
      else quarterField = "mgq_q4";

      const totalValue = stock_increment_cases * duty;
      console.log("total", totalValue);

      await query(
        `UPDATE shops SET ${quarterField} = ${quarterField} - $1 WHERE shop_id = $2`,
        [totalValue, shop_id]
      );
    }

    const result = await query(
      `INSERT INTO sale_sheets (shop_id, liquor_type, brand_name, volume_ml, opening_balance, sale, stock_increment, mrp, daily_sale, closing_balance, expenses, upi, net_cash, canteen) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        shop_id,
        liquor_type,
        brand_name,
        volume_ml,
        opening_balance,
        sale,
        JSON.stringify(stock_increment),
        mrp_per_unit,
        daily_sale,
        opening_balance - sale + stock_increment_pcs,
        JSON.stringify(expenses),
        upi,
        net_cash,
        100,
      ]
    );

    // Balance Sheet Update - Shop
    const prevBalanceShopResult = await query(
      `SELECT balance FROM balance_sheets WHERE type = $1 ORDER BY id DESC LIMIT 1`,
      [shop_id]
    );
    const previousBalanceShop =
      prevBalanceShopResult.rows.length > 0
        ? Number(prevBalanceShopResult.rows[0]?.balance)
        : 0;

    const newBalanceShop = previousBalanceShop + net_cash;
    await query(
      `INSERT INTO balance_sheets (type, date, details, debit, credit, balance,sale_sheet_id) VALUES ($1, $2, $3, $4, $5, $6,$7)`,
      [
        shop_id,
        currentDate,
        "Net Cash",
        0,
        net_cash,
        newBalanceShop,
        result.rows[0].id,
      ]
    );

    // Balance Sheet Update - All
    const prevBalanceAllResult = await query(
      `SELECT balance FROM balance_sheets WHERE type = 'all' ORDER BY id DESC LIMIT 1`
    );
    const previousBalanceAll =
      prevBalanceAllResult.rows.length > 0
        ? Number(prevBalanceAllResult.rows[0]?.balance)
        : previousBalanceShop;

    const newBalanceAll = previousBalanceAll + net_cash;
    await query(
      `INSERT INTO balance_sheets (type, date, details, debit, credit, balance,sale_sheet_id) VALUES ($1, $2, $3, $4, $5, $6,$7)`,
      [
        "all",
        currentDate,
        "Net Cash",
        0,
        net_cash,
        newBalanceAll,
        result.rows[0].id,
      ]
    );

    // Warehouse Balance Updates
    if (stock_increment?.length > 0) {
      for (const item of stock_increment) {
        const { warehouse_name, cases } = item;
        const creditValue = cases * cost_price_per_case;

        const prevBalanceWarehouseResult = await query(
          `SELECT balance FROM warehouse_balance_sheets WHERE type = $1 ORDER BY date DESC, id DESC LIMIT 1`,
          [warehouse_name]
        );

        const previousBalanceWarehouse =
          Number(prevBalanceWarehouseResult.rows[0]?.balance) || 0;
        const newBalanceWarehouse = previousBalanceWarehouse + creditValue;

        await query(
          `INSERT INTO warehouse_balance_sheets (type, date, details, debit, credit, balance,sale_sheet_id)
           VALUES ($1, $2, $3, $4, $5, $6,$7)`,
          [
            warehouse_name,
            currentDate,
            `${warehouse_name}`,
            0,
            creditValue,
            newBalanceWarehouse,
            result.rows[0].id,
          ]
        );

        const prevBalanceAllWarehouseResult = await query(
          `SELECT balance FROM warehouse_balance_sheets WHERE type = 'all' ORDER BY date DESC, id DESC LIMIT 1`
        );

        const previousBalanceAllWarehouse =
          prevBalanceAllWarehouseResult.rows.length > 0
            ? Number(prevBalanceAllWarehouseResult.rows[0]?.balance)
            : previousBalanceWarehouse;

        const newBalanceAllWarehouse =
          previousBalanceAllWarehouse + creditValue;

        await query(
          `INSERT INTO warehouse_balance_sheets (type, date, details, debit, credit, balance,sale_sheet_id)
           VALUES ($1, $2, $3, $4, $5, $6,$7)`,
          [
            "all",
            currentDate,
            `${warehouse_name}`,
            0,
            creditValue,
            newBalanceAllWarehouse,
            result.rows[0].id,
          ]
        );
      }
    }

    res.json({
      success: true,
      message: "Sale sheet created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in createSaleSheet:", error);
  }
};

// update sale sheet
export const updateSaleSheet = async (req, res) => {
  const { id } = req.params;
  const {
    sale,
    stock_increment,
    expenses,
    brand_name,
    liquor_type,
    volume_ml,
    upi,
    opening_balance: rawOpeningBalance,
  } = req.body;

  const parseNumber = (val, fallback = 0) =>
    isNaN(Number(val)) ? fallback : Number(val);

  try {
    const existingSheetResult = await query(
      `SELECT * FROM sale_sheets WHERE id = $1`,
      [id]
    );
    if (existingSheetResult.rowCount === 0)
      return res.status(404).json({ message: "Sale sheet not found" });

    const existingSheet = existingSheetResult.rows[0];

    const updatedLiquorType = liquor_type ?? existingSheet.liquor_type;
    const updatedVolume = volume_ml ?? existingSheet.volume_ml;
    const updatedBrand = brand_name ?? existingSheet.brand_name;

    const brandData = await query(
      `SELECT mrp_per_unit, cost_price_per_case, duty, pieces_per_case FROM brands WHERE brand_name = $1 AND liquor_type = $2 AND volume_ml = $3`,
      [updatedBrand, updatedLiquorType, updatedVolume]
    );

    if (brandData.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Brand not found with given details" });
    }

    const { mrp_per_unit, cost_price_per_case, pieces_per_case } =
      brandData.rows[0];

    const validSale = parseNumber(sale, existingSheet.sale);
    const opening_balance = parseNumber(
      rawOpeningBalance,
      existingSheet.opening_balance
    );
    const parsedExpenses = Array.isArray(expenses)
      ? expenses.map((exp) => ({ ...exp, amount: parseNumber(exp.amount) }))
      : existingSheet.expenses;

    const total_expenses = parsedExpenses.reduce(
      (sum, e) => sum + parseNumber(e.amount),
      0
    );
    const parsedStock = Array.isArray(stock_increment)
      ? stock_increment.map((s) => ({ ...s, cases: parseNumber(s.cases) }))
      : existingSheet.stock_increment;

    const stockCases = parsedStock.reduce((sum, s) => sum + s.cases, 0);
    const stockIncrementPcs =
      updatedLiquorType === "country"
        ? stockCases * 45
        : stockCases * pieces_per_case;

    const daily_sale = validSale * mrp_per_unit;
    const net_cash = daily_sale - total_expenses + 100;
    const closing_balance = opening_balance - validSale + stockIncrementPcs;

    const result = await query(
      `UPDATE sale_sheets
       SET brand_name = $1, liquor_type = $2, volume_ml = $3, mrp = $4, sale = $5, stock_increment = $6,
           closing_balance = $7, expenses = $8, net_cash = $9, opening_balance = $10, daily_sale = $11, upi = $12
       WHERE id = $13 RETURNING *`,
      [
        updatedBrand,
        updatedLiquorType,
        updatedVolume,
        mrp_per_unit,
        validSale,
        JSON.stringify(parsedStock),
        closing_balance,
        JSON.stringify(parsedExpenses),
        net_cash,
        opening_balance,
        daily_sale,
        parseNumber(upi ?? existingSheet.upi),
        id,
      ]
    );

    const currentDate = new Date().toISOString().split("T")[0];

    // ================= SHOP BALANCE ======================
    const updateAndCascadeBalances = async (typeValue, shopId) => {
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

    await updateAndCascadeBalances(
      existingSheet.shop_id,
      existingSheet.shop_id
    );
    await updateAndCascadeBalances("all", existingSheet.shop_id);

    // ================ WAREHOUSE BALANCE ==================
    const updateAndCascadeWarehouse = async (
      typeValue,
      warehouseName,
      creditValue
    ) => {
      const current = await query(
        `SELECT id, balance, credit FROM warehouse_balance_sheets WHERE type = $1 AND sale_sheet_id = $2`,
        [typeValue, id]
      );

      if (current.rowCount > 0) {
        const prevCredit = parseNumber(current.rows[0].credit);
        const prevBalance = parseNumber(current.rows[0].balance);
        const newBalance = prevBalance - prevCredit + creditValue;

        await query(
          `UPDATE warehouse_balance_sheets SET date = $1, details = $2, debit = $3, credit = $4, balance = $5 WHERE id = $6`,
          [
            currentDate,
            warehouseName,
            0,
            creditValue,
            newBalance,
            current.rows[0].id,
          ]
        );

        // Cascade future rows
        const futureRows = await query(
          `SELECT id, credit, debit FROM warehouse_balance_sheets WHERE type = $1 AND sale_sheet_id > $2 ORDER BY sale_sheet_id ASC`,
          [typeValue, id]
        );

        let runningBalance = newBalance;
        for (const row of futureRows.rows) {
          runningBalance += parseNumber(row.credit) - parseNumber(row.debit);
          await query(
            `UPDATE warehouse_balance_sheets SET balance = $1 WHERE id = $2`,
            [runningBalance, row.id]
          );
        }
      }
    };

    for (const item of parsedStock) {
      const creditValue = item.cases * cost_price_per_case;
      await updateAndCascadeWarehouse(
        item.warehouse_name,
        item.warehouse_name,
        creditValue
      );
      await updateAndCascadeWarehouse("all", item.warehouse_name, creditValue);
    }

    res.json({
      message: "Sale sheet updated successfully with cascading balances",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error in updateSaleSheet:", err);
    res.status(500).json({ error: err.message });
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
