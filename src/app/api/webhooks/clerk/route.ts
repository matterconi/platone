import { headers } from "next/headers";
import { Webhook } from "svix";
import { createUser, updateUser, deleteUser } from "@/lib/userSync";

type ClerkUserPayload = {
	id: string;
	first_name: string | null;
	last_name: string | null;
	email_addresses: { email_address: string }[];
};

export async function POST(request: Request) {
	const secret = process.env.CLERK_WEBHOOK_SECRET;
	if (!secret) {
		return Response.json({ error: "Missing webhook secret" }, { status: 500 });
	}

	const headersList = await headers();
	const svixId = headersList.get("svix-id");
	const svixTimestamp = headersList.get("svix-timestamp");
	const svixSignature = headersList.get("svix-signature");

	if (!svixId || !svixTimestamp || !svixSignature) {
		return Response.json({ error: "Missing svix headers" }, { status: 400 });
	}

	const body = await request.text();
	const wh = new Webhook(secret);

	let event: { type: string; data: ClerkUserPayload };
	try {
		event = wh.verify(body, {
			"svix-id": svixId,
			"svix-timestamp": svixTimestamp,
			"svix-signature": svixSignature,
		}) as typeof event;
	} catch {
		return Response.json({ error: "Invalid signature" }, { status: 400 });
	}

	const { type, data } = event;
	const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "User";
	const email = data.email_addresses?.[0]?.email_address ?? "";

	if (type === "user.created") await createUser(data.id, name, email);
	if (type === "user.updated") await updateUser(data.id, name, email);
	if (type === "user.deleted") await deleteUser(data.id);

	return Response.json({ success: true }, { status: 200 });
}
