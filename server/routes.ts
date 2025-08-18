import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import { insertUserSchema, loginSchema, insertWithdrawalSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const CREDPIX_API_TOKEN = process.env.CREDPIX_API_TOKEN || "72cc92adced5e35c1e40b5a04a5e6ef0";

interface AuthRequest extends Express.Request {
  user?: any;
}

// Auth middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};

// Admin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      const user = await storage.createUser(userData);
      
      // Create activity log
      await storage.createActivityLog({
        userId: user.id,
        action: "user_registered",
        details: `Usuário ${user.fullName} se cadastrou`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.validateUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Conta desativada" });
      }

      // Create activity log
      await storage.createActivityLog({
        userId: user.id,
        action: "user_login",
        details: `Usuário ${user.fullName} fez login`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // User routes
  app.get("/api/user/profile", authenticateToken, async (req: AuthRequest, res) => {
    res.json({ user: { ...req.user, password: undefined } });
  });

  app.get("/api/user/transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ message: "Erro ao buscar transações" });
    }
  });

  app.get("/api/user/withdrawals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const withdrawals = await storage.getUserWithdrawals(req.user.id);
      res.json(withdrawals);
    } catch (error) {
      console.error('Get withdrawals error:', error);
      res.status(500).json({ message: "Erro ao buscar saques" });
    }
  });

  // PIX Payment routes
  app.post("/api/pix/generate", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { amount, description } = req.body;
      const numAmount = parseFloat(amount);
      
      if (numAmount < 10) {
        return res.status(400).json({ message: "Valor mínimo de R$ 10,00" });
      }

      // Call CredPix API
      const credPixResponse = await fetch(
        `https://credpix.finance/api/create.php?tokenuser=${CREDPIX_API_TOKEN}&valor=${numAmount}&chatidpagador=${req.user.id}`
      );
      
      const credPixData = await credPixResponse.json();
      
      if (credPixData.Status !== "success") {
        return res.status(400).json({ message: "Erro ao gerar PIX" });
      }

      // Save PIX payment to database
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes expiry

      const pixPayment = await storage.createPixPayment({
        userId: req.user.id,
        amount: amount.toString(),
        pixId: credPixData.IDPagamento,
        qrCode: credPixData.CopiaeCola,
        expiresAt,
      });

      res.json({
        id: pixPayment.id,
        qrCode: credPixData.CopiaeCola,
        pixId: credPixData.IDPagamento,
        amount: numAmount,
        expiresAt,
      });
    } catch (error) {
      console.error('Generate PIX error:', error);
      res.status(500).json({ message: "Erro ao gerar PIX" });
    }
  });

  app.post("/api/pix/verify/:pixId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { pixId } = req.params;
      
      // Call CredPix verification API
      const credPixResponse = await fetch(
        `https://credpix.finance/api/verificar.php?tokenuser=${CREDPIX_API_TOKEN}&IDPagamento=${pixId}`
      );
      
      const credPixData = await credPixResponse.json();
      
      if (credPixData.status !== "success") {
        return res.status(400).json({ message: "Erro ao verificar pagamento" });
      }

      const pixPayment = await storage.getPixPaymentByPixId(pixId);
      if (!pixPayment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      // Update payment status if paid
      if (credPixData.payment_status === "Pagamento Aprovado" && pixPayment.status !== "paid") {
        await storage.updatePixPaymentStatus(pixPayment.id, "paid", new Date());
        
        // Calculate fee (8%) and net amount
        const amount = parseFloat(pixPayment.amount);
        const fee = amount * 0.08;
        const netAmount = amount - fee;
        
        // Update user balance
        const currentBalance = parseFloat(req.user.balance);
        const newBalance = (currentBalance + netAmount).toFixed(2);
        await storage.updateUserBalance(req.user.id, newBalance);
        
        // Create transaction records
        await storage.createTransaction({
          userId: req.user.id,
          type: "receive",
          amount: amount.toString(),
          fee: fee.toString(),
          description: "Recebimento PIX",
          pixId: pixId,
          status: "completed",
        });

        // Create activity log
        await storage.createActivityLog({
          userId: req.user.id,
          action: "payment_received",
          details: `Recebimento PIX de R$ ${amount.toFixed(2)} (taxa: R$ ${fee.toFixed(2)})`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }

      res.json({
        status: credPixData.payment_status,
        paid: credPixData.payment_status === "Pagamento Aprovado",
      });
    } catch (error) {
      console.error('Verify PIX error:', error);
      res.status(500).json({ message: "Erro ao verificar pagamento" });
    }
  });

  // Withdrawal routes
  app.post("/api/withdrawals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const withdrawalData = insertWithdrawalSchema.parse(req.body);
      const amount = parseFloat(withdrawalData.amount);
      const fee = 2.00;
      const totalAmount = amount + fee;
      
      // Check if user has sufficient balance
      const currentBalance = parseFloat(req.user.balance);
      if (currentBalance < totalAmount) {
        return res.status(400).json({ message: "Saldo insuficiente" });
      }

      const withdrawal = await storage.createWithdrawal({
        ...withdrawalData,
        userId: req.user.id,
      });

      // Create activity log
      await storage.createActivityLog({
        userId: req.user.id,
        action: "withdrawal_requested",
        details: `Saque solicitado: R$ ${amount.toFixed(2)} (taxa: R$ ${fee.toFixed(2)})`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(withdrawal);
    } catch (error) {
      console.error('Create withdrawal error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erro ao solicitar saque" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => ({ ...user, password: undefined }));
      res.json(safeUsers);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.get("/api/admin/withdrawals", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const withdrawals = await storage.getPendingWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      console.error('Get pending withdrawals error:', error);
      res.status(500).json({ message: "Erro ao buscar saques pendentes" });
    }
  });

  app.patch("/api/admin/withdrawals/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      await storage.updateWithdrawalStatus(id, status, req.user.id, notes);

      // If approved, process the withdrawal
      if (status === "approved") {
        const withdrawals = await storage.getPendingWithdrawals();
        const withdrawal = withdrawals.find(w => w.id === id);
        
        if (withdrawal) {
          const amount = parseFloat(withdrawal.amount);
          const fee = parseFloat(withdrawal.fee);
          const totalAmount = amount + fee;
          
          // Deduct from user balance
          const currentBalance = parseFloat(withdrawal.user.balance);
          const newBalance = (currentBalance - totalAmount).toFixed(2);
          await storage.updateUserBalance(withdrawal.userId, newBalance);
          
          // Create transaction record
          await storage.createTransaction({
            userId: withdrawal.userId,
            type: "withdraw",
            amount: amount.toString(),
            fee: fee.toString(),
            description: `Saque aprovado - PIX: ${withdrawal.pixKey}`,
            pixKey: withdrawal.pixKey,
            status: "completed",
          });

          // Create activity log
          await storage.createActivityLog({
            userId: withdrawal.userId,
            action: "withdrawal_approved",
            details: `Saque aprovado: R$ ${amount.toFixed(2)} para ${withdrawal.pixKey}`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          });
        }
      } else {
        // Create activity log for rejection
        await storage.createActivityLog({
          userId: req.user.id,
          action: "withdrawal_rejected",
          details: `Saque rejeitado: ${notes || 'Sem motivo especificado'}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }

      res.json({ message: "Saque atualizado com sucesso" });
    } catch (error) {
      console.error('Update withdrawal error:', error);
      res.status(500).json({ message: "Erro ao atualizar saque" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
