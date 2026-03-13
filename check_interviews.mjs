import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const lines = readFileSync('.env.local', 'utf8').split('\n');
const dbUrl = lines.find(l => l.startsWith('DATABASE_URL='))?.slice('DATABASE_URL='.length);
const sql = neon(dbUrl);

const rows = await sql`SELECT id, title, role, level, type, domain, specialization, tags, questions, created_at FROM interviews ORDER BY created_at DESC LIMIT 5`;
console.log(JSON.stringify(rows, null, 2));
