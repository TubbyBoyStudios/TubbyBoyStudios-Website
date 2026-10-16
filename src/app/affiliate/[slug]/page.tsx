import { ClaimAffiliateLink } from "./_components/ClaimAffiliateLink";

export default async function AffiliateClaimPage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ authTicket?: string | string[] }>;
}) {
	const [{ slug }, query] = await Promise.all([params, searchParams]);
	const authTicket =
		typeof query.authTicket === "string" ? query.authTicket : undefined;

	return <ClaimAffiliateLink slug={slug} authTicket={authTicket} />;
}
