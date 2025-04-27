import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
    connectionString:"postgresql://ems_snjl_user:owOat8AXiEVJb0yJc7vSD4OFx3dN8VXz@dpg-d071ruili9vc73erqdag-a.oregon-postgres.render.com/ems_snjl",
    ssl: {
        rejectUnauthorized: false
    }
})

pool.connect()
  .then(() => console.log("Connected to PostgreSQL Database"))
  .catch(err => console.error("Connection Error:", err));

// import pg from 'pg';
// const { Pool } = pg;

// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'snjl_local',
//   password: '7901sami', // 🛑 Replace with your actual password
//   port: 5432,
// });

// pool.connect()
//   .then(() => console.log("✅ Connected to Local PostgreSQL Database"))
//   .catch(err => console.error("❌ Local Connection Error:", err));

export const query = (text, params) => pool.query(text, params);
