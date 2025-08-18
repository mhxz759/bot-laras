import { 
  users, 
  transactions, 
  withdrawals, 
  pixPayments, 
  activityLogs,
  type User, 
  type InsertUser,
  type Transaction,
  type InsertTransaction,
  type Withdrawal,
  type InsertWithdrawal,
  type PixPayment,
  type InsertPixPayment,
  type ActivityLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: string, balance: string): Promise<void>;
  validateUser(email: string, password: string): Promise<User | null>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  
  // Withdrawal methods
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getUserWithdrawals(userId: string): Promise<Withdrawal[]>;
  getPendingWithdrawals(): Promise<Array<Withdrawal & { user: User }>>;
  updateWithdrawalStatus(id: string, status: string, adminId: string, notes?: string): Promise<void>;
  
  // PIX Payment methods
  createPixPayment(payment: InsertPixPayment): Promise<PixPayment>;
  getPixPayment(id: string): Promise<PixPayment | undefined>;
  getPixPaymentByPixId(pixId: string): Promise<PixPayment | undefined>;
  updatePixPaymentStatus(id: string, status: string, paidAt?: Date): Promise<void>;
  
  // Activity Log methods
  createActivityLog(log: Partial<ActivityLog>): Promise<void>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  getAdminStats(): Promise<{
    totalRevenue: string;
    activeUsers: number;
    pendingWithdrawals: number;
    todayTransactions: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUserBalance(id: string, balance: string): Promise<void> {
    await db
      .update(users)
      .set({ balance, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const [newWithdrawal] = await db
      .insert(withdrawals)
      .values({ ...withdrawal, fee: "2.00" })
      .returning();
    return newWithdrawal;
  }

  async getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
    return await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.createdAt));
  }

  async getPendingWithdrawals(): Promise<Array<Withdrawal & { user: User }>> {
    return await db
      .select({
        id: withdrawals.id,
        userId: withdrawals.userId,
        amount: withdrawals.amount,
        fee: withdrawals.fee,
        pixKey: withdrawals.pixKey,
        status: withdrawals.status,
        adminNotes: withdrawals.adminNotes,
        processedAt: withdrawals.processedAt,
        processedBy: withdrawals.processedBy,
        createdAt: withdrawals.createdAt,
        user: users,
      })
      .from(withdrawals)
      .innerJoin(users, eq(withdrawals.userId, users.id))
      .where(eq(withdrawals.status, "pending"))
      .orderBy(desc(withdrawals.createdAt));
  }

  async updateWithdrawalStatus(id: string, status: string, adminId: string, notes?: string): Promise<void> {
    await db
      .update(withdrawals)
      .set({
        status,
        processedBy: adminId,
        processedAt: new Date(),
        adminNotes: notes,
      })
      .where(eq(withdrawals.id, id));
  }

  async createPixPayment(payment: InsertPixPayment): Promise<PixPayment> {
    const [newPayment] = await db
      .insert(pixPayments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getPixPayment(id: string): Promise<PixPayment | undefined> {
    const [payment] = await db
      .select()
      .from(pixPayments)
      .where(eq(pixPayments.id, id));
    return payment || undefined;
  }

  async getPixPaymentByPixId(pixId: string): Promise<PixPayment | undefined> {
    const [payment] = await db
      .select()
      .from(pixPayments)
      .where(eq(pixPayments.pixId, pixId));
    return payment || undefined;
  }

  async updatePixPaymentStatus(id: string, status: string, paidAt?: Date): Promise<void> {
    await db
      .update(pixPayments)
      .set({
        status,
        paidAt: paidAt || undefined,
      })
      .where(eq(pixPayments.id, id));
  }

  async createActivityLog(log: Partial<ActivityLog>): Promise<void> {
    await db.insert(activityLogs).values(log as any);
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, "user"))
      .orderBy(desc(users.createdAt));
  }

  async getAdminStats(): Promise<{
    totalRevenue: string;
    activeUsers: number;
    pendingWithdrawals: number;
    todayTransactions: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate total revenue from fees
    const [revenueResult] = await db
      .select({
        totalFees: sql<string>`COALESCE(SUM(${transactions.fee}), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.status, "completed"));

    // Count active users
    const [activeUsersResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .where(and(eq(users.role, "user"), eq(users.isActive, true)));

    // Count pending withdrawals
    const [pendingWithdrawalsResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(withdrawals)
      .where(eq(withdrawals.status, "pending"));

    // Count today's transactions
    const [todayTransactionsResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(sql`${transactions.createdAt} >= ${today}`);

    return {
      totalRevenue: revenueResult?.totalFees || "0",
      activeUsers: activeUsersResult?.count || 0,
      pendingWithdrawals: pendingWithdrawalsResult?.count || 0,
      todayTransactions: todayTransactionsResult?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
