import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  cpf: text("cpf").notNull().unique(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("user"), // user, admin
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // receive, withdraw, fee
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 12, scale: 2 }).notNull().default("0.00"),
  description: text("description"),
  pixId: text("pix_id"), // PIX payment ID from CredPix
  pixKey: text("pix_key"), // For withdrawals
  status: text("status").notNull().default("pending"), // pending, completed, failed, approved, rejected
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const withdrawals = pgTable("withdrawals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 12, scale: 2 }).notNull().default("2.00"),
  pixKey: text("pix_key").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  adminNotes: text("admin_notes"),
  processedAt: timestamp("processed_at"),
  processedBy: uuid("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const pixPayments = pgTable("pix_payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  pixId: text("pix_id").notNull().unique(), // ID from CredPix
  qrCode: text("qr_code").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, expired
  expiresAt: timestamp("expires_at").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  withdrawals: many(withdrawals),
  pixPayments: many(pixPayments),
  activityLogs: many(activityLogs),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
  processedByUser: one(users, {
    fields: [withdrawals.processedBy],
    references: [users.id],
  }),
}));

export const pixPaymentsRelations = relations(pixPayments, ({ one }) => ({
  user: one(users, {
    fields: [pixPayments.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  balance: true,
  role: true,
  isActive: true,
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  processedBy: true,
  adminNotes: true,
  status: true,
  fee: true,
});

export const insertPixPaymentSchema = createInsertSchema(pixPayments).omit({
  id: true,
  createdAt: true,
  paidAt: true,
  status: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type PixPayment = typeof pixPayments.$inferSelect;
export type InsertPixPayment = z.infer<typeof insertPixPaymentSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
