import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
    connectionString:"postgresql://snjl_liquors_user:t84LyziEDIDyU8scj3cEF29ZMqopT9iV@dpg-cv44esbqf0us73b5fuv0-a.oregon-postgres.render.com/snjl_liquors",
    ssl:{
        rejectUnauthorized:false
    }
})

pool.connect()
  .then(() => console.log("Connected to PostgreSQL Database"))
  .catch(err => console.error("Connection Error:", err));


export const query = (text, params) => pool.query(text,params)



