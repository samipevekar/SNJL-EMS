import { query } from "../db/db.js"

export const addExpense = async (req, res) => {
    const { user_id, amount, message, shop_id, liquor_type } = req.body;

    try {
        // Check if user exists
        const user = await query(`SELECT * FROM users WHERE id = $1`, [user_id]);

        if (user.rowCount === 0) {
            return res.status(404).json({success:false, error: "User not found" });
        }

        // Check if shop_id matches liquor_type
        if (shop_id) {
            const shop = await query(`SELECT liquor_type FROM shops WHERE shop_id = $1`, [shop_id]);

            if (shop.rowCount === 0) {
                return res.status(404).json({success:false,error: "Shop not found" });
            }

            if (shop.rows[0].liquor_type !== liquor_type) {
                return res.status(400).json({success:false,error: "Shop ID does not match liquor type" });
            }
        }

        // Insert expense record
        const expense = await query(
            `INSERT INTO manageral_expenses (user_id, amount, message, shop_id, liquor_type)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [user_id, amount, message, shop_id, liquor_type]
        );

        const currentDate = new Date().toISOString().split('T')[0];

        // Function to update balance
        const updateBalance = async (type) => {
            const prevBalanceResult = await query(
                `SELECT balance FROM balance_sheets 
                 WHERE type = $1 
                 ORDER BY date DESC, id DESC 
                 LIMIT 1`,
                [type]
            );

            const previousBalance = Number(prevBalanceResult.rows[0]?.balance) || 0;
            const newBalance = previousBalance - amount;

            await query(
                `INSERT INTO balance_sheets (type, date, details, debit, credit, balance)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [type, currentDate, `Expenses`, amount, 0, newBalance]
            );
        };

        // Update balance for shop_id if provided
        if (shop_id) {
            await updateBalance(shop_id);
        }

        // Always update 'all'
        await updateBalance("all");

        res.status(200).json({success:true, message: "Expense recorded successfully", data: expense.rows[0] });

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log("Error in addExpense controller:", error);
    }
};
