import { Pool } from 'pg';
export const pool=process.env.DATABASE_URL?new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:false}:undefined}):null;
export async function initDatabase(){if(!pool)return;const fs=await import('fs/promises');const path=await import('path');const sql=await fs.readFile(path.join(process.cwd(),'src/db/schema.sql'),'utf8');await pool.query(sql);}
