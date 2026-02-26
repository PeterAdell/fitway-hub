import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Dumbbell, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function AdminLayout() {
  const location = useLocation();
  const { logout } = useAuth();
  const { isDark } = useTheme();

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Programs", path: "/admin/programs", icon: Dumbbell },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex transition-colors ${
      isDark
        ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white"
        : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-slate-900"
    }`}>
      {/* Sidebar */}
      <aside className={`w-64 flex flex-col fixed inset-y-0 backdrop-blur-md border-r transition-colors ${
        isDark
          ? "bg-white/6 border-white/10"
          : "bg-white/40 border-white/20"
      }`}>
        <div className={`h-16 flex items-center px-6 border-b ${
          isDark ? "border-white/10" : "border-white/20"
        }`}>
          <span className="text-xl font-bold text-emerald-400">Fitway Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? isDark ? "bg-emerald-600/10 text-emerald-300" : "bg-emerald-500/10 text-emerald-600"
                  : isDark ? "text-white/80 hover:bg-white/6 hover:text-white" : "text-slate-600 hover:bg-white/30 hover:text-slate-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className={`p-4 border-t ${
          isDark ? "border-white/6" : "border-white/10"
        }`}>
          <button 
            onClick={logout}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? "text-rose-400 hover:bg-rose-600/10"
                : "text-rose-600 hover:bg-rose-600/10"
            }`}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className={`backdrop-blur-md rounded-2xl p-6 border transition-colors ${
          isDark
            ? "bg-white/6 border-white/10"
            : "bg-white/40 border-white/20"
        }`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
