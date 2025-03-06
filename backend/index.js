import express from 'express'
import { query } from './db/db.js';

const app = express()

app.use(express.json())

query("SELECT NOW()")
  .then(res => console.log("Database Time:", res.rows[0]))
  .catch(err => console.error("Query Error:", err));

app.post('/register',async(req,res)=>{
    const {name,email}=req.body
    const user = await query(`
        INSERT INTO users (name, email)
        VALUES($1,$2) RETURNING *
    `,[name, email])

    res.status(200).json(user.rows[0])
})

app.listen(4000,()=>{
    console.log('server is running on port 4000')
})