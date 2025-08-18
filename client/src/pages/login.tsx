import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, LogIn, Shield, Smartphone, TrendingUp } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    try {
      const result = await login(data);
      if (result.user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${result.user.fullName}!`,
      });
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Email ou senha inválidos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        {/* Tech pattern background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          {/* ZynBank Logo */}
          <div className="mb-8 text-center">
            <div className="w-20 h-20 mb-4 bg-white rounded-2xl p-3 mx-auto flex items-center justify-center">
              <span className="text-3xl font-bold text-zyngray">Z</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">ZynBank</h1>
            <p className="text-xl text-blue-200">Fintech Moderna</p>
          </div>
          
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Revolucione suas Finanças</h2>
            <p className="text-blue-100 mb-12">
              Segurança, simplicidade e inovação em um só lugar. 
              Gerencie seus pagamentos com facilidade total.
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-blue-200" />
              <span>Segurança Bancária Avançada</span>
            </div>
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-blue-200" />
              <span>Interface Moderna e Intuitiva</span>
            </div>
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-200" />
              <span>Relatórios em Tempo Real</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full">
          <Card className="shadow-fintech card-hover">
            <CardContent className="pt-8">
              <div className="text-center mb-8">
                <div className="lg:hidden mb-6">
                  <div className="w-16 h-16 mx-auto mb-3 bg-zynblue rounded-xl p-2 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">Z</span>
                  </div>
                  <h1 className="text-2xl font-bold text-zyngray">ZynBank</h1>
                </div>
                <h2 className="text-2xl font-semibold text-zyngray mb-2">Acesse sua Conta</h2>
                <p className="text-gray-600">Entre para gerenciar suas finanças</p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      Lembrar-me
                    </Label>
                  </div>
                  <a href="#" className="text-sm text-zynblue hover:text-zynblue-dark">
                    Esqueceu a senha?
                  </a>
                </div>

                <Button 
                  type="submit" 
                  className="btn-primary w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="spinner mr-2" />
                  ) : (
                    <LogIn className="w-4 h-4 mr-2" />
                  )}
                  Entrar
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Não tem conta?{" "}
                  <Link href="/register" className="text-zynblue hover:text-zynblue-dark font-medium">
                    Cadastre-se aqui
                  </Link>
                </p>
              </div>

              {/* Admin Access */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  Acesso administrativo disponível após login
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
