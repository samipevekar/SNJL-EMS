// import pg from 'pg'
// const { Pool } = pg

// const pool = new Pool({
//     connectionString:"postgresql://snjl_liquors_user:t84LyziEDIDyU8scj3cEF29ZMqopT9iV@dpg-cv44esbqf0us73b5fuv0-a.oregon-postgres.render.com/snjl_liquors",
//     ssl: {
//         rejectUnauthorized: false
//     }
// })

// pool.connect()
//   .then(() => console.log("Connected to PostgreSQL Database"))
//   .catch(err => console.error("Connection Error:", err));

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'snjl_local',
  password: '7901sami', // 🛑 Replace with your actual password
  port: 5432,
});

pool.connect()
  .then(() => console.log("✅ Connected to Local PostgreSQL Database"))
  .catch(err => console.error("❌ Local Connection Error:", err));

export const query = (text, params) => pool.query(text, params);
