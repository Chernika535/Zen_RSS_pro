import { Rss, BarChart3, FileText, Settings, Activity } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();
  
  const isActive = (path: string) => location === path;
  
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Rss className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">RSS to Zen</h1>
            <p className="text-muted-foreground text-sm">Bridge Service</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/" 
              className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                isActive("/") ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              data-testid="nav-dashboard"
            >
              <BarChart3 className="w-5 h-5" />
              Панель управления
            </Link>
          </li>
          <li>
            <Link 
              href="/articles" 
              className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                isActive("/articles") ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              data-testid="nav-articles"
            >
              <FileText className="w-5 h-5" />
              Статьи
            </Link>
          </li>
          <li>
            <Link 
              href="/config" 
              className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                isActive("/config") ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              data-testid="nav-config"
            >
              <Settings className="w-5 h-5" />
              Настройки
            </Link>
          </li>
          <li>
            <Link 
              href="/logs" 
              className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                isActive("/logs") ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              data-testid="nav-logs"
            >
              <Activity className="w-5 h-5" />
              Логи
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full status-indicator"></div>
            <span className="text-sm font-medium">Сервис активен</span>
          </div>
          <p className="text-xs text-muted-foreground">Последнее обновление: 2 мин назад</p>
        </div>
      </div>
    </aside>
  );
}
