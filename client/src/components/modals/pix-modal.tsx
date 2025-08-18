import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { QrCode, Copy, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";

const pixSchema = z.object({
  amount: z.string().min(1, "Valor é obrigatório"),
  description: z.string().optional(),
});

type PixFormData = z.infer<typeof pixSchema>;

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PixModal({ isOpen, onClose }: PixModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string>("");
  const [pixId, setPixId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const form = useForm<PixFormData>({
    resolver: zodResolver(pixSchema),
    defaultValues: {
      amount: "",
      description: "",
    },
  });

  const handleReset = () => {
    setQrCode("");
    setPixId("");
    form.reset();
  };

  const onSubmit = async (data: PixFormData) => {
    const amount = parseFloat(data.amount);
    
    if (amount < 10) {
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para recebimento é R$ 10,00",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/pix/generate", {
        amount: amount,
        description: data.description,
      });

      setQrCode(response.qrCode);
      setPixId(response.pixId);
      
      toast({
        title: "PIX gerado com sucesso!",
        description: "Agora você pode compartilhar o código PIX para recebimento",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar PIX",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!pixId) return;

    setIsChecking(true);
    try {
      const response = await apiRequest("POST", `/api/pix/verify/${pixId}`, {});
      
      if (response.paid) {
        toast({
          title: "Pagamento recebido!",
          description: "O pagamento foi processado com sucesso",
        });
        onClose();
        handleReset();
        window.location.reload(); // Refresh to update balance
      } else {
        toast({
          title: "Pagamento não processado",
          description: "O pagamento ainda não foi recebido",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao verificar pagamento",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCode);
    toast({
      title: "Copiado!",
      description: "Código PIX copiado para a área de transferência",
    });
  };

  const amount = form.watch("amount");
  const numAmount = parseFloat(amount) || 0;
  const fee = numAmount * 0.08;
  const netAmount = numAmount - fee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="bg-zynblue-light/10 p-2 rounded-lg">
              <QrCode className="w-5 h-5 text-zynblue" />
            </div>
            <div>
              <DialogTitle>Receber PIX</DialogTitle>
              <DialogDescription>
                Gere um código PIX para recebimento
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!qrCode ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-sm font-medium text-zyngray">
                Valor (R$)
              </Label>
              <Input
                id="amount"
                type="number"
                min="10"
                step="0.01"
                placeholder="10.00"
                className="input-field mt-1"
                {...form.register("amount")}
              />
              {form.formState.errors.amount && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.amount.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Taxa automática de 8% será descontada
              </p>
            </div>
            
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-zyngray">
                Descrição (opcional)
              </Label>
              <Input
                id="description"
                placeholder="Descrição do pagamento"
                className="input-field mt-1"
                {...form.register("description")}
              />
            </div>

            {numAmount >= 10 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span>Valor solicitado:</span>
                  <span className="font-semibold">R$ {numAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Taxa (8%):</span>
                  <span>- R$ {fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-zynblue border-t border-blue-200 pt-2 mt-2">
                  <span>Você receberá:</span>
                  <span>R$ {netAmount.toFixed(2)}</span>
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
                disabled={isGenerating}
                className="flex-1 btn-primary"
              >
                {isGenerating ? (
                  <div className="spinner mr-2" />
                ) : (
                  <QrCode className="w-4 h-4 mr-2" />
                )}
                Gerar PIX
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 mb-2">Código PIX:</div>
                <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                  {qrCode}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                Valor: <span className="font-semibold">R$ {numAmount.toFixed(2)}</span>
                <br />
                Você receberá: <span className="font-semibold text-green-600">R$ {netAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
              <Button
                onClick={checkPaymentStatus}
                disabled={isChecking}
                className="flex-1 btn-primary"
              >
                {isChecking ? (
                  <div className="spinner mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Verificar
              </Button>
            </div>

            <div className="text-center">
              <Button
                onClick={handleReset}
                variant="ghost"
                className="text-sm text-gray-500"
              >
                Gerar novo PIX
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
