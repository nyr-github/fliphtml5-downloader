import { neon } from "@neondatabase/serverless";
// import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// const sql = neon(process.env.DATABASE_URL!);
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });
