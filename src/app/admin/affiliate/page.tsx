import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AffiliateManager } from "./_components/AffiliateManager";

export default async function AffiliateAdminPage() {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	return <AffiliateManager />;
}
