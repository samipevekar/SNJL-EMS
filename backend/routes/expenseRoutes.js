import express from 'express'
import { addExpense } from '../controllers/expenseController.js'

const app = express.Router()


app.post('/', addExpense)




export default app