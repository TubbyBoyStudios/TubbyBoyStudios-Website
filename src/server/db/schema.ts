import {
	foreignKey,
	index,
	pgTableCreator,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator(
	(name) => `tubby-boy-studios-dot-com_${name}`,
);

export const contactEntries = createTable("contract_entries", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull(),
	message: text("message").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const affiliateLinks = createTable(
	"affiliate_links",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: text("name").notNull().unique(),
		slug: text("slug").notNull().unique(),
		createdBy: text("created_by").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [index().on(t.slug)],
);

export const claimedAffiliateLinks = createTable(
	"claimed_affiliate_links",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		affiliateLinkId: uuid("affiliate_link_id"),
		steamUserId: text("steam_user_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("claimed_affiliate_links_steam_user_id_unique").on(
			t.steamUserId,
		),
		foreignKey({
			columns: [t.affiliateLinkId],
			foreignColumns: [affiliateLinks.id],
		}),
	],
);
