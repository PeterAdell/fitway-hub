import { Users, Dumbbell, DollarSign, Activity } from "lucide-react";
import { StatCard } from "@/components/app/StatCard";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value="1,234" unit="" icon={Users} color="blue" trend="+5% this week" />
        <StatCard title="Active Programs" value="12" unit="" icon={Dumbbell} color="emerald" />
        <StatCard title="Revenue" value="$12,450" unit="" icon={DollarSign} color="amber" trend="+12% vs last month" />
        <StatCard title="App Usage" value="85%" unit="" icon={Activity} color="rose" />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Signups</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                    U{i}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">User {i}</p>
                    <p className="text-xs text-slate-500">user{i}@example.com</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">2h ago</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Server Uptime</span>
              <span className="text-emerald-600 font-medium">99.9%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Database Load</span>
              <span className="text-blue-600 font-medium">12%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Storage Usage</span>
              <span className="text-amber-600 font-medium">45%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
