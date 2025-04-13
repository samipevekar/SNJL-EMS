import express from 'express'
import { createShop, deleteShop, getAllExpensesOfShop, getAllShops, getLatestSaleSheet } from '../controllers/shopController.js'

const app = express.Router()


app.post('/create', createShop)
app.delete('/:id', deleteShop)
app.get('/', getAllShops)
app.get('/expenses/:shop_id', getAllExpensesOfShop)
app.get('/latest/:shop_id', getLatestSaleSheet)



export default app