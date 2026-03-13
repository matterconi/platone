import sql from "@/lib/db";

export async function createUser(id: string, name: string, email: string) {
  await sql`
    INSERT INTO users (id, name, email)
    VALUES (${id}, ${name}, ${email})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function updateUser(id: string, name: string, email: string) {
  await sql`
    UPDATE users SET name = ${name}, email = ${email}
    WHERE id = ${id}
  `;
}

export async function deleteUser(id: string) {
  await sql`DELETE FROM users WHERE id = ${id}`;
}
