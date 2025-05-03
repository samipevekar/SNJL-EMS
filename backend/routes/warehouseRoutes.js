import express from 'express'
import { getWarehouses } from '../controllers/warehouseController.js'

const app = express.Router()


app.get('/', getWarehouses)



export default app