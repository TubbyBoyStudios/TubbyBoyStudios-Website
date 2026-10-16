import crypto from "node:crypto";
import { currentUser } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import { env } from "~/env";
import {
	authedProcedure,
	createTRPCRouter,
	publicProcedure,
} from "~/server/api/trpc";
import { affiliateLinks, claimedAffiliateLinks } from "~/server/db/schema";

const steamIdSchema = z.string();
const dateStringSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/)
	.refine((value) => {
		const date = new Date(`${value}T00:00:00.000Z`);
		return (
			!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
		);
	}, "Invalid date");

const authenticateTicketResponseSchema = z
	.object({
		response: z
			.object({
				params: z
					.object({
						result: z.string(),
						steamid: steamIdSchema.optional(),
					})
					.passthrough(),
			})
			.passthrough(),
	})
	.passthrough();

const appOwnershipResponseSchema = z
	.object({
		appownership: z
			.object({
				ownsapp: z.boolean(),
			})
			.passthrough(),
	})
	.passthrough();

function redactSteamPayload(value: unknown, depth = 0): unknown {
	if (depth > 8) {
		return "[TRUNCATED]";
	}
	if (Array.isArray(value)) {
		return value
			.slice(0, 20)
			.map((item) => redactSteamPayload(item, depth + 1));
	}
	if (typeof value === "string") {
		return value.length > 1000
			? `${value.slice(0, 1000)}...[TRUNCATED]`
			: value;
	}
	if (typeof value !== "object" || value === null) {
		return value;
	}

	return Object.fromEntries(
		Object.entries(value).map(([key, item]) => [
			key,
			/key|ticket|steamid|identity/i.test(key)
				? "[REDACTED]"
				: redactSteamPayload(item, depth + 1),
		]),
	);
}

function logAffiliateClaimFailure(
	event: string,
	details: Record<string, unknown>,
): void {
	console.error(
		JSON.stringify({
			level: "error",
			scope: "affiliate-claim",
			event,
			...details,
		}),
	);
}

function getErrorDetails(error: unknown): Record<string, unknown> {
	if (error instanceof Error) {
		return {
			errorName: error.name,
			errorMessage: error.message
				.replace(
					/([?&](?:key|ticket|steamid|identity)=)[^&\s]*/gi,
					"$1[REDACTED]",
				)
				.slice(0, 1000),
		};
	}
	return {
		errorType: error === null ? "null" : typeof error,
	};
}

async function fetchSteamResponse<T>(
	url: URL,
	schema: z.ZodType<T>,
	operation: string,
): Promise<T> {
	const steamErrorResponseSchema = z
		.object({
			response: z
				.object({
					error: z
						.object({
							errorcode: z.number(),
							errordesc: z.string(),
						})
						.passthrough(),
				})
				.passthrough(),
		})
		.passthrough();
	const steamResponseSchema = z.union([
		schema.transform((data) => ({ type: "success" as const, data })),
		steamErrorResponseSchema.transform((data) => ({
			type: "steam_error" as const,
			data,
		})),
	]);

	let response: Response;
	try {
		response = await fetch(url, { cache: "no-store" });
	} catch (error) {
		logAffiliateClaimFailure("steam_request_failed", {
			operation,
			...getErrorDetails(error),
		});
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `Steam ${operation} request failed`,
			cause: error,
		});
	}

	let body: unknown;
	try {
		body = await response.json();
	} catch (error) {
		logAffiliateClaimFailure("steam_invalid_json", {
			operation,
			status: response.status,
			contentType: response.headers.get("content-type"),
			...getErrorDetails(error),
		});
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `Steam ${operation} returned invalid JSON`,
			cause: error,
		});
	}

	if (!response.ok) {
		logAffiliateClaimFailure("steam_http_error", {
			operation,
			status: response.status,
			payload: redactSteamPayload(body),
		});
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `Steam ${operation} request failed with status ${response.status}`,
		});
	}

	const parsed = steamResponseSchema.safeParse(body);
	if (!parsed.success) {
		logAffiliateClaimFailure("steam_invalid_response", {
			operation,
			status: response.status,
			issues: parsed.error.issues.map(({ code, path, message }) => ({
				code,
				path,
				message,
			})),
			payload: redactSteamPayload(body),
		});
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `Steam ${operation} returned an invalid response`,
			cause: parsed.error,
		});
	}
	if (parsed.data.type === "steam_error") {
		const { error } = parsed.data.data.response;
		logAffiliateClaimFailure("steam_api_error_response", {
			operation,
			errorCode: error.errorcode,
			errorDescription: error.errordesc,
			payload: redactSteamPayload(body),
		});
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `Steam ${operation} request failed`,
		});
	}
	return parsed.data.data;
}

async function getSteamUserId(authTicket: string): Promise<string> {
	const url = new URL(
		"https://partner.steam-api.com/ISteamUserAuth/AuthenticateUserTicket/v1/",
	);
	url.searchParams.set("key", env.STEAM_PUBLISHER_API_KEY);
	url.searchParams.set("appid", String(env.STEAM_GAME_ID));
	url.searchParams.set("ticket", authTicket);
	url.searchParams.set("identity", env.STEAM_GAME_IDENTITY);

	const response = await fetchSteamResponse(
		url,
		authenticateTicketResponseSchema,
		"ticket authentication",
	);
	const { params } = response.response;
	if (params.result !== "OK" || params.steamid == null) {
		logAffiliateClaimFailure("steam_ticket_rejected", {
			operation: "ticket authentication",
			result: params.result,
			payload: redactSteamPayload(response),
		});
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "The Steam authentication ticket is invalid or expired",
		});
	}
	return params.steamid;
}

