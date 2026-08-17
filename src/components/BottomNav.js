'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Início', icon: '🏠' },
    { href: '/vender', label: 'Vender', icon: '🛒' },
    { href: '/estoque', label: 'Estoque', icon: '📦' },
    { href: '/novo-produto', label: 'Novo', icon: '➕' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-6 flex justify-around items-center z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center font-bold text-xs ${
              isActive ? 'text-[#10b981]' : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
