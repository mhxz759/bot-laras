import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  Check,
  X,
  User,
  Calendar,
  Activity,
  Shield,
} from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("withdrawals");

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: withdrawals = [], isLoading: loadingWithdrawals, refetch: refetchWithdrawals } = useQuery({
    queryKey: ["/api/admin/withdrawals"],
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  const handleWithdrawalAction = async (id: string, status: string, notes?: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/withdrawals/${id}`, { status, notes });
      await refetchWithdrawals();
      toast({
        title: "Saque atualizado",
        description: `Saque ${status === "approved" ? "aprovado" : "rejeitado"} com sucesso`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar saque",
        variant: "destructive",
      });
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Admin Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-zyngray mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie usuários, saques e monitore a receita</p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Receita Total</p>
                  <p className="text-2xl font-semibold text-zyngray">
                    {loadingStats ? "..." : formatCurrency(stats?.totalRevenue || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-zynblue" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Usuários Ativos</p>
                  <p className="text-2xl font-semibold text-zyngray">
                    {loadingStats ? "..." : stats?.activeUsers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Saques Pendentes</p>
                  <p className="text-2xl font-semibold text-zyngray">
                    {loadingStats ? "..." : stats?.pendingWithdrawals || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Transações Hoje</p>
                  <p className="text-2xl font-semibold text-zyngray">
                    {loadingStats ? "..." : stats?.todayTransactions || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Card className="shadow-fintech">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "withdrawals", label: "Saques Pendentes", icon: Clock },
                { id: "users", label: "Usuários", icon: Users },
                { id: "revenue", label: "Receita", icon: DollarSign },
                { id: "logs", label: "Logs", icon: Activity },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? "border-zynblue text-zynblue"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <CardContent className="p-6">
            {/* Withdrawals Tab */}
            {activeTab === "withdrawals" && (
              <div>
                {loadingWithdrawals ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : withdrawals.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum saque pendente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal: any) => (
                      <div key={withdrawal.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-zyngray">{withdrawal.user.fullName}</p>
                            <p className="text-sm text-gray-500">{withdrawal.user.email}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(withdrawal.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg text-zynblue">
                              {formatCurrency(withdrawal.amount)}
                            </p>
                            <p className="text-xs text-gray-500">Taxa: {formatCurrency(withdrawal.fee)}</p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">
                            Chave PIX: <span className="font-mono text-zyngray">{withdrawal.pixKey}</span>
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleWithdrawalAction(withdrawal.id, "approved")}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Aprovar
                          </Button>
                          <Button
                            onClick={() => handleWithdrawalAction(withdrawal.id, "rejected", "Rejeitado pelo administrador")}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Recusar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div>
                {loadingUsers ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((userItem: any) => (
                      <div key={userItem.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <User className="w-5 h-5 text-zynblue" />
                          </div>
                          <div>
                            <p className="font-medium text-zyngray">{userItem.fullName}</p>
                            <p className="text-sm text-gray-600">{userItem.email}</p>
                            <p className={`text-sm ${userItem.isActive ? "text-green-600" : "text-red-600"}`}>
                              {userItem.isActive ? "Ativo" : "Inativo"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-zyngray">
                            {formatCurrency(userItem.balance)}
                          </p>
                          <p className="text-xs text-gray-500">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(userItem.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Revenue Tab */}
            {activeTab === "revenue" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-zyngray mb-2">Receita por Taxas PIX (8%)</h4>
                    <p className="text-3xl font-bold text-green-600">
                      {loadingStats ? "..." : formatCurrency((parseFloat(stats?.totalRevenue || "0") * 0.8) || 0)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Estimativa baseada na receita total</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-zyngray mb-2">Receita por Taxas de Saque (R$ 2)</h4>
                    <p className="text-3xl font-bold text-blue-600">
                      {loadingStats ? "..." : formatCurrency((parseFloat(stats?.totalRevenue || "0") * 0.2) || 0)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Estimativa baseada na receita total</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === "logs" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Sistema iniciado com sucesso</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Painel administrativo acessado</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