async function ownsSteamGame(steamUserId: string): Promise<boolean> {
	const url = new URL(
		"https://partner.steam-api.com/ISteamUser/CheckAppOwnership/v4/",
	);
	url.searchParams.set("key", env.STEAM_PUBLISHER_API_KEY);
	url.searchParams.set("steamid", steamUserId);
	url.searchParams.set("appid", String(env.STEAM_GAME_ID));

	const response = await fetchSteamResponse(
		url,
		appOwnershipResponseSchema,
		"game ownership check",
	);
	return response.appownership.ownsapp;
}

function isUniqueConstraintViolation(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		error.code === "23505"
	);
}

export const affiliateLinkRouter = createTRPCRouter({
	create: authedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				customSlug: z.string().min(1).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await currentUser();
			if (!user) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Unauthorized",
				});
			}
			const createdBy = user.username ?? ctx.auth.userId;
			if (!createdBy) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Could not find user's name",
				});
			}
			await ctx.db.insert(affiliateLinks).values({
				name: input.name,
				slug: input.customSlug ?? crypto.randomBytes(8).toString("hex"),
				createdBy,
			});
		}),

	list: authedProcedure.query(async ({ ctx }) => {
		const links = await ctx.db.query.affiliateLinks.findMany({
			orderBy: (affiliateLinks, { desc }) => [desc(affiliateLinks.createdAt)],
			limit: 20,
		});
		const linkIds = links.map((l) => l.id);
		const linkUsages = await ctx.db
			.select({
				linkId: claimedAffiliateLinks.affiliateLinkId,
				count: count(claimedAffiliateLinks.affiliateLinkId),
			})
			.from(claimedAffiliateLinks)
			.where(inArray(claimedAffiliateLinks.affiliateLinkId, linkIds))
			.groupBy(claimedAffiliateLinks.affiliateLinkId);
		const linkCounts = new Map<string, number>();
		for (const usage of linkUsages) {
			const linkId = usage.linkId;
			if (linkId == null) {
				continue;
			}
			linkCounts.set(linkId, usage.count);
		}
		return links.map((l) => ({
			...l,
			claimed: linkCounts.get(l.id) ?? 0,
		}));
	}),

	claimStats: authedProcedure
		.input(
			z
				.object({
					affiliateLinkId: z.string().uuid(),
					startDate: dateStringSchema,
					endDate: dateStringSchema,
				})
				.refine(
					({ startDate, endDate }) => startDate <= endDate,
					"Start date must be on or before end date",
				),
		)
		.query(async ({ ctx, input }) => {
			const affiliateLink = await ctx.db.query.affiliateLinks.findFirst({
				where: eq(affiliateLinks.id, input.affiliateLinkId),
			});
			if (affiliateLink == null) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Affiliate link missing",
				});
			}

			const endExclusive = new Date(`${input.endDate}T00:00:00.000Z`);
			endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
			const claimRows = await ctx.db
				.select({
					id: claimedAffiliateLinks.id,
					steamUserId: claimedAffiliateLinks.steamUserId,
					createdAt: claimedAffiliateLinks.createdAt,
				})
				.from(claimedAffiliateLinks)
				.where(
					and(
						eq(claimedAffiliateLinks.affiliateLinkId, affiliateLink.id),
						gte(
							claimedAffiliateLinks.createdAt,
							new Date(`${input.startDate}T00:00:00.000Z`),
						),
						lt(claimedAffiliateLinks.createdAt, endExclusive),
					),
				)
				.orderBy(desc(claimedAffiliateLinks.createdAt));

			return {
				affiliateLink,
				claimed: claimRows.length,
				claims: claimRows,
				startDate: input.startDate,
				endDate: input.endDate,
			};
		}),

	claim: publicProcedure
		.input(
			z.object({
				affiliateLinkSlug: z.string().min(1),
				authTicket: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const affiliateLink = await ctx.db.query.affiliateLinks.findFirst({
				where: eq(affiliateLinks.slug, input.affiliateLinkSlug),
			});
			if (affiliateLink == null) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Affiliate link missing",
				});
			}

			const steamUserId = await getSteamUserId(input.authTicket);
			const previousClaim = await ctx.db.query.claimedAffiliateLinks.findFirst({
				where: eq(claimedAffiliateLinks.steamUserId, steamUserId),
				columns: { id: true },
			});
			if (previousClaim != null) {
				logAffiliateClaimFailure("steam_account_already_claimed", {
					affiliateLinkId: affiliateLink.id,
				});
				throw new TRPCError({
					code: "CONFLICT",
					message: "This Steam account has already used an affiliate link",
				});
			}

			if (!(await ownsSteamGame(steamUserId))) {
				logAffiliateClaimFailure("steam_game_not_owned", {
					affiliateLinkId: affiliateLink.id,
				});
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You must own the game to claim an affiliate link",
				});
			}

			try {
				await ctx.db.insert(claimedAffiliateLinks).values({
					affiliateLinkId: affiliateLink.id,
					steamUserId,
				});
			} catch (error) {
				if (isUniqueConstraintViolation(error)) {
					logAffiliateClaimFailure("steam_account_claim_race", {
						affiliateLinkId: affiliateLink.id,
						...getErrorDetails(error),
					});
					throw new TRPCError({
						code: "CONFLICT",
						message: "This Steam account has already used an affiliate link",
						cause: error,
					});
				}
				logAffiliateClaimFailure("claim_persistence_failed", {
					affiliateLinkId: affiliateLink.id,
					...getErrorDetails(error),
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Unable to claim affiliate link",
					cause: error,
				});
			}
		}),
});
