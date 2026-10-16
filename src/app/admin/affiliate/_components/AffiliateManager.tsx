"use client";

import { type AnyFieldApi, useForm } from "@tanstack/react-form";
import Link from "next/link";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { api } from "~/trpc/react";

export const AffiliateManager = () => {
	const affiliateLinks = api.affiliateLink.list.useQuery();
	const createLink = api.affiliateLink.create.useMutation();
	const utils = api.useUtils();
	const affiliateForm = useForm({
		defaultValues: {
			name: "",
			customSlug: "",
		},
		onSubmit: async ({ value }) => {
			const customSlug = value.customSlug.trim();
			await createLink.mutateAsync({
				name: value.name.trim(),
				...(customSlug ? { customSlug } : {}),
			});
			await utils.affiliateLink.list.invalidate();
			affiliateForm.reset();
			toast.add({ title: "Affiliate link created" });
		},
	});

	return (
		<main className="min-h-screen bg-background px-6 py-12 text-foreground lg:px-10">
			<div className="mx-auto max-w-6xl">
				<p className="text-(--studio-accent) text-xs uppercase tracking-[0.2em]">
					Tubby Boy Studios / Admin
				</p>
				<div className="mt-4 flex flex-wrap items-end justify-between gap-5">
					<h1 className="font-semibold text-5xl tracking-[-0.04em]">
						Affiliate links
					</h1>
					<Link
						href="/admin"
						className="border-border border-b px-1 py-2 text-xs uppercase tracking-[0.16em] transition-colors hover:text-(--studio-accent)"
					>
						Contact submissions
					</Link>
				</div>

				<section className="mt-12 border-border border-t py-8">
					<h2 className="font-semibold text-2xl tracking-[-0.03em]">
						Create a link
					</h2>
					<p className="mt-2 max-w-xl text-muted-foreground text-sm">
						Choose a name and optionally set a custom slug. Leave the slug blank
						to generate one automatically.
					</p>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							event.stopPropagation();
							affiliateForm.handleSubmit();
						}}
						className="mt-6 grid gap-6 sm:grid-cols-2"
					>
						<affiliateForm.Field
							name="name"
							validators={{
								onChange: z.string().trim().min(1, "Name is required"),
							}}
							// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
							children={(field) => (
								<div className="flex flex-col gap-2">
									<label
										htmlFor={field.name}
										className="text-muted-foreground text-xs uppercase tracking-[0.16em]"
									>
										Link name
									</label>
									<input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										required
										placeholder="LTT Fall 2026"
										className="border-input border-b bg-transparent px-0 py-3 text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-accent"
									/>
									<FieldInfo field={field} />
								</div>
							)}
						/>
						<affiliateForm.Field
							name="customSlug"
							validators={{ onChange: z.string() }}
							// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
							children={(field) => (
								<div className="flex flex-col gap-2">
									<label
										htmlFor={field.name}
										className="text-muted-foreground text-xs uppercase tracking-[0.16em]"
									>
										Custom slug <span className="normal-case">(optional)</span>
									</label>
									<input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="Leaving this blank will randomly generate a slug"
										className="border-input border-b bg-transparent px-0 py-3 text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-accent"
									/>
									<FieldInfo field={field} />
								</div>
							)}
						/>
						<div className="flex flex-col items-start gap-3 sm:col-span-2">
							<affiliateForm.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
								// biome-ignore lint/correctness/noChildrenProp: TanStack Form render prop
								children={([canSubmit, isSubmitting]) => (
									<Button
										type="submit"
										disabled={!canSubmit || createLink.isPending}
									>
										{isSubmitting || createLink.isPending
											? "Creating..."
											: "Create link"}
									</Button>
								)}
							/>
							{createLink.error && (
								<p role="alert" className="text-destructive text-sm">
									{createLink.error.message}
								</p>
							)}
						</div>
					</form>
				</section>

				<section className="border-border border-t pt-8">
					<div className="flex items-end justify-between gap-4">
						<div>
							<p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
								Recent
							</p>
							<h2 className="mt-2 font-semibold text-2xl tracking-[-0.03em]">
								Link activity
							</h2>
						</div>
						<span className="text-muted-foreground text-xs">Latest 20</span>
					</div>
					<div className="mt-6 overflow-x-auto border-border border-t">
						{affiliateLinks.isLoading ? (
							<p className="flex justify-center gap-3 py-10 text-muted-foreground">
								Loading links <Spinner />
							</p>
						) : affiliateLinks.error ? (
							<p role="alert" className="py-10 text-muted-foreground">
								{affiliateLinks.error.message}
							</p>
						) : affiliateLinks.data?.length ? (
							<table className="w-full min-w-180 text-left text-sm">
								<thead className="border-border border-b text-muted-foreground text-xs uppercase tracking-[0.14em]">
									<tr>
										<th className="px-4 py-4">Name</th>
										<th className="px-4 py-4">Slug</th>
										<th className="px-4 py-4">Claims</th>
										<th className="px-4 py-4">Created by</th>
										<th className="px-4 py-4">Created</th>
										<th className="px-4 py-4">Details</th>
									</tr>
								</thead>
								<tbody>
									{affiliateLinks.data.map((link) => (
										<tr
											key={link.id}
											className="border-border/60 border-b align-top"
										>
											<td className="px-4 py-4 font-medium">{link.name}</td>
											<td className="px-4 py-4">
												<Link
													href={`/affiliate/${encodeURIComponent(link.slug)}`}
													target="_blank"
													rel="noreferrer"
													className="text-(--studio-accent) underline underline-offset-4"
												>
													{link.slug}
												</Link>
											</td>
											<td className="px-4 py-4">{link.claimed}</td>
											<td className="px-4 py-4 text-muted-foreground">
												{link.createdBy}
											</td>
											<td className="px-4 py-4 text-muted-foreground">
												{link.createdAt.toLocaleString()}
											</td>
											<td className="px-4 py-4">
												<Link
													href={`/admin/affiliate/${link.id}`}
													className="text-(--studio-accent) underline underline-offset-4"
												>
													View claims
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						) : (
							<p className="py-10 text-muted-foreground">
								No affiliate links yet.
							</p>
						)}
					</div>
				</section>
			</div>
		</main>
	);
};

function FieldInfo({ field }: { field: AnyFieldApi }) {
	return field.state.meta.isTouched && !field.state.meta.isValid ? (
		<p className="text-destructive text-sm">
			{field.state.meta.errors.map((error) => error.message).join(", ")}
		</p>
	) : null;
}
