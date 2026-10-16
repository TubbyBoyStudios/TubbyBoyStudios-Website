"use client";

import Link from "next/link";
import { Spinner } from "~/components/ui/spinner";
import { api } from "~/trpc/react";

export const EntryList = () => {
	"use client";
	const entryList = api.contactEntry.list.useQuery();

	if (entryList.isLoading) {
		return (
			<Wrapper>
				<p className="flex justify-center gap-4 py-10 text-muted-foreground">
					Loading... <Spinner />
				</p>
			</Wrapper>
		);
	}

	if (entryList.error) {
		return (
			<Wrapper>
				<p className="py-10 text-muted-foreground">{entryList.error.message}</p>
			</Wrapper>
		);
	}

	return (
		<Wrapper>
			<table className="w-full min-w-170 text-left text-sm">
				<thead className="border-border border-b text-muted-foreground text-xs uppercase tracking-[0.16em]">
					<tr>
						<th className="px-4 py-4">Name</th>
						<th className="px-4 py-4">Email</th>
						<th className="px-4 py-4">Message</th>
						<th className="px-4 py-4">Received</th>
					</tr>
				</thead>
				<tbody>
					{entryList.data?.map((row) => (
						<tr key={row.id} className="border-border/60 border-b align-top">
							<td className="px-4 py-4 font-medium">{row.name}</td>
							<td className="px-4 py-4">{row.email}</td>
							<td className="max-w-md px-4 py-4 text-muted-foreground">
								{row.message}
							</td>
							<td className="px-4 py-4 text-muted-foreground">
								{row.createdAt.toLocaleString()}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{!entryList.data && (
				<p className="py-10 text-muted-foreground">
					No contact submissions yet.
				</p>
			)}
		</Wrapper>
	);
};

const Wrapper = (props: { children: React.ReactNode }) => (
	<main className="min-h-screen bg-background px-6 py-12 text-foreground lg:px-10">
		<div className="mx-auto max-w-6xl">
			<p className="text-(--studio-accent) text-xs uppercase tracking-[0.2em]">
				Tubby Boy Studios
			</p>
			<div className="mt-4 flex flex-wrap items-end justify-between gap-5">
				<h1 className="font-semibold text-5xl tracking-[-0.04em]">
					Contact submissions
				</h1>
				<Link
					href="/admin/affiliate"
					className="border-border border-b px-1 py-2 text-xs uppercase tracking-[0.16em] transition-colors hover:text-(--studio-accent)"
				>
					Affiliate links
				</Link>
			</div>
			<div className="mt-12 overflow-x-auto border-border border-t">
				{props.children}
			</div>
		</div>
	</main>
);
