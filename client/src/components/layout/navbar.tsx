import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Bell, LogOut, Shield, User } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const toggleRole = () => {
    if (user?.role === "admin") {
      setLocation(location === "/admin" ? "/dashboard" : "/admin");
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-zyngray rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Z</span>
            </div>
            <span className="text-2xl font-bold text-zyngray">ZYNBANK</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user?.role === "admin" && (
              <Button
                onClick={toggleRole}
                variant="outline"
                className="border-zynblue text-zynblue hover:bg-zynblue hover:text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                {location === "/admin" ? "Área Usuário" : "Área Admin"}
              </Button>
            )}
            
            <div className="relative">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-zyngray">{user?.fullName}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === "admin" ? "Administrador" : "Cliente"}
                </p>
              </div>
              <div className="w-8 h-8 bg-zynblue rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
