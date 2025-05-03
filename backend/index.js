import express from 'express';
import { query } from './db/db.js';
import saleSheetRoutes from './routes/saleSheetRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import wStockRoutes from './routes/wStockRoutes.js';
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import indentRoutes from './routes/indentformationRoutes.js';
import attedanceRoutes from './routes/attendanceRoutes.js';
import balanceSheetRoutes from './routes/balanceSheetRoutes.js';
import stockIncrementRoutes from './routes/stockIncrementRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js'
import cron from 'node-cron'
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));

const port = process.env.PORT || 4000;

query("SELECT NOW()")
  .then(res => console.log("Database Time:", res.rows[0]))
  .catch(err => console.error("Query Error:", err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use("/api/sale-sheet", saleSheetRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/w-stock", wStockRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/indent", indentRoutes);
app.use("/api/attendance", attedanceRoutes);
app.use("/api/balance-sheet", balanceSheetRoutes);
app.use("/api/stock-increment", stockIncrementRoutes);
app.use("/api/warehouse", warehouseRoutes)

cron.schedule('*/4 * * * *', async () => {
  try {
      const response = await axios.get(`${ 'https://snjl-ems.onrender.com' || `http://localhost:${port}`}/`, {
          family: 4  // Force IPv4
      });
      console.log('Pinged the server:', response.data);
  } catch (error) {
      console.error('Error pinging the server:', error.message);
  }
});


app.listen(port, () => {
  console.log("Server running locally on port 4000");
});
