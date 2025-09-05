import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Stats {
  totalArticles: number;
  processedArticles: number;
  zenCompliantArticles: number;
  errorCount: number;
  lastUpdated: string | null;
}

export default function StatsCards() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const successRate = stats ? 
    Math.round((stats.processedArticles / Math.max(stats.totalArticles, 1)) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card data-testid="card-total-articles">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Всего статей</p>
              <p className="text-3xl font-bold" data-testid="text-total-articles">
                {stats?.totalArticles || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-500 text-xl" />
            </div>
          </div>
          <p className="text-green-500 text-sm mt-2">
            <span className="inline-block mr-1">↑</span>
            Обновлено
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-processed-articles">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Обработано</p>
              <p className="text-3xl font-bold" data-testid="text-processed-articles">
                {stats?.processedArticles || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-500 text-xl" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            {successRate}% успешно
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-error-count">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Ошибки</p>
              <p className="text-3xl font-bold text-destructive" data-testid="text-error-count">
                {stats?.errorCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-500 text-xl" />
            </div>
          </div>
          <p className="text-destructive text-sm mt-2">
            {stats?.errorCount === 0 ? 'Отлично' : 'Требует внимания'}
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-zen-compliant">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Zen-совместимо</p>
              <p className="text-3xl font-bold" data-testid="text-zen-compliant">
                {stats?.zenCompliantArticles || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Clock className="text-purple-500 text-xl" />
            </div>
          </div>
          <p className="text-green-500 text-sm mt-2">Готово к публикации</p>
        </CardContent>
      </Card>
    </div>
  );
}
