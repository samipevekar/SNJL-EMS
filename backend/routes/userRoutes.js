import express from 'express'
import { editUser, getMe, loginUser, registerUser } from '../controllers/userController.js'
import { checkAuth } from '../middleware/authMiddleware.js'

const app = express.Router()


app.post('/signup', checkAuth, registerUser)
app.post('/login', loginUser)
app.get('/me',checkAuth, getMe)
app.patch('/edit/:userId',checkAuth, editUser)



export default app