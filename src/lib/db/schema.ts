import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  lat: real("lat"),
  lng: real("lng"),
  radiusMiles: integer("radius_miles").default(10).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export const lifeListEntries = pgTable(
  "life_list_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scientificName: text("scientific_name").notNull(),
    commonName: text("common_name").notNull(),
    taxonomicOrder: integer("taxonomic_order").notNull(),
    observationCount: integer("observation_count").default(1).notNull(),
    firstObsDate: text("first_obs_date"),
    firstObsLocation: text("first_obs_location"),
    firstObsChecklistId: text("first_obs_checklist_id"),
    lastObsDate: text("last_obs_date"),
    lastObsLocation: text("last_obs_location"),
    lastObsChecklistId: text("last_obs_checklist_id"),
    importedAt: timestamp("imported_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("life_list_user_species").on(t.userId, t.scientificName)],
);

export const lifeListImports = pgTable("life_list_imports", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  speciesCount: integer("species_count").notNull(),
  totalObservations: integer("total_observations").notNull(),
  skippedRows: integer("skipped_rows").default(0).notNull(),
  importedAt: timestamp("imported_at", { mode: "date" }).defaultNow().notNull(),
});
