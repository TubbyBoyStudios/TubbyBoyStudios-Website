"use client";

import { type AnyFieldApi, useForm } from "@tanstack/react-form";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { api } from "~/trpc/react";

export const ContactForm = () => {
	const createEntry = api.contactEntry.create.useMutation();
	const contactForm = useForm({
		defaultValues: {
			name: "",
			email: "",
			message: "",
		},
		onSubmit: async ({ value }) => {
			await createEntry.mutateAsync(value);
			toast.add({
				title: "Message sent",
			});
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				contactForm.handleSubmit();
			}}
			className="flex flex-col gap-8 border-border border-t pt-6"
		>
			<contactForm.Field
				name="name"
				validators={{
					onChange: z.string(),
					onChangeAsyncDebounceMs: 500,
				}}
				// biome-ignore lint/correctness/noChildrenProp: <This is just how TanStack Form works>
				children={(field) => (
					<>
						<label
							htmlFor={field.name}
							className="flex flex-col gap-3 text-muted-foreground text-xs uppercase tracking-[0.18em]"
						>
							Name
						</label>
						<input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							required
							placeholder="Your name"
							className="border-input border-b bg-transparent px-0 py-3 text-foreground text-lg tracking-normal outline-none placeholder:text-muted-foreground/50 focus:border-accent"
						/>
						<FieldInfo field={field} />
					</>
				)}
			/>

			<contactForm.Field
				name="email"
				validators={{
					onChange: z.string().email(),
					onChangeAsyncDebounceMs: 500,
				}}
				// biome-ignore lint/correctness/noChildrenProp: <This is just how TanStack Form works>
				children={(field) => (
					<>
						<label
							htmlFor={field.name}
							className="flex flex-col gap-3 text-muted-foreground text-xs uppercase tracking-[0.18em]"
						>
							Email
						</label>
						<input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							required
							className="border-input border-b bg-transparent px-0 py-3 text-foreground text-lg tracking-normal outline-none placeholder:text-muted-foreground/50 focus:border-accent"
							placeholder="you@email.com"
						/>
						<FieldInfo field={field} />
					</>
				)}
			/>

			<contactForm.Field
				name="message"
				validators={{
					onChange: z.string(),
					onChangeAsyncDebounceMs: 500,
				}}
				// biome-ignore lint/correctness/noChildrenProp: <This is just how TanStack Form works>
				children={(field) => (
					<>
						<label
							htmlFor={field.name}
							className="flex flex-col gap-3 text-muted-foreground text-xs uppercase tracking-[0.18em]"
						>
							Message
						</label>
						<textarea
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							required
							rows={4}
							className="resize-none border-input border-b bg-transparent px-0 py-3 text-foreground text-lg tracking-normal outline-none placeholder:text-muted-foreground/50 focus:border-accent"
							placeholder="Tell us about it..."
						/>
						<FieldInfo field={field} />
					</>
				)}
			/>
			<contactForm.Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting]}
				// biome-ignore lint/correctness/noChildrenProp: <This is just how TanStack Form works>
				children={([canSubmit, isSubmitting]) => (
					<div>
						<Button
							type="submit"
							disabled={!canSubmit}
							className="self-start rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground text-xs uppercase tracking-[0.18em] transition-transform hover:cursor-pointer"
						>
							{isSubmitting ? "..." : "Submit"}
						</Button>
						&nbsp;
						<Button
							type="reset"
							onClick={(e) => {
								e.preventDefault();
								contactForm.reset();
							}}
							className="self-start rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground text-xs uppercase tracking-[0.18em] transition-transform hover:cursor-pointer"
						>
							Reset
						</Button>
					</div>
				)}
			/>
		</form>
	);
};

function FieldInfo({ field }: { field: AnyFieldApi }) {
	return (
		<>
			{field.state.meta.isTouched && !field.state.meta.isValid ? (
				<em>{field.state.meta.errors.map((e) => e.message).join(", ")}</em>
			) : null}
			{field.state.meta.isValidating ? "Validating..." : null}
		</>
	);
}
