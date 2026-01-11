import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Workflow,
  History,
  Plug,
  Clock,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { to: '/workflows', icon: Workflow, label: '워크플로우' },
  { to: '/executions', icon: History, label: '실행 이력' },
  { to: '/triggers', icon: Clock, label: '트리거' },
  { to: '/connectors', icon: Plug, label: '커넥터' },
  { to: '/settings', icon: Settings, label: '설정' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* 로고 */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Workflow className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">UrbanFlow</span>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* 하단 정보 */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          UrbanFlow v1.0.0
        </div>
      </div>
    </aside>
  );
}
