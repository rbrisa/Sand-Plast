import React, { useContext } from "react";
import { AuthContext } from "@/App";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Target, Image, BarChart3, LogOut, Package, Shield, CreditCard, ArrowDownToLine, TrendingUp, Lock, FileText } from "lucide-react";

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdvertiser = user?.role === "advertiser";

  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  const advertiserNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Campagnes", href: "/campaigns", icon: Target },
    { name: "Créatifs", href: "/creatives", icon: Image },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Recharger", href: "/payment", icon: CreditCard },
  ];

  const publisherNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inventaires", href: "/inventory", icon: Package },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Retraits", href: "/withdrawals", icon: ArrowDownToLine },
  ];

  const adminNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Administration", href: "/admin", icon: Shield },
    { name: "Revenus AOK", href: "/platform-revenue", icon: TrendingUp },
    { name: "Logs d'Audit", href: "/admin/audit-logs", icon: FileText },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  const navigation = isAdmin ? adminNavigation : (isAdvertiser ? advertiserNavigation : publisherNavigation);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold gradient-text">AOK</h1>
          <p className="text-xs text-gray-500 mt-1">{user?.company_name}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                data-testid={`nav-${item.name.toLowerCase()}`}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          {isAdvertiser && (
            <div className="mb-3 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600">Solde</p>
              <p className="text-lg font-bold text-green-600">${user?.balance?.toLocaleString() || 0}</p>
            </div>
          )}
          <Button
            onClick={logout}
            variant="outline"
            className="w-full"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
