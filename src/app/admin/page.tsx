import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EntryList } from "./_components/EntryList";

export default async function AdminPage() {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	return <EntryList />;
}
