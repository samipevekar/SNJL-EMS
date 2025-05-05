import { query } from "../db/db.js";

export const addBrand = async (req, res) => {
  let {
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

  // Set defaults based on liquor_type
  if (liquor_type === 'country') {
    category = category || 'country';
    packaging_type = packaging_type || 'Can';
    volume_ml = volume_ml || 200;
    pieces_per_case = pieces_per_case || 48;
    cost_price_per_case = cost_price_per_case || 2886.99;
    mrp_per_unit = mrp_per_unit || 75.00;
    duty = duty || 0.00;
  }

  // Validate required fields
  if (!brand_name || !liquor_type) {
    return res.status(400).json({ error: "Brand name and liquor type are required" });
  }

  // Calculate derived fields
  const mrp_per_case = mrp_per_unit * pieces_per_case;
  const profit = mrp_per_case - cost_price_per_case;

  try {
    // Check if brand with same name, category, and volume already exists
    const existing = await query(
      `SELECT * FROM brands 
       WHERE brand_name = $1 AND category = $2 AND volume_ml = $3`,
      [brand_name, category, volume_ml]
    );

    if (existing.rowCount > 0) {
      return res.status(400).json({ 
        error: "Brand with same name, category, and volume already exists" 
      });
    }

    // Insert brand
    const insert = await query(
      `INSERT INTO brands (
        brand_name, liquor_type, category, packaging_type, 
        volume_ml, pieces_per_case, cost_price_per_case, 
        mrp_per_unit, duty, mrp_per_case, profit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        brand_name, liquor_type, category, packaging_type,
        volume_ml, pieces_per_case, cost_price_per_case,
        mrp_per_unit, duty, mrp_per_case, profit
      ]
    );

    return res.status(201).json({ brand: insert.rows[0] });

  } catch (error) {
    console.error("Error in addBrand controller:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const editBrand = async (req, res) => {
  const { id } = req.params;
  let {
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

  try {
    // Get existing brand data
    const existingBrand = await query(
      `SELECT * FROM brands WHERE id = $1`,
      [id]
    );

    if (existingBrand.rowCount === 0) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const currentData = existingBrand.rows[0];

    // Apply updates, keeping existing values if not provided
    brand_name = brand_name || currentData.brand_name;
    liquor_type = liquor_type || currentData.liquor_type;
    
    // For country liquor, apply defaults if not provided
    if (liquor_type === 'country') {
      category = category || currentData.category || 'country';
      packaging_type = packaging_type || currentData.packaging_type || 'Can';
      volume_ml = volume_ml || currentData.volume_ml || 200;
      pieces_per_case = pieces_per_case || currentData.pieces_per_case || 48;
      cost_price_per_case = cost_price_per_case || currentData.cost_price_per_case || 2886.99;
      mrp_per_unit = mrp_per_unit || currentData.mrp_per_unit || 75.00;
      duty = duty || currentData.duty || 0.00;
    } else {
      // For foreign liquor, just keep existing values if not provided
      category = category || currentData.category;
      packaging_type = packaging_type || currentData.packaging_type;
      volume_ml = volume_ml || currentData.volume_ml;
      pieces_per_case = pieces_per_case || currentData.pieces_per_case;
      cost_price_per_case = cost_price_per_case || currentData.cost_price_per_case;
      mrp_per_unit = mrp_per_unit || currentData.mrp_per_unit;
      duty = duty || currentData.duty;
    }

    // Calculate derived fields
    const mrp_per_case = mrp_per_unit * pieces_per_case;
    const profit = mrp_per_case - cost_price_per_case;

    // Check for duplicate brand (excluding current brand)
    const duplicateCheck = await query(
      `SELECT * FROM brands 
       WHERE brand_name = $1 AND category = $2 AND volume_ml = $3 AND id != $4`,
      [brand_name, category, volume_ml, id]
    );

    if (duplicateCheck.rowCount > 0) {
      return res.status(400).json({ 
        error: "Another brand with same name, category, and volume already exists" 
      });
    }

    // Update brand
    const update = await query(
      `UPDATE brands SET
        brand_name = $1,
        liquor_type = $2,
        category = $3,
        packaging_type = $4,
        volume_ml = $5,
        pieces_per_case = $6,
        cost_price_per_case = $7,
        mrp_per_unit = $8,
        duty = $9,
        mrp_per_case = $10,
        profit = $11
      WHERE id = $12
      RETURNING *`,
      [
        brand_name, liquor_type, category, packaging_type,
        volume_ml, pieces_per_case, cost_price_per_case,
        mrp_per_unit, duty, mrp_per_case, profit, id
      ]
    );

    return res.status(200).json({ brand: update.rows[0] });

  } catch (error) {
    console.error("Error in editBrand controller:", error);
    return res.status(500).json({ error: error.message });
  }
};
  

export const getBrands = async (req, res) => {
  try {
    const { type } = req.query;

    if (type) {
      const brands = await query(
        `
        SELECT * FROM brands
        WHERE liquor_type = $1
        ORDER BY brand_name ASC
        `,
        [type]
      );

      res.status(200).json(brands.rows);
    } else {
      const brands = await query(
        `
        SELECT * FROM brands
        ORDER BY brand_name ASC
        `
      );
      res.status(200).json(brands.rows);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in getBrands controller", error);
  }
};


export const getSpecificBrand = async (req,res) => {
  const {id} = req.params
  try {
    const brand = await query(
      `
      SELECT * FROM brands
      WHERE id = $1
      `,
      [id]
    )

    if(brand.rowCount === 0){
      return res.status(404).json({success:false,error:'Brand not found'})
    }

    res.status(200).json({success:true,data:brand.rows[0]})
    
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in getBrands controller", error);
  }
}