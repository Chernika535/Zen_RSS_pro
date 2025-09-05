import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Sidebar from "@/components/sidebar";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function LogsPage() {
  // Mock logs - в реальном приложении эти данные пришли бы с сервера
  const mockLogs: LogEntry[] = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'RSS синхронизация запущена',
      details: 'Источник: https://neiromantra.ru/12583-feed.xml'
    },
    {
      timestamp: new Date(Date.now() - 5000).toISOString(),
      level: 'info',
      message: 'Статья обработана успешно',
      details: 'Заголовок: "15 секретов управления временем"'
    },
    {
      timestamp: new Date(Date.now() - 15000).toISOString(),
      level: 'warning',
      message: 'Изображение недоступно',
      details: 'URL: https://example.com/image.jpg'
    },
    {
      timestamp: new Date(Date.now() - 30000).toISOString(),
      level: 'error',
      message: 'Ошибка валидации контента',
      details: 'Статья слишком короткая для Zen требований'
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'info',
      message: 'Zen RSS feed сгенерирован',
      details: 'Включено 5 статей'
    }
  ];

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Warning</Badge>;
      case 'info':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Info</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Логи системы</h2>
              <p className="text-muted-foreground">Мониторинг активности и ошибок</p>
            </div>
            <RefreshCw className="w-5 h-5 text-muted-foreground" />
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Последние события</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 p-6">
                  {mockLogs.map((log, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-4 p-4 border border-border rounded-lg"
                    >
                      <div className="mt-0.5">
                        {getLogIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">{log.message}</span>
                          {getLogBadge(log.level)}
                        </div>
                        {log.details && (
                          <p className="text-muted-foreground text-xs mb-2">
                            {log.details}
                          </p>
                        )}
                        <p className="text-muted-foreground text-xs">
                          {formatTime(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}