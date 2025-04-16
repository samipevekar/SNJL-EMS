import { query } from "../db/db.js";

export const addBrand = async (req, res) => {
    const {
      brand_name,
      liquor_type,
      category,
      packaging_type,
      volume_ml,
      pieces_per_case,
      cost_price_per_case,
      mrp_per_unit,
      duty
    } = req.body;
  
    // Calculate mrp_per_case
    const mrp_per_case = mrp_per_unit * pieces_per_case;
  
    try {
      // Check if brand with same name, category, and volume already exists
      const existing = await query(
        `
        SELECT * FROM brands
        WHERE brand_name = $1 AND category = $2 AND volume_ml = $3
        `,
        [brand_name, category, volume_ml]
      );
  
      if (existing.rowCount > 0) {
        return res.status(400).json({ error: "Brand with same name, category, and volume already exists" });
      }
  
      // Insert brand
      const insert = await query(
        `
        INSERT INTO brands (
          brand_name,
          liquor_type,
          category,
          packaging_type,
          volume_ml,
          pieces_per_case,
          cost_price_per_case,
          mrp_per_unit,
          duty,
          mrp_per_case
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        `,
        [
          brand_name,
          liquor_type,
          category,
          packaging_type,
          volume_ml,
          pieces_per_case,
          cost_price_per_case,
          mrp_per_unit,
          duty,
          mrp_per_case
        ]
      );
  
      return res.status(201).json({ brand: insert.rows[0] });
  
    } catch (error) {
      console.error("Error in addBrand controller:", error);
      return res.status(500).json({ error: error.message });
    }
};
  

export const getBrands = async (req, res) => {
  try {
    const { type } = req.query;

    if (type) {
      const brands = await query(
        `
                SELECT brand_name FROM brands
                WHERE liquor_type = $1
            `,
        [type]
      );

      res.status(200).json(brands.rows);
    } else {
      const brands = await query(
        `
            SELECT brand_name,id FROM brands
            `
      );
      res.status(200).json(brands.rows);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in getBrands controller", error);
  }
};
