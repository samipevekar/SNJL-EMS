import express from 'express'
import { addWStock, deleteWStock, updateWStock } from '../controllers/wStockController.js'

const app = express.Router()


app.post('/', addWStock)
app.delete('/:id', deleteWStock)
app.patch('/:id', updateWStock)



export default app