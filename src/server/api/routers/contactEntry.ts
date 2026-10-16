import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { contactEntries } from "~/server/db/schema";

export const contactEntryRouter = createTRPCRouter({
	create: publicProcedure
		.input(
			z.object({
				name: z.string().min(1),
				email: z.string().email(),
				message: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.insert(contactEntries).values({
				name: input.name,
				email: input.email,
				message: input.message,
			});
		}),

	list: publicProcedure.query(async ({ ctx }) => {
		const contactEntry = await ctx.db.query.contactEntries.findMany({
			orderBy: (contactEntries, { desc }) => [desc(contactEntries.createdAt)],
			limit: 20,
		});

		return contactEntry ?? null;
	}),
});
