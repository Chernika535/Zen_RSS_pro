import { useState } from "react";
import Sidebar from "@/components/sidebar";
import StatsCards from "@/components/stats-cards";
import RSSConfig from "@/components/rss-config";
import ProcessingStatus from "@/components/processing-status";
import ArticlesTable from "@/components/articles-table";
import ArticlePreviewModal from "@/components/article-preview-modal";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/sync"),
    onSuccess: () => {
      toast({
        title: "Синхронизация запущена",
        description: "RSS фид обрабатывается в фоновом режиме",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Ошибка синхронизации",
        description: "Не удалось запустить синхронизацию RSS",
        variant: "destructive",
      });
    },
  });

  const handleExportRSS = () => {
    window.open("/zen-feed.xml", "_blank");
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Панель управления</h2>
              <p className="text-muted-foreground">Мониторинг RSS обработки для Yandex Zen</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-sync"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                {syncMutation.isPending ? 'Синхронизация...' : 'Синхронизировать'}
              </Button>
              <Button
                onClick={handleExportRSS}
                variant="secondary"
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Экспорт RSS
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 overflow-auto">
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <RSSConfig />
            </div>
            <ProcessingStatus />
          </div>

          <ArticlesTable onPreviewArticle={setSelectedArticleId} />
        </div>
      </main>

      <ArticlePreviewModal
        articleId={selectedArticleId}
        onClose={() => setSelectedArticleId(null)}
      />
    </div>
  );
}
