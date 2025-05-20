import { query } from "../db/db.js";

// add stock increment 
export const addStockIncrement = async (req, res) => {
  const {
    shop_id,
    bill_id,
    brand_name,
    volume_ml,
    warehouse_name,
    cases,
    stock_date,
    w_stock = false  // Default to false if not provided
  } = req.body;

  console.log(req.body);

  try {
    await query('BEGIN');

    // Use stock_date from request if provided, otherwise use current date
    const currentDate = stock_date || new Date().toISOString().split("T")[0];
    const createdAt = stock_date ? new Date(stock_date) : new Date();

    // Get shop details
    const shop = await query(`SELECT * FROM shops WHERE shop_id = $1`, [shop_id]);
    if (shop.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: "Shop not found" });
    }

    const liquor_type = shop.rows[0].liquor_type;

    // Get brand details
    const brandData = await query(
      `SELECT cost_price_per_case, duty, pieces_per_case FROM brands 
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

    const { cost_price_per_case, duty, pieces_per_case } = brandData.rows[0];
    const pieces = cases * pieces_per_case;

    // Create new stock_increment with w_stock flag
    const result = await query(
      `INSERT INTO stock_increments 
       (shop_id, bill_id, brand_name, volume_ml, warehouse_name, cases, pieces, created_at, updated_at, w_stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        shop_id,
        bill_id,
        brand_name,
        volume_ml,
        warehouse_name,
        cases,
        pieces,
        createdAt,
        createdAt,
        w_stock
      ]
    );

    const stockIncrementId = result.rows[0].id;

    // Find the latest sale sheet for this shop, brand, and volume
    const latestSaleSheet = await query(
      `SELECT id FROM sale_sheets 
       WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 
       ORDER BY sale_date DESC, id DESC LIMIT 1`,
      [shop_id, brand_name, volume_ml]
    );

    if (latestSaleSheet.rowCount > 0) {
      const latestId = latestSaleSheet.rows[0].id;

      // Update only the latest sale sheet with w_stock flag
      await query(
        `UPDATE sale_sheets 
         SET closing_balance = closing_balance + $1, w_stock = $2
         WHERE id = $3`,
        [pieces, w_stock, latestId]
      );
    }

    // Only update MGQ if w_stock is false
    if (!w_stock) {
      const dateForMgq = stock_date ? new Date(stock_date) : new Date();
      const month = dateForMgq.getMonth() + 1;

      if (liquor_type === "country") {
        await query(
          `UPDATE shops 
           SET monthly_mgq = monthly_mgq - $1, yearly_mgq = yearly_mgq - $1 
           WHERE shop_id = $2`,
          [cases, shop_id]
        );
      } else {
        let quarterField = "mgq_q1";
        if (month <= 3) quarterField = "mgq_q1";
        else if (month <= 6) quarterField = "mgq_q2";
        else if (month <= 9) quarterField = "mgq_q3";
        else quarterField = "mgq_q4";

        const totalValue = cases * duty;

        await query(
          `UPDATE shops 
           SET ${quarterField} = ${quarterField} - $1 
           WHERE shop_id = $2`,
          [totalValue, shop_id]
        );
      }
    }

    // Warehouse balance update
    const creditValue = cases * cost_price_per_case;

    // Determine which warehouse types to update based on w_stock flag
    const warehouseTypes = w_stock ? ['all', 'w_stock'] : ['all', warehouse_name];

    for (const type of warehouseTypes) {
      // Get previous balance for this type just before our current date
      const prevBalanceResult = await query(
        `SELECT balance FROM warehouse_balance_sheets 
         WHERE type = $1 AND date <= $2 
         ORDER BY date DESC, id DESC LIMIT 1`,
        [type, currentDate]
      );

      const previousBalance = prevBalanceResult.rows.length > 0
        ? Number(prevBalanceResult.rows[0].balance)
        : 0;

      const newBalance = previousBalance + creditValue;

      // Insert the new warehouse balance sheet entry
      await query(
        `INSERT INTO warehouse_balance_sheets 
         (type, date, details, debit, credit, balance, stock_increment_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          type,
          currentDate,
          `Stock added to shop ${shop_id}`,
          0,
          creditValue,
          newBalance,
          stockIncrementId,
        ]
      );

      // If this is a backdated entry, update all subsequent balance entries
      if (stock_date) {
        // Get all balance entries after our current date
        const subsequentBalances = await query(
          `SELECT id, credit, balance FROM warehouse_balance_sheets 
           WHERE type = $1 AND date > $2 
           ORDER BY date ASC, id ASC`,
          [type, currentDate]
        );

        // Update each subsequent balance entry
        let runningBalance = newBalance;
        for (const balanceEntry of subsequentBalances.rows) {
          runningBalance += Number(balanceEntry.credit);
          
          await query(
            `UPDATE warehouse_balance_sheets 
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
      message: "Stock increment added successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await query('ROLLBACK');
    res.status(500).json({ error: error.message });
    console.log("Error in addStockIncrement:", error);
  }
};

