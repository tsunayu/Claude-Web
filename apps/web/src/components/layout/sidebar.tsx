'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Database,
  Bell,
  FileText,
  History,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';

const navigation = [
  {
    name: 'ダッシュボード',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'データソース',
    href: '/dashboard/sources',
    icon: Database,
  },
  {
    name: '通知ルール',
    href: '/dashboard/rules',
    icon: Bell,
  },
  {
    name: '収集データ',
    href: '/dashboard/data',
    icon: FileText,
  },
  {
    name: '通知履歴',
    href: '/dashboard/history',
    icon: History,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">IAH</h1>
      </div>

      {/* User info */}
      <div className="border-b p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.username}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {user?.subscriptionTier}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t p-4 space-y-2">
        <Link href="/dashboard/settings">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            設定
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start text-destructive" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </div>
  );
}
