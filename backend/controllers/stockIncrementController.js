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
  } = req.body;

  try {
    const currentDate = new Date().toISOString().split("T")[0];

    // Get shop details
    const shop = await query(`SELECT * FROM shops WHERE shop_id = $1`, [shop_id]);
    if (shop.rowCount === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const liquor_type = shop.rows[0].liquor_type;

    // Get brand details
    const brandData = await query(
      `SELECT cost_price_per_case, duty, pieces_per_case FROM brands 
       WHERE brand_name = $1 AND liquor_type = $2 AND volume_ml = $3`,
      [brand_name, liquor_type, volume_ml]
    );

    if (brandData.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Brand not found with given volume or liquor type",
      });
    }

    const { cost_price_per_case, duty, pieces_per_case } = brandData.rows[0];
    const pieces = cases * pieces_per_case;

    // Always create new stock_increment
    const result = await query(
      `INSERT INTO stock_increments 
       (shop_id, bill_id, brand_name, volume_ml, warehouse_name, cases, pieces)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [shop_id, bill_id, brand_name, volume_ml, warehouse_name, cases, pieces]
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

      // Update only the latest sale sheet
      await query(
        `UPDATE sale_sheets 
         SET closing_balance = closing_balance + $1 
         WHERE id = $2`,
        [pieces, latestId]
      );
    }

    // Update MGQ
    if (liquor_type === "country") {
      await query(
        `UPDATE shops 
         SET monthly_mgq = monthly_mgq - $1, yearly_mgq = yearly_mgq - $1 
         WHERE shop_id = $2`,
        [cases, shop_id]
      );
    } else {
      const month = new Date().getMonth() + 1;
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

    // Warehouse balance update
    const creditValue = cases * cost_price_per_case;

    const prevBalanceWarehouseResult = await query(
      `SELECT balance FROM warehouse_balance_sheets 
       WHERE type = $1 ORDER BY date DESC, id DESC LIMIT 1`,
      [warehouse_name]
    );

    const previousBalanceWarehouse =
      Number(prevBalanceWarehouseResult.rows[0]?.balance) || 0;
    const newBalanceWarehouse = previousBalanceWarehouse + creditValue;

    await query(
      `INSERT INTO warehouse_balance_sheets 
       (type, date, details, debit, credit, balance,stock_increment_id)
       VALUES ($1, $2, $3, $4, $5, $6,$7)`,
      [
        warehouse_name,
        currentDate,
        `Stock added to shop ${shop_id}`,
        0,
        creditValue,
        newBalanceWarehouse,
        stockIncrementId
      ]
    );

    const prevBalanceAllWarehouseResult = await query(
      `SELECT balance FROM warehouse_balance_sheets 
       WHERE type = 'all' ORDER BY date DESC, id DESC LIMIT 1`
    );

    const previousBalanceAllWarehouse =
      Number(prevBalanceAllWarehouseResult.rows[0]?.balance) || 0;
    const newBalanceAllWarehouse = previousBalanceAllWarehouse + creditValue;

    await query(
      `INSERT INTO warehouse_balance_sheets 
       (type, date, details, debit, credit, balance,stock_increment_id)
       VALUES ($1, $2, $3, $4, $5, $6,$7)`,
      [
        "all",
        currentDate,
        `Stock added to shop ${shop_id}`,
        0,
        creditValue,
        newBalanceAllWarehouse,
        stockIncrementId
      ]
    );

    res.json({
      success: true,
      message: "Stock increment added successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in addStockIncrement:", error);
  }
};

// update stock increment
export const updateStockIncrement = async (req, res) => {
  const { id } = req.params;
  const {
    shop_id,
    bill_id,
    brand_name,
    volume_ml,
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
      return res.status(404).json({ message: "Stock increment not found" });
    }

    const oldRecord = existingIncrement.rows[0];
    const oldCases = oldRecord.cases;
    const oldPieces = oldRecord.pieces;
    const oldWarehouse = oldRecord.warehouse_name;

    // 2. Get shop and brand details
    const shop = await query(`SELECT * FROM shops WHERE shop_id = $1`, [shop_id]);
    if (shop.rowCount === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const liquor_type = shop.rows[0].liquor_type;

    const brandData = await query(
      `SELECT cost_price_per_case, duty, pieces_per_case FROM brands 
       WHERE brand_name = $1 AND liquor_type = $2 AND volume_ml = $3`,
      [brand_name, liquor_type, volume_ml]
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

    // 3. Update the stock_increments record
    const updatedIncrement = await query(
      `UPDATE stock_increments 
       SET shop_id = $1, bill_id = $2, brand_name = $3, volume_ml = $4, 
           warehouse_name = $5, cases = $6, pieces = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [shop_id, bill_id, brand_name, volume_ml, warehouse_name, newCases, newPieces, id]
    );

    // 4. Update sale_sheets closing balance
    const latestSaleSheet = await query(
      `SELECT id, closing_balance FROM sale_sheets 
       WHERE shop_id = $1 AND brand_name = $2 AND volume_ml = $3 
       ORDER BY sale_date DESC, created_at DESC LIMIT 1`,
      [shop_id, brand_name, volume_ml]
    );

    if (latestSaleSheet.rowCount > 0) {
      await query(
        `UPDATE sale_sheets 
         SET closing_balance = closing_balance + $1 
         WHERE id = $2`,
        [piecesDifference, latestSaleSheet.rows[0].id]
      );
    }

    // 5. Handle MGQ updates
    const casesDifference = newCases - oldCases;
    if (casesDifference !== 0) {
      if (liquor_type === "country") {
        await query(
          `UPDATE shops 
           SET monthly_mgq = monthly_mgq - $1, yearly_mgq = yearly_mgq - $1 
           WHERE shop_id = $2`,
          [casesDifference, shop_id]
        );
      } else {
        const month = new Date().getMonth() + 1;
        let quarterField = "mgq_q1";
        if (month <= 3) quarterField = "mgq_q1";
        else if (month <= 6) quarterField = "mgq_q2";
        else if (month <= 9) quarterField = "mgq_q3";
        else quarterField = "mgq_q4";

        const valueDifference = casesDifference * duty;
        await query(
          `UPDATE shops 
           SET ${quarterField} = ${quarterField} - $1 
           WHERE shop_id = $2`,
          [valueDifference, shop_id]
        );
      }
    }

    // 6. Update warehouse balances
    const oldCreditValue = oldCases * cost_price_per_case;
    const newCreditValue = newCases * cost_price_per_case;
    const creditDifference = newCreditValue - oldCreditValue;

    // First find and update existing warehouse balance entries for this stock increment
    const existingWarehouseEntries = await query(
      `SELECT id, type FROM warehouse_balance_sheets 
       WHERE stock_increment_id = $1`,
      [id]
    );

    // Update existing entries or create new ones
    for (const entry of existingWarehouseEntries.rows) {
      if (entry.type === 'all') {
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

    // If no existing entries found (shouldn't happen but just in case)
    if (existingWarehouseEntries.rowCount === 0) {
      // For warehouse-specific entry
      const prevWarehouseBalance = await query(
        `SELECT balance FROM warehouse_balance_sheets 
         WHERE type = $1 ORDER BY date DESC, id DESC LIMIT 1`,
        [warehouse_name]
      );
      const warehouseBalance = Number(prevWarehouseBalance.rows[0]?.balance) || 0;
      
      await query(
        `INSERT INTO warehouse_balance_sheets 
         (type, date, details, debit, credit, balance, stock_increment_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          warehouse_name,
          currentDate,
          `Stock updated for shop ${shop_id}`,
          0,
          newCreditValue,
          warehouseBalance + newCreditValue,
          id
        ]
      );

      // For 'all' entry
      const prevAllBalance = await query(
        `SELECT balance FROM warehouse_balance_sheets 
         WHERE type = 'all' ORDER BY date DESC, id DESC LIMIT 1`
      );
      const allBalance = Number(prevAllBalance.rows[0]?.balance) || 0;
      
      await query(
        `INSERT INTO warehouse_balance_sheets 
         (type, date, details, debit, credit, balance, stock_increment_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          "all",
          currentDate,
          `Stock updated for shop ${shop_id}`,
          0,
          newCreditValue,
          allBalance + newCreditValue,
          id
        ]
      );
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


export const getStockIncrementBrands = async (req, res) => {
    const { shop_id } = req.params;
  
    if (!shop_id) {
      return res.status(400).json({ success: false, message: "shop_id is required" });
    }

    const shop = await query(
        `
        SELECT * FROM shops 
        WHERE shop_id = $1
        `,
        [shop_id]
    )

    if(shop.rowCount == 0){
        return res.status(404).json({ success: false, message: "Shop not found"})
    }

    try {
      const result = await query(
        `SELECT DISTINCT brand_name, volume_ml
         FROM stock_increments
         WHERE shop_id = $1
         ORDER BY brand_name, volume_ml`,
        [shop_id]
      );
  
      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error("Error in getStockIncrementBrands:", error);
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  };
  