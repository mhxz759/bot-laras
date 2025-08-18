import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const extendedSchema = insertUserSchema.extend({
    confirmPassword: insertUserSchema.shape.password,
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

  const form = useForm<InsertUser & { confirmPassword: string }>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      fullName: "",
      email: "",
      cpf: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: InsertUser & { confirmPassword: string }) => {
    if (!acceptTerms) {
      toast({
        title: "Termos de uso",
        description: "Você deve aceitar os termos de uso para continuar",
        variant: "destructive",
      });
      return;
    }

    try {
      const { confirmPassword, ...userData } = data;
      await registerUser(userData);
      setLocation("/dashboard");
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao ZynBank!",
      });
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-md w-full">
        <Card className="shadow-fintech card-hover">
          <CardContent className="pt-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-zynblue rounded-xl p-2 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">Z</span>
              </div>
              <h2 className="text-2xl font-semibold text-zyngray mb-2">Criar Conta</h2>
              <p className="text-gray-600">Junte-se à revolução fintech</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="fullName" className="block text-sm font-medium text-zyngray mb-2">
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  placeholder="Seu nome completo"
                  className="input-field"
                  {...form.register("fullName")}
                />
                {form.formState.errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.fullName.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-zyngray mb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="input-field"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="cpf" className="block text-sm font-medium text-zyngray mb-2">
                  CPF
                </Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  className="input-field"
                  {...form.register("cpf")}
                />
                {form.formState.errors.cpf && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.cpf.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone" className="block text-sm font-medium text-zyngray mb-2">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  className="input-field"
                  {...form.register("phone")}
                />
                {form.formState.errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.phone.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-zyngray mb-2">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="input-field pr-10"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-zyngray mb-2">
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="input-field pr-10"
                    {...form.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm text-gray-600 leading-5">
                  Concordo com os{" "}
                  <a href="#" className="text-zynblue hover:text-zynblue-dark">
                    Termos de Uso
                  </a>{" "}
                  e{" "}
                  <a href="#" className="text-zynblue hover:text-zynblue-dark">
                    Política de Privacidade
                  </a>
                </Label>
              </div>

              <Button 
                type="submit" 
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="spinner mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Criar Conta
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Já tem conta?{" "}
                <Link href="/login" className="text-zynblue hover:text-zynblue-dark font-medium">
                  Entre aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
