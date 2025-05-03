import { query } from "../db/db.js"

export const getWarehouses = async (req,res) =>{
    try {
        const warehouses = await query(`
            SELECT * FROM warehouses
        `)
    
        res.status(200).json(warehouses.rows)
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log("Error in getWarehouses:", error.message);
    }
}