import express from 'express'
import { createShop, deleteShop, editShop, getAllExpensesOfShop, getAllShops, getLatestSaleSheet, getShopById } from '../controllers/shopController.js'

const app = express.Router()


app.post('/create', createShop)
app.delete('/:id', deleteShop)
app.get('/:shop_id', getShopById)
app.get('/', getAllShops)
app.get('/expenses/:shop_id', getAllExpensesOfShop)
app.get('/latest/:shop_id', getLatestSaleSheet)
app.patch('/:id', editShop)



export default app