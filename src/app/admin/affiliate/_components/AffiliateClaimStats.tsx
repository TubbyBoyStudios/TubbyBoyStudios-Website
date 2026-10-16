"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { api } from "~/trpc/react";

export function AffiliateClaimStats({
	affiliateLinkId,
	initialStartDate,
	initialEndDate,
}: {
	affiliateLinkId: string;
	initialStartDate: string;
	initialEndDate: string;
}) {
	const [startDate, setStartDate] = useState(initialStartDate);
	const [endDate, setEndDate] = useState(initialEndDate);
	const [appliedRange, setAppliedRange] = useState({
		startDate: initialStartDate,
		endDate: initialEndDate,
	});
	const claimStats = api.affiliateLink.claimStats.useQuery({
		affiliateLinkId,
		...appliedRange,
	});

	return (
		<main className="min-h-screen bg-background px-6 py-12 text-foreground lg:px-10">
			<div className="mx-auto max-w-6xl">
				<p className="text-(--studio-accent) text-xs uppercase tracking-[0.2em]">
					Tubby Boy Studios / Admin
				</p>
				<div className="mt-4 flex flex-wrap items-end justify-between gap-5">
					<div>
						<h1 className="font-semibold text-5xl tracking-[-0.04em]">
							{claimStats.data?.affiliateLink.name ?? "Affiliate link claims"}
						</h1>
						{claimStats.data && (
							<p className="mt-3 text-muted-foreground">
								Link code: {claimStats.data.affiliateLink.slug}
							</p>
						)}
					</div>
					<Link
						href="/admin/affiliate"
						className="border-border border-b px-1 py-2 text-xs uppercase tracking-[0.16em] transition-colors hover:text-(--studio-accent)"
					>
						Back to affiliate links
					</Link>
				</div>

				<section className="mt-12 border-border border-y py-8">
					<h2 className="font-semibold text-2xl tracking-[-0.03em]">
						Claims by date range
					</h2>
					<form
						className="mt-6 flex flex-wrap items-end gap-5"
						onSubmit={(event) => {
							event.preventDefault();
							setAppliedRange({ startDate, endDate });
						}}
					>
						<div className="flex min-w-48 flex-col gap-2">
							<label
								htmlFor="claim-start-date"
								className="text-muted-foreground text-xs uppercase tracking-[0.16em]"
							>
								Start date
							</label>
							<Input
								id="claim-start-date"
								type="date"
								value={startDate}
								max={endDate}
								required
								onChange={(event) => setStartDate(event.target.value)}
							/>
						</div>
						<div className="flex min-w-48 flex-col gap-2">
							<label
								htmlFor="claim-end-date"
								className="text-muted-foreground text-xs uppercase tracking-[0.16em]"
							>
								End date
							</label>
							<Input
								id="claim-end-date"
								type="date"
								value={endDate}
								min={startDate}
								required
								onChange={(event) => setEndDate(event.target.value)}
							/>
						</div>
						<Button type="submit">Apply range</Button>
					</form>
					<div className="mt-10 border-border border-t pt-8">
						{claimStats.isLoading ? (
							<p className="flex items-center gap-3 text-muted-foreground">
								Loading claims <Spinner />
							</p>
						) : claimStats.error ? (
							<p role="alert" className="text-destructive">
								{claimStats.error.message}
							</p>
						) : claimStats.data ? (
							<>
								<p className="text-muted-foreground text-sm">
									Claims from {appliedRange.startDate} through{" "}
									{appliedRange.endDate}
								</p>
								<p className="mt-2 font-semibold text-2xl tracking-[-0.03em]">
									Total claims: {claimStats.data.claimed}
								</p>
								<div className="mt-6 overflow-x-auto border-border border-t">
									{claimStats.data.claims.length > 0 ? (
										<table className="w-full min-w-120 text-left text-sm">
											<thead className="border-border border-b text-muted-foreground text-xs uppercase tracking-[0.14em]">
												<tr>
													<th className="px-4 py-4">Steam user ID</th>
													<th className="px-4 py-4">Claimed at</th>
												</tr>
											</thead>
											<tbody>
												{claimStats.data.claims.map((claim) => (
													<tr
														key={claim.id}
														className="border-border/60 border-b"
													>
														<td className="px-4 py-4">
															<a
																href={`https://steamcommunity.com/profiles/${encodeURIComponent(claim.steamUserId)}`}
																target="_blank"
																rel="noreferrer"
																className="text-(--studio-accent) underline underline-offset-4"
															>
																{claim.steamUserId}
															</a>
														</td>
														<td className="px-4 py-4 text-muted-foreground">
															{claim.createdAt.toLocaleString()}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									) : (
										<p className="py-10 text-muted-foreground">
											No claims in this date range.
										</p>
									)}
								</div>
							</>
						) : null}
					</div>
				</section>
			</div>
		</main>
	);
}
