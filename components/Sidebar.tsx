
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { id: 'orders', icon: 'fa-list-check', label: 'Orders' },
    { id: 'holdings', icon: 'fa-suitcase', label: 'Holdings' },
    { id: 'positions', icon: 'fa-arrows-left-right', label: 'Positions' },
    { id: 'funds', icon: 'fa-wallet', label: 'Funds' },
  ];

  return (
    <div className="w-16 md:w-64 bg-white border-r border-slate-200 flex flex-col h-full transition-all">
      <div className="p-4 flex items-center gap-3 border-b border-slate-100">
        <div className="bg-blue-600 text-white p-2 rounded-lg">
          <i className="fa-solid fa-bolt text-xl"></i>
        </div>
        <span className="text-xl font-bold hidden md:block text-slate-800 tracking-tight">BharatTrade</span>
      </div>
      
      <nav className="flex-1 mt-4 px-2 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id
                ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-lg w-6`}></i>
            <span className="font-medium hidden md:block">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="hidden md:block bg-slate-50 p-3 rounded-xl">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Account</div>
          <div className="text-sm font-semibold text-slate-800">Demo User</div>
          <div className="text-xs text-slate-500">Free Tier</div>
        </div>
        <button className="w-full mt-4 flex items-center gap-4 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-all">
          <i className="fa-solid fa-right-from-bracket text-lg w-6"></i>
          <span className="font-medium hidden md:block">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
