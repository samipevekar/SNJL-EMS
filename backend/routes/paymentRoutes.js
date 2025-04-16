import express from 'express'
import { addPayment, updatePayment } from '../controllers/paymentController.js'

const app = express.Router()


app.post('/', addPayment)
app.patch('/:id', updatePayment)




export default app