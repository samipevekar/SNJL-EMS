import express from 'express'
import { getAttendanceByShop, markAttendance } from '../controllers/attendanceController.js'

const app = express.Router()


app.post('/', markAttendance)
app.get('/:shop_id', getAttendanceByShop)





export default app