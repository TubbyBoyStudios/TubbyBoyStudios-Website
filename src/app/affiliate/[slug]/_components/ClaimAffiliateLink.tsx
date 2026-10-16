"use client";

import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { api } from "~/trpc/react";

export const ClaimAffiliateLink = ({
	slug,
	authTicket,
}: {
	slug: string;
	authTicket?: string;
}) => {
	const claimLink = api.affiliateLink.claim.useMutation();

	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_42%,color-mix(in_oklab,var(--accent)_12%,transparent),transparent_25%)]" />
			<section className="relative w-full max-w-xl border-border border-y py-10 sm:py-14">
				<p className="text-(--studio-accent) text-xs uppercase tracking-[0.2em]">
					Tubby Boy Studios
				</p>
				<h1 className="mt-5 font-semibold text-4xl tracking-[-0.04em] sm:text-5xl">
					Claim your affiliate link
				</h1>
				<p className="mt-4 text-muted-foreground leading-7">
					Claim this link using the ticket included with your invitation.
				</p>
				<p className="mt-6 border-border border-l-2 pl-4 text-muted-foreground text-sm">
					Link code: <span className="font-medium text-foreground">{slug}</span>
				</p>

				{claimLink.isSuccess ? (
					<p className="mt-8 border-border border-t pt-6 text-lg">
						Your link has been claimed.
					</p>
				) : !authTicket ? (
					<p
						role="alert"
						className="mt-8 border-border border-t pt-6 text-muted-foreground"
					>
						This claim link is missing its ticket. This page should have been
						opened from within the game.
					</p>
				) : (
					<div className="mt-10 flex flex-col gap-6 border-border border-t pt-6">
						{claimLink.error && (
							<p role="alert" className="text-destructive text-sm">
								{claimLink.error.message}
							</p>
						)}
						<Button
							type="button"
							disabled={claimLink.isPending}
							className="self-start"
							onClick={() => {
								claimLink.mutate(
									{ affiliateLinkSlug: slug, authTicket },
									{
										onSuccess: () =>
											toast.add({ title: "Affiliate link claimed" }),
									},
								);
							}}
						>
							{claimLink.isPending ? "Claiming..." : "Claim link"}
						</Button>
					</div>
				)}
			</section>
		</main>
	);
};
