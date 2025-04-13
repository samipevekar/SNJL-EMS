import express from 'express'
import { query } from './db/db.js';
import saleSheetRoutes from './routes/saleSheetRoutes.js'
import shopRoutes from './routes/shopRoutes.js'
import wStockRoutes from './routes/wStockRoutes.js'
import userRoutes from './routes/userRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import brandRoutes from './routes/brandRoutes.js'
import indentRoutes from './routes/indentformationRoutes.js'
import attedanceRoutes from './routes/attendanceRoutes.js'
import balanceSheetRoutes from './routes/balanceSheetRoutes.js'
import dotenv from 'dotenv'
dotenv.config()

const app = express()

app.use(express.json({limit:'10mb'}))


query("SELECT NOW()")
  .then(res => console.log("Database Time:", res.rows[0]))
  .catch(err => console.error("Query Error:", err));


app.use("/api/sale-sheet",saleSheetRoutes)
app.use("/api/shop", shopRoutes)
app.use("/api/w-stock", wStockRoutes)
app.use("/api/user", userRoutes)
app.use("/api/payment", paymentRoutes)
app.use("/api/expense", expenseRoutes)
app.use("/api/brand", brandRoutes)
app.use("/api/indent", indentRoutes)
app.use("/api/attendance", attedanceRoutes)
app.use("/api/balance-sheet", balanceSheetRoutes)

app.listen(4000,()=>{
    console.log('server is running on port 4000')
})