import { Moon, Sun, Bell } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';

export default function Header() {
  const { theme, toggleTheme } = useUiStore();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div>
        {/* 검색 또는 브레드크럼 자리 */}
      </div>

      <div className="flex items-center gap-2">
        {/* 알림 */}
        <button className="p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* 테마 토글 */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>
    </header>
  );
}
