import { Outlet, Link, useLocation } from "react-router-dom";
import { Menu, X, Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export function WebsiteLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isDark } = useTheme();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isDark
        ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white"
        : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-slate-900"
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 w-full backdrop-blur-md border-b transition-colors ${
        isDark
          ? "border-white/10 bg-white/6"
          : "border-white/20 bg-white/40"
      }`}>
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">Fitway Hub</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "transition-colors",
                  location.pathname === link.path
                    ? "text-emerald-600"
                    : isDark ? "text-slate-600 hover:text-emerald-600" : "text-slate-600 hover:text-emerald-600"
                )}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/app/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:from-emerald-600 hover:to-emerald-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700 disabled:pointer-events-none disabled:opacity-50"
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className={`md:hidden border-t backdrop-blur-md p-4 space-y-4 transition-colors ${
            isDark
              ? "border-white/10 bg-white/6"
              : "border-white/20 bg-white/40"
          }`}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block text-sm font-medium transition-colors ${
                  isDark
                    ? "text-white/80 hover:text-emerald-300"
                    : "text-slate-700 hover:text-emerald-600"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/app/login"
              className="block w-full text-center rounded-md bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white hover:from-emerald-600 hover:to-emerald-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="backdrop-blur-md bg-white/6 border border-white/10 rounded-3xl p-6 shadow-2xl">
          <Outlet />
        </div>
      </main>
      {/* Footer */}
      <footer className="mt-12">
        <div className="container mx-auto px-4">
          <div className="backdrop-blur-md bg-white/6 border border-white/10 rounded-3xl p-8 grid gap-8 md:grid-cols-4 text-slate-50">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-emerald-400">Fitway Hub</h3>
              <p className="text-sm text-white/70">
                Empowering in <span className={`font-semibold mb-4 ${isDark ? "text-white/90" : "text-slate-800"}`}>Quick Links</span>
              </p>
              <ul className={`space-y-2 text-sm ${isDark ? "text-white/70" : "text-slate-600"}`}>
                <li><Link to="/" className={isDark ? "hover:text-emerald-300" : "hover:text-emerald-600"}>Home</Link></li>
                <li><Link to="/about" className={isDark ? "hover:text-emerald-300" : "hover:text-emerald-600"}>About Us</Link></li>
                <li><Link to="/contact" className={isDark ? "hover:text-emerald-300" : "hover:text-emerald-600"}>Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-semibold mb-4 ${isDark ? "text-white/90" : "text-slate-800"}`}>Legal</h4>
              <ul className={`space-y-2 text-sm ${isDark ? "text-white/70" : "text-slate-600"}`}>
                <li><Link to="#" className={isDark ? "hover:text-emerald-300" : "hover:text-emerald-600"}>Privacy Policy</Link></li>
                <li><Link to="#" className={isDark ? "hover:text-emerald-300" : "hover:text-emerald-600"}>Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-semibold mb-4 ${isDark ? "text-white/90" : "text-slate-800"}`}>Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className={isDark ? "text-white/70 hover:text-emerald-300" : "text-slate-600 hover:text-emerald-600"}><Instagram className="h-5 w-5" /></a>
                <a href="#" className={isDark ? "text-white/70 hover:text-emerald-300" : "text-slate-600 hover:text-emerald-600"}><Facebook className="h-5 w-5" /></a>
                <a href="#" className={isDark ? "text-white/70 hover:text-emerald-300" : "text-slate-600 hover:text-emerald-600"}><Twitter className="h-5 w-5" /></a>
                <a href="#" className={isDark ? "text-white/70 hover:text-emerald-300" : "text-slate-600 hover:text-emerald-600"}><Youtube className="h-5 w-5" /></a>
              </div>
            </div>
          </div>

          <div className={`mt-8 text-center text-sm ${isDark ? "text-white/60" : "text-slate-600"}`}>© {new Date().getFullYear()} Fitway Hub. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
