import { query } from "../db/db.js";

export const addIndent = async (req, res) => {
  try {
      const { shop_id, brand } = req.body;

      // Check if brand data is an array
      if (!Array.isArray(brand) || brand.length === 0) {
          return res.status(400).json({ error: "Brand data must be a non-empty array" });
      }

      // Check if shop exists
      const shop = await query(
          `SELECT shop_name, liquor_type FROM shops WHERE shop_id = $1`,
          [shop_id]
      );

      if (shop.rowCount === 0) {
          return res.status(404).json({ success: false, error: "Shop not found" });
      }

      if (shop.rows[0].liquor_type === "country") {
          return res.status(400).json({ success: false, error: "Country liquor cannot be indented" });
      }

      // Fetch brand details for each item in the brand array
      const brandDetailsPromises = brand.map(async (b) => {
          const brandInfo = await query(
              `SELECT cost_price_per_case, duty 
               FROM brands 
               WHERE brand_name = $1 AND volume_ml = $2`,
              [b.brand_name, b.volume_ml]
          );

          if (brandInfo.rowCount === 0) {
              throw new Error(`Brand ${b.brand_name} with volume ${b.volume_ml}ml not found`);
          }

          return {
              ...b,
              cost_price: brandInfo.rows[0].cost_price_per_case * b.cases,
              duty: brandInfo.rows[0].duty * b.cases
          };
      });

      // Wait for all brand details to be fetched
      const brandDetails = await Promise.all(brandDetailsPromises);

      // Calculate total values
      let total_cases = 0;
      let total_duty = 0;
      let total_cost_price = 0;

      brandDetails.forEach((b) => {
          total_cases += b.cases || 0;
          total_duty += b.duty || 0;
          total_cost_price += b.cost_price || 0;
      });

      // Insert data into indent_information table
      const result = await query(
          `INSERT INTO indent_information 
          (shop_id, shop_name, brand, total_cases, total_duty, total_cost_price)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
              shop_id,
              shop.rows[0].shop_name,
              JSON.stringify(brandDetails),
              total_cases,
              total_duty,
              total_cost_price
          ]
      );

      res.status(201).json({ message: "Indent added successfully", data: result.rows[0] });
  } catch (err) {
      console.error("Error adding indent information:", err);
      res.status(500).json({ 
          success: false, 
          error: err.message || "Internal Server Error" 
      });
  }
};
  

export const getIndent = async(req,res)=>{
  let indents = await query(`
    select * from indent_information
    `)

    res.status(200).json(indents.rows)
}