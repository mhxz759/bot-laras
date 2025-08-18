import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { PixModal } from "@/components/modals/pix-modal";
import { WithdrawalModal } from "@/components/modals/withdrawal-modal";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import {
  Wallet,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  FileText,
  Bell,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [showPixModal, setShowPixModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["/api/user/transactions"],
  });

  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useQuery({
    queryKey: ["/api/user/withdrawals"],
  });

  const pendingWithdrawals = withdrawals.filter((w: any) => w.status === "pending");
  const recentTransactions = transactions.slice(0, 5);

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (type === "receive") {
      return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
    }
    if (type === "withdraw") {
      if (status === "pending") {
        return <Clock className="w-5 h-5 text-orange-600" />;
      }
      if (status === "approved" || status === "completed") {
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      }
      if (status === "rejected") {
        return <XCircle className="w-5 h-5 text-red-600" />;
      }
      return <ArrowUpRight className="w-5 h-5 text-blue-600" />;
    }
    return <ArrowUpRight className="w-5 h-5 text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-orange-600";
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "pending":
        return "Pendente";
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Rejeitado";
      default:
        return status;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-zyngray mb-2">
            Olá, {user.fullName}!
          </h1>
          <p className="text-gray-600">Bem-vindo ao seu banco digital</p>
        </div>

        {/* Balance Card */}
        <div className="mb-8 animate-fade-in">
          <Card className="gradient-primary text-white shadow-fintech card-hover">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-blue-200 text-sm mb-2">Saldo disponível</p>
                  <h2 className="text-4xl font-bold">
                    {formatCurrency(user.balance)}
                  </h2>
                </div>
                <div className="bg-white bg-opacity-20 rounded-xl p-3">
                  <Wallet className="w-8 h-8" />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button
                  onClick={() => setShowPixModal(true)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Receber PIX
                </Button>
                <Button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Solicitar Saque
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="card-hover cursor-pointer"
            onClick={() => setShowPixModal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-3 rounded-xl">
                  <ArrowDownLeft className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">Taxa 8%</span>
              </div>
              <h3 className="text-lg font-semibold text-zyngray mb-1">Receber</h3>
              <p className="text-gray-600 text-sm">Gerar PIX para recebimento</p>
            </CardContent>
          </Card>

          <Card 
            className="card-hover cursor-pointer"
            onClick={() => setShowWithdrawalModal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <ArrowUpRight className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-blue-600 font-medium">R$ 2</span>
              </div>
              <h3 className="text-lg font-semibold text-zyngray mb-1">Sacar</h3>
              <p className="text-gray-600 text-sm">Solicitar saque manual</p>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer">
            <CardContent className="p-6">
              <div className="bg-purple-100 p-3 rounded-xl mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-zyngray mb-1">Histórico</h3>
              <p className="text-gray-600 text-sm">Ver todas as transações</p>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer">
            <CardContent className="p-6">
              <div className="bg-orange-100 p-3 rounded-xl mb-4">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-zyngray mb-1">Notificações</h3>
              <p className="text-gray-600 text-sm">Acompanhar status</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Withdrawals */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-zyngray mb-4">
                  Saques Pendentes
                </h3>
                
                {loadingWithdrawals ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : pendingWithdrawals.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum saque pendente
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingWithdrawals.map((withdrawal: any) => (
                      <div key={withdrawal.id} className="border border-orange-200 rounded-xl p-4 bg-orange-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-orange-800">
                              {formatCurrency(withdrawal.amount)}
                            </p>
                            <p className="text-sm text-orange-600">
                              {new Date(withdrawal.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-orange-600">
                            <Clock className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-zyngray">
                    Transações Recentes
                  </h3>
                  <Button variant="ghost" className="text-zynblue hover:text-zynblue-dark">
                    Ver todas
                  </Button>
                </div>

                {loadingTransactions ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma transação ainda</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Suas transações aparecerão aqui
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction: any) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-gray-100 p-2 rounded-lg">
                            {getTransactionIcon(transaction.type, transaction.status)}
                          </div>
                          <div>
                            <p className="font-medium text-zyngray">
                              {transaction.type === "receive" 
                                ? "Recebimento PIX" 
                                : transaction.type === "withdraw"
                                ? "Saque Solicitado"
                                : transaction.description || "Transação"
                              }
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === "receive" 
                              ? "text-green-600" 
                              : "text-blue-600"
                          }`}>
                            {transaction.type === "receive" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <div className="flex items-center justify-end space-x-2">
                            {parseFloat(transaction.fee) > 0 && (
                              <p className="text-xs text-gray-500">
                                Taxa: {formatCurrency(transaction.fee)}
                              </p>
                            )}
                            <p className={`text-xs ${getStatusColor(transaction.status)}`}>
                              {getStatusText(transaction.status)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PixModal 
        isOpen={showPixModal} 
        onClose={() => setShowPixModal(false)} 
      />
      <WithdrawalModal 
        isOpen={showWithdrawalModal} 
        onClose={() => setShowWithdrawalModal(false)} 
      />
    </div>
  );
}
