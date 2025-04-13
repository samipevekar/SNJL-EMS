import { query } from "../db/db.js";

// Add w_stock
export const addWStock = async (req, res) => {
  const { shop_id, bill_id, warehouse_name, brand, cases } = req.body;

  try {
    // check shop_id is valid or not
    const shop = await query(
      `
        SELECT * FROM shops
        WHERE shop_id = $1
        `,
      [shop_id]
    );

    if (shop.rowCount === 0) {
      return res.status(404).json({ message: "shop_id is invalid" });
    }

    const w_stock = await query(
      `
        INSERT INTO w_stock (shop_id, bill_id, warehouse_name, brand, cases)
        VALUES($1,$2,$3,$4,$5) RETURNING *
        `,
      [shop_id, bill_id, warehouse_name, brand, cases]
    );

    res.status(200).json({ message: "w_stock added", data: w_stock.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in AddWStock:", error.message);
  }
};

// delete w-stock
export const deleteWStock = async (req, res) => {
  const { id } = req.params;
  try {
    // check if the w-stock exists
    const w_stock = await query(
      `
        SELECT * FROM w_stock
        WHERE id = $1
        `,
      [id]
    );
    if (w_stock.rowCount === 0) {
      return res.status(404).json({ message: "w_stock not found" });
    }

    // delete the w-stock
    await query(
      `
        DELETE FROM w_stock
        WHERE id = $1
        `,
      [id]
    );
    res.status(200).json({ message: "w_stock deleted" });
  } catch(error) {
    res.status(500).json({ error: error.message });
    console.log("Error in deleteWStock:", error.message);
  }
};

// update w-stock
export const updateWStock = async (req, res) => {
    const { id } = req.params;
    let { shop_id, bill_id, warehouse_name, brand, cases } = req.body;
    try {
      // Check if the w_stock exists
      const w_stock = await query(
        `SELECT * FROM w_stock WHERE id = $1`,
        [id]
      );
  
      if (w_stock.rowCount === 0) {
        return res.status(404).json({ message: "w_stock not found" });
      }
  
      // Get previous values from the database
      let w_stock_val = w_stock.rows[0];
  
      shop_id = shop_id ?? w_stock_val.shop_id;
      bill_id = bill_id ?? w_stock_val.bill_id;
      warehouse_name = warehouse_name ?? w_stock_val.warehouse_name;
      brand = brand ?? w_stock_val.brand;
      cases = cases ?? w_stock_val.cases;
  
      // Update the w_stock
      const updatedWStock = await query(
        `
        UPDATE w_stock
        SET shop_id = $1, bill_id = $2, warehouse_name = $3, brand = $4, cases = $5
        WHERE id = $6 RETURNING *
        `,
        [shop_id, bill_id, warehouse_name, brand, cases, id]
      );
  
      res.status(200).json({ message: "w_stock updated", data: updatedWStock.rows[0] });
    } catch (error) {
      res.status(500).json({ error: error.message });
      console.log("Error in updateWStock:", error.message);
    }
  };
  