// update stock increment 
export const updateStockIncrement = async (req, res) => {
  const { id } = req.params;
  const {
    shop_id: newShopId,
    bill_id,
    brand_name: newBrandName,
    volume_ml: newVolumeMl,
    warehouse_name,
    cases: newCases,
  } = req.body;

  try {
    const currentDate = new Date().toISOString().split("T")[0];

    // 1. Get the existing stock increment record
    const existingIncrement = await query(
      `SELECT * FROM stock_increments WHERE id = $1`,
      [id]
    );
    if (existingIncrement.rowCount === 0) {
      return res.status(404).json({ error: "Stock increment not found" });
    }

    const oldRecord = existingIncrement.rows[0];
    const oldCases = oldRecord.cases;
    const oldPieces = oldRecord.pieces;
    const oldWarehouse = oldRecord.warehouse_name;
    const oldShopId = oldRecord.shop_id;
    const oldBrandName = oldRecord.brand_name;
    const oldVolumeMl = oldRecord.volume_ml;
    const oldStockDate = oldRecord.stock_date;

    // Check if any of the identifying fields have changed
    const shopChanged = oldShopId !== newShopId;
    const brandChanged = oldBrandName !== newBrandName;
    const volumeChanged = oldVolumeMl !== newVolumeMl;
    const anyIdentifierChanged = shopChanged || brandChanged || volumeChanged;

    // 2. Get shop and brand details for the NEW values
    const shop = await query(`SELECT * FROM shops WHERE shop_id = $1`, [
      newShopId,
    ]);
    if (shop.rowCount === 0) {
      return res.status(404).json({ error: "Shop not found" });
    }

    const liquor_type = shop.rows[0].liquor_type;

    const brandData = await query(
      `SELECT cost_price_per_case, duty, pieces_per_case FROM brands 
       WHERE brand_name = $1 AND liquor_type = $2 AND volume_ml = $3`,
      [newBrandName, liquor_type, newVolumeMl]
    );

    if (brandData.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Brand not found with given volume or liquor type",
      });
    }

    const { cost_price_per_case, duty, pieces_per_case } = brandData.rows[0];
    const newPieces = newCases * pieces_per_case;
    const piecesDifference = newPieces - oldPieces;

    // 3. Check if sales exist for the old stock that would be affected
    if (anyIdentifierChanged) {
      const salesExist = await query(
        `SELECT 1 FROM sale_sheets 
         WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3
         AND sale_date >= $4
         LIMIT 1`,
        [oldShopId, oldBrandName, oldVolumeMl, oldStockDate]
      );

      if (salesExist.rowCount > 0) {
        return res.status(400).json({
          success: false,
          error:
            "Cannot change brand/shop/volume as sales already exist for this stock increment",
        });
      }
    }

    // 4. Check if we have enough stock to decrement when changing brands
    if (brandChanged || volumeChanged) {
      const latestSaleSheet = await query(
        `SELECT closing_balance FROM sale_sheets 
         WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3
         ORDER BY sale_date DESC, created_at DESC LIMIT 1`,
        [oldShopId, oldBrandName, oldVolumeMl]
      );

      if (latestSaleSheet.rowCount > 0) {
        const currentBalance = latestSaleSheet.rows[0].closing_balance;
        if (currentBalance < oldPieces) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock to change brand. Current balance: ${currentBalance}, trying to remove: ${oldPieces}`,
          });
        }
      }
    }

    // 5. Update the stock_increments record (always update the same record)
    const updatedIncrement = await query(
      `UPDATE stock_increments 
       SET shop_id = $1, bill_id = $2, brand_name = $3, volume_ml = $4, 
           warehouse_name = $5, cases = $6, pieces = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [
        newShopId,
        bill_id,
        newBrandName,
        newVolumeMl,
        warehouse_name,
        newCases,
        newPieces,
        id,
      ]
    );

    // 6. Handle sale_sheets updates
    if (anyIdentifierChanged) {
      // If brand or volume changed, we need to adjust the closing balances
      
      // First, find the old sale sheet record
      const oldSaleSheet = await query(
        `SELECT id, closing_balance FROM sale_sheets 
         WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 
         ORDER BY sale_date DESC, created_at DESC LIMIT 1`,
        [oldShopId, oldBrandName, oldVolumeMl]
      );

      if (oldSaleSheet.rowCount > 0) {
        // Reduce the old record's closing balance
        await query(
          `UPDATE sale_sheets 
           SET closing_balance = closing_balance - $1 
           WHERE id = $2`,
          [oldPieces, oldSaleSheet.rows[0].id]
        );
      }

      // Then find the new sale sheet record (must exist - we don't create new ones)
      const newSaleSheet = await query(
        `SELECT id, closing_balance FROM sale_sheets 
         WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 
         ORDER BY sale_date DESC, created_at DESC LIMIT 1`,
        [newShopId, newBrandName, newVolumeMl]
      );

      if (newSaleSheet.rowCount > 0) {
        // Update existing sale sheet record
        await query(
          `UPDATE sale_sheets 
           SET closing_balance = closing_balance + $1 
           WHERE id = $2`,
          [newPieces, newSaleSheet.rows[0].id]
        );
      } 
    } else {
      // Only cases changed, update normally
      const latestSaleSheet = await query(
        `SELECT id, closing_balance FROM sale_sheets 
         WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 
         ORDER BY sale_date DESC, created_at DESC LIMIT 1`,
        [newShopId, newBrandName, newVolumeMl]
      );

      if (latestSaleSheet.rowCount > 0) {
        await query(
          `UPDATE sale_sheets 
           SET closing_balance = closing_balance + $1 
           WHERE id = $2`,
          [piecesDifference, latestSaleSheet.rows[0].id]
        );
      }
    }

    // 7. Handle MGQ updates (same as before)
    const casesDifference = newCases - oldCases;
    if (casesDifference !== 0) {
      if (liquor_type === "country") {
        await query(
          `UPDATE shops 
           SET monthly_mgq = monthly_mgq - $1, yearly_mgq = yearly_mgq - $1 
           WHERE shop_id = $2`,
          [oldCases, oldShopId]
        );
        await query(
          `UPDATE shops 
           SET monthly_mgq = monthly_mgq + $1, yearly_mgq = yearly_mgq + $1 
           WHERE shop_id = $2`,
          [newCases, newShopId]
        );
      } else {
        const month = new Date().getMonth() + 1;
        let quarterField = "mgq_q1";
        if (month <= 3) quarterField = "mgq_q1";
        else if (month <= 6) quarterField = "mgq_q2";
        else if (month <= 9) quarterField = "mgq_q3";
        else quarterField = "mgq_q4";

        const oldBrandData = await query(
          `SELECT duty FROM brands 
           WHERE brand_name = $1 AND liquor_type = $2 AND volume_ml = $3`,
          [oldBrandName, liquor_type, oldVolumeMl]
        );

        const oldDuty = oldBrandData.rowCount > 0 ? oldBrandData.rows[0].duty : 0;
        const oldValue = oldCases * oldDuty;
        const newValue = newCases * duty;

        await query(
          `UPDATE shops 
           SET ${quarterField} = ${quarterField} - $1 
           WHERE shop_id = $2`,
          [oldValue, oldShopId]
        );
        await query(
          `UPDATE shops 
           SET ${quarterField} = ${quarterField} + $1 
           WHERE shop_id = $2`,
          [newValue, newShopId]
        );
      }
    }

    // 8. Update warehouse balances (same as before)
    const oldBrandDataForWarehouse = await query(
      `SELECT cost_price_per_case FROM brands 
       WHERE brand_name = $1 AND liquor_type = $2 AND volume_ml = $3`,
      [oldBrandName, liquor_type, oldVolumeMl]
    );

    const oldCostPrice = oldBrandDataForWarehouse.rowCount > 0
      ? oldBrandDataForWarehouse.rows[0].cost_price_per_case
      : 0;

    const oldCreditValue = oldCases * oldCostPrice;
    const newCreditValue = newCases * cost_price_per_case;

    const existingWarehouseEntries = await query(
      `SELECT id, type FROM warehouse_balance_sheets 
       WHERE stock_increment_id = $1`,
      [id]
    );

    for (const entry of existingWarehouseEntries.rows) {
      if (entry.type === "all") {
        await query(
          `UPDATE warehouse_balance_sheets 
           SET credit = $1, balance = balance - $2 + $1 
           WHERE id = $3`,
          [newCreditValue, oldCreditValue, entry.id]
        );
      } else {
        await query(
          `UPDATE warehouse_balance_sheets 
           SET type = $1, credit = $2, balance = balance - $3 + $2 
           WHERE id = $4`,
          [warehouse_name, newCreditValue, oldCreditValue, entry.id]
        );
      }
    }

    res.json({
      success: true,
      message: "Stock increment updated successfully",
      data: updatedIncrement.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in updateStockIncrement:", error);
  }
};


// delete stock increment
export const deleteStockIncrement = async (req, res) => {
  const { id: stock_increment_id } = req.params;

  if (!stock_increment_id) {
    return res.status(400).json({ error: "Stock increment ID is required" });
  }

  try {
    await query('BEGIN');

    // Get the stock increment details
    const stockIncrementResult = await query(
      `SELECT 
        id, 
        shop_id, 
        bill_id, 
        brand_name, 
        volume_ml, 
        warehouse_name, 
        cases, 
        pieces,
        created_at
       FROM stock_increments 
       WHERE id = $1`,
      [stock_increment_id]
    );

    if (stockIncrementResult.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: "Stock increment not found" });
    }

    const stockIncrement = stockIncrementResult.rows[0];
    const {
      shop_id,
      brand_name,
      volume_ml,
      warehouse_name,
      cases,
      pieces,
      created_at
    } = stockIncrement;

    // Get shop details
    const shopResult = await query(
      `SELECT liquor_type FROM shops WHERE shop_id = $1`,
      [shop_id]
    );

    if (shopResult.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: "Shop not found" });
    }

    const liquor_type = shopResult.rows[0].liquor_type;

    // Get brand details for cost price and duty
    const brandData = await query(
      `SELECT cost_price_per_case, duty FROM brands 
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

    const { cost_price_per_case, duty } = brandData.rows[0];
    const creditValue = cases * cost_price_per_case;

    // Revert MGQ updates
    const stockDate = new Date(created_at);
    const month = stockDate.getMonth() + 1;

    if (liquor_type === "country") {
      await query(
        `UPDATE shops 
         SET monthly_mgq = monthly_mgq + $1, yearly_mgq = yearly_mgq + $1 
         WHERE shop_id = $2`,
        [cases, shop_id]
      );
    } else {
      let quarterField = "mgq_q1";
      if (month <= 3) quarterField = "mgq_q1";
      else if (month <= 6) quarterField = "mgq_q2";
      else if (month <= 9) quarterField = "mgq_q3";
      else quarterField = "mgq_q4";

      const totalValue = cases * duty;

      await query(
        `UPDATE shops 
         SET ${quarterField} = ${quarterField} + $1 
         WHERE shop_id = $2`,
        [totalValue, shop_id]
      );
    }

    // Get all sale sheets that reference this stock increment
    const saleSheetsToDelete = await query(
      `SELECT id FROM sale_sheets WHERE stock_increment_id = $1`,
      [stock_increment_id]
    );

    const saleSheetIds = saleSheetsToDelete.rows.map(row => row.id);

    // Delete balance sheets that reference these sale sheets
    if (saleSheetIds.length > 0) {
      await query(
        `DELETE FROM balance_sheets WHERE sale_sheet_id IN (${saleSheetIds.map((_, i) => `$${i + 1}`).join(',')})`,
        saleSheetIds
      );
    }

    // Delete sale sheets that reference this stock increment
    await query(
      `DELETE FROM sale_sheets WHERE stock_increment_id = $1`,
      [stock_increment_id]
    );

    // Update the latest sale sheet's closing balance (decrement by pieces)
    const latestSaleSheet = await query(
      `SELECT id, closing_balance FROM sale_sheets 
       WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 
       ORDER BY sale_date DESC, id DESC LIMIT 1`,
      [shop_id, brand_name, volume_ml]
    );

    if (latestSaleSheet.rowCount > 0) {
      const latestId = latestSaleSheet.rows[0].id;
      const currentClosingBalance = latestSaleSheet.rows[0].closing_balance;

      await query(
        `UPDATE sale_sheets 
         SET closing_balance = $1 
         WHERE id = $2`,
        [currentClosingBalance - pieces, latestId]
      );
    }

    // Delete warehouse balance entries
    await query(
      `DELETE FROM warehouse_balance_sheets 
       WHERE stock_increment_id = $1`,
      [stock_increment_id]
    );

    // Recalculate warehouse balances for the specific warehouse
    const warehouseBalances = await query(
      `SELECT * FROM warehouse_balance_sheets 
       WHERE type = $1 AND date >= $2
       ORDER BY date, id`,
      [warehouse_name, created_at]
    );

    let runningBalance = 0;
    
    // Find the previous balance before our deleted entry
    const prevBalanceResult = await query(
      `SELECT balance FROM warehouse_balance_sheets 
       WHERE type = $1 AND date < $2 
       ORDER BY date DESC, id DESC LIMIT 1`,
      [warehouse_name, created_at]
    );
    
    if (prevBalanceResult.rowCount > 0) {
      runningBalance = Number(prevBalanceResult.rows[0].balance);
    }

    // Recalculate all subsequent balances for this warehouse
    for (const entry of warehouseBalances.rows) {
      runningBalance = runningBalance + Number(entry.credit) - Number(entry.debit);
      
      await query(
        `UPDATE warehouse_balance_sheets 
         SET balance = $1 
         WHERE id = $2`,
        [runningBalance, entry.id]
      );
    }

    // Recalculate warehouse balances for 'all' warehouse type
    const allWarehouseBalances = await query(
      `SELECT * FROM warehouse_balance_sheets 
       WHERE type = 'all' AND date >= $1
       ORDER BY date, id`,
      [created_at]
    );

    let runningBalanceAll = 0;
    
    // Find the previous balance before our deleted entry for 'all'
    const prevBalanceAllResult = await query(
      `SELECT balance FROM warehouse_balance_sheets 
       WHERE type = 'all' AND date < $1 
       ORDER BY date DESC, id DESC LIMIT 1`,
      [created_at]
    );
    
    if (prevBalanceAllResult.rowCount > 0) {
      runningBalanceAll = Number(prevBalanceAllResult.rows[0].balance);
    }

    // Recalculate all subsequent balances for 'all' warehouse type
    for (const entry of allWarehouseBalances.rows) {
      runningBalanceAll = runningBalanceAll + Number(entry.credit) - Number(entry.debit);
      
      await query(
        `UPDATE warehouse_balance_sheets 
         SET balance = $1 
         WHERE id = $2`,
        [runningBalanceAll, entry.id]
      );
    }

    // Finally, delete the stock increment record
    await query(
      `DELETE FROM stock_increments WHERE id = $1`,
      [stock_increment_id]
    );

    await query('COMMIT');

    res.json({
      success: true,
      message: "Stock increment and all related sale sheets and balance sheets deleted successfully",
    });
  } catch (error) {
    await query('ROLLBACK');
    res.status(500).json({ error: error.message });
    console.log("Error in deleteStockIncrement:", error);
  } 
};

export const getStockIncrementBrands = async (req, res) => {
  const { shop_id } = req.params;

  if (!shop_id) {
    return res
      .status(400)
      .json({ success: false, error: "shop_id is required" });
  }

  const shop = await query(
    `
        SELECT * FROM shops 
        WHERE shop_id = $1
        `,
    [shop_id]
  );

  if (shop.rowCount == 0) {
    return res.status(404).json({ success: false, error: "Shop not found" });
  }

  try {
    const result = await query(
      `SELECT si.brand_name, si.volume_ml, si.*
FROM stock_increments si
JOIN (
  SELECT brand_name, volume_ml, MAX(id) AS max_id
  FROM stock_increments
  WHERE shop_id = $1
  GROUP BY brand_name, volume_ml
) latest ON 
  si.brand_name = latest.brand_name AND 
  si.volume_ml = latest.volume_ml AND 
  si.id = latest.max_id
WHERE si.shop_id = $1
ORDER BY si.brand_name, si.volume_ml;
`,
      [shop_id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error in getStockIncrementBrands:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


// transfer stock
export const transferStock = async (req, res) => {
  const { from_shop_id, to_shop_id, brand_name, volume_ml, cases } = req.body;

  // Validate required fields
  if (!from_shop_id || !to_shop_id || !brand_name || !volume_ml || cases === undefined) {
    return res.status(400).json({ 
      success: false,
      error: "from_shop_id, to_shop_id, brand_name, volume_ml, and cases are required" 
    });
  }

  if (from_shop_id === to_shop_id) {
    return res.status(400).json({ 
      success: false,
      error: "Cannot transfer stock to the same shop" 
    });
  }

  if (cases <= 0) {
    return res.status(400).json({ 
      success: false,
      error: "Cases must be a positive number" 
    });
  }

  try {
    await query('BEGIN');

    // Get brand details to convert cases to pieces
    const brandData = await query(
      `SELECT pieces_per_case, liquor_type 
       FROM brands 
       WHERE brand_name = $1 AND volume_ml = $2`,
      [brand_name, volume_ml]
    );

    if (brandData.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: "Brand not found with given name and volume" 
      });
    }

    const { pieces_per_case, liquor_type } = brandData.rows[0];
    const transferPieces = cases * pieces_per_case;

    // Check if from_shop has enough stock
    const fromShopLatestSheet = await query(
      `SELECT id, closing_balance 
       FROM sale_sheets 
       WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 
       ORDER BY created_at DESC LIMIT 1`,
      [from_shop_id, brand_name, volume_ml]
    );

    if (fromShopLatestSheet.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: `Source shop ${from_shop_id} has no stock records for ${brand_name} (${volume_ml}ml)` 
      });
    }

    const fromShopClosingBalance = fromShopLatestSheet.rows[0].closing_balance;
    const fromShopSheetId = fromShopLatestSheet.rows[0].id;

    if (fromShopClosingBalance < transferPieces) {
      await query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: `Insufficient stock. Available: ${fromShopClosingBalance}, Required: ${transferPieces}` 
      });
    }

    // Check if to_shop has any existing records for this brand
    const toShopLatestSheet = await query(
      `SELECT id, closing_balance 
       FROM sale_sheets 
       WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 
       ORDER BY created_at DESC LIMIT 1`,
      [to_shop_id, brand_name, volume_ml]
    );

    if (toShopLatestSheet.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: `Destination shop ${to_shop_id} has no existing records for ${brand_name} (${volume_ml}ml). Please create a sale sheet first.` 
      });
    }

    const toShopClosingBalance = toShopLatestSheet.rows[0].closing_balance;
    const toShopSheetId = toShopLatestSheet.rows[0].id;

    // Update from_shop's closing balance (decrement)
    await query(
      `UPDATE sale_sheets 
       SET closing_balance = closing_balance - $1 
       WHERE id = $2`,
      [transferPieces, fromShopSheetId]
    );

    // Update to_shop's closing balance (increment)
    await query(
      `UPDATE sale_sheets 
       SET closing_balance = closing_balance + $1 
       WHERE id = $2`,
      [transferPieces, toShopSheetId]
    );

    console.log(fromShopSheetId, toShopSheetId)

    // Create a transfer record
    // const transferResult = await query(
    //   `INSERT INTO stock_transfers 
    //    (from_shop_id, to_shop_id, brand_name, volume_ml, cases, pieces, liquor_type, transfer_date) 
    //    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE) 
    //    RETURNING *`,
    //   [from_shop_id, to_shop_id, brand_name, volume_ml, cases, transferPieces, liquor_type]
    // );

    await query('COMMIT');

    res.json({
      success: true,
      message: "Stock transferred successfully",
      data: {
        // transfer: transferResult.rows[0],
        from_shop_new_balance: fromShopClosingBalance - transferPieces,
        to_shop_new_balance: toShopClosingBalance + transferPieces
      }
    });

  } catch (error) {
    await query('ROLLBACK');
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
    console.error("Error in transferStock:", error);
  }
};