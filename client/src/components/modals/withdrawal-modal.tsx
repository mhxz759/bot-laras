import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWithdrawalSchema, type InsertWithdrawal } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowUpRight, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<InsertWithdrawal>({
    resolver: zodResolver(insertWithdrawalSchema),
    defaultValues: {
      amount: "",
      pixKey: "",
    },
  });

  const onSubmit = async (data: InsertWithdrawal) => {
    const amount = parseFloat(data.amount);
    const fee = 2.00;
    const totalAmount = amount + fee;
    const currentBalance = parseFloat(user?.balance || "0");

    if (totalAmount > currentBalance) {
      toast({
        title: "Saldo insuficiente",
        description: `Você precisa de R$ ${totalAmount.toFixed(2)} (valor + taxa) mas tem apenas R$ ${currentBalance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/withdrawals", data);
      
      toast({
        title: "Saque solicitado com sucesso!",
        description: "Seu saque será analisado pelo administrador",
      });
      
      onClose();
      form.reset();
      window.location.reload(); // Refresh to update data
    } catch (error: any) {
      toast({
        title: "Erro ao solicitar saque",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    }
  };

  const amount = form.watch("amount");
  const numAmount = parseFloat(amount) || 0;
  const fee = 2.00;
  const finalAmount = numAmount - fee;
  const currentBalance = parseFloat(user?.balance || "0");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Solicitar Saque</DialogTitle>
              <DialogDescription>
                Solicite um saque manual via PIX
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-zyngray">
              Valor do saque (R$)
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={currentBalance - 2}
              step="0.01"
              placeholder="0.00"
              className="input-field mt-1"
              {...form.register("amount")}
            />
            {form.formState.errors.amount && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.amount.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Taxa de R$ 2,00 será descontada do seu saldo
            </p>
          </div>
          
          <div>
            <Label htmlFor="pixKey" className="text-sm font-medium text-zyngray">
              Chave PIX de destino
            </Label>
            <Input
              id="pixKey"
              placeholder="CPF, email ou telefone"
              className="input-field mt-1"
              {...form.register("pixKey")}
            />
            {form.formState.errors.pixKey && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.pixKey.message}
              </p>
            )}
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Importante:</p>
                <p>
                  O saque será analisado e processado pelo administrador. 
                  Você receberá uma notificação sobre o status.
                </p>
              </div>
            </div>
          </div>

          {numAmount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span>Valor solicitado:</span>
                <span className="font-semibold">R$ {numAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Taxa:</span>
                <span>- R$ {fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-zynblue border-t border-blue-200 pt-2 mt-2">
                <span>Você receberá:</span>
                <span>R$ {finalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Será debitado do saldo:</span>
                <span>R$ {(numAmount + fee).toFixed(2)}</span>
              </div>
            </div>
          )}
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="flex-1 btn-primary"
            >
              {form.formState.isSubmitting ? (
                <div className="spinner mr-2" />
              ) : (
                <ArrowUpRight className="w-4 h-4 mr-2" />
              )}
              Solicitar Saque
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
