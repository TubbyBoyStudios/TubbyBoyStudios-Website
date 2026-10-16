import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AffiliateClaimStats } from "../_components/AffiliateClaimStats";

function toDateInputValue(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export default async function AffiliateClaimStatsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const { id } = await params;
	const endDate = new Date();
	const startDate = new Date(endDate);
	startDate.setUTCDate(startDate.getUTCDate() - 29);

	return (
		<AffiliateClaimStats
			affiliateLinkId={id}
			initialStartDate={toDateInputValue(startDate)}
			initialEndDate={toDateInputValue(endDate)}
		/>
	);
}
