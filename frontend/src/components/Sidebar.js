'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: '📊' },
  { name: 'Members', path: '/members', icon: '👥' },
  { name: 'Transactions', path: '/transactions', icon: '💸' },
  { name: 'Reports', path: '/reports', icon: '📈' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-brand-navy h-screen sticky top-0 text-white p-4 shadow-2xl">
      <div className="mb-10 px-2">
        <h1 className="text-xl font-bold tracking-tight">Satyashodhak</h1>
        <p className="text-xs text-blue-300 opacity-80 uppercase tracking-widest">Udyojak Portal</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all touch-target ${
                isActive 
                ? 'bg-brand-blue shadow-lg scale-105' 
                : 'hover:bg-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/10 text-xs text-blue-200">
        <p>© 2026 Satyashodhak Society</p>
        <p>V 1.0 (Enterprise)</p>
      </div>
    </aside>
  );
}