import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, RotateCcw, ExternalLink, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Article } from "@shared/schema";

interface ArticlesTableProps {
  onPreviewArticle: (articleId: string) => void;
}

export default function ArticlesTable({ onPreviewArticle }: ArticlesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    refetchInterval: 30000,
  });

  const reprocessMutation = useMutation({
    mutationFn: (articleId: string) => apiRequest("POST", `/api/articles/${articleId}/reprocess`),
    onSuccess: () => {
      toast({
        title: "Статья поставлена в очередь",
        description: "Статья будет переобработана",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
    },
    onError: () => {
      toast({
        title: "Ошибка переобработки",
        description: "Не удалось поставить статью в очередь",
        variant: "destructive",
      });
    },
  });

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (article.author && article.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Обработано</Badge>;
      case "processing":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Обрабатывается</Badge>;
      case "error":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Ошибка</Badge>;
      case "pending":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Ожидание</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-4 bg-muted rounded flex-1"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 bg-muted rounded w-16"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-articles-table">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Последние статьи</CardTitle>
            <p className="text-muted-foreground text-sm">Недавно обработанные материалы</p>
          </div>
          <div className="flex items-center gap-2">
            <Input 
              type="text" 
              placeholder="Поиск статей..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
              data-testid="input-search-articles"
            />
            <Button variant="secondary" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-sm">Статья</th>
                <th className="text-left py-3 px-6 font-medium text-sm">Автор</th>
                <th className="text-left py-3 px-6 font-medium text-sm">Дата</th>
                <th className="text-left py-3 px-6 font-medium text-sm">Статус</th>
                <th className="text-left py-3 px-6 font-medium text-sm">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-6 text-center text-muted-foreground">
                    {searchQuery ? "Статьи не найдены" : "Нет статей для отображения"}
                  </td>
                </tr>
              ) : (
                filteredArticles.slice(0, 10).map((article) => (
                  <tr 
                    key={article.id} 
                    className="hover:bg-muted/50 transition-colors"
                    data-testid={`row-article-${article.id}`}
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-sm" data-testid={`text-article-title-${article.id}`}>
                          {article.title}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1 truncate max-w-md">
                          {article.description}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm">{article.author}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(article.pubDate)}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(article.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onPreviewArticle(article.id)}
                          data-testid={`button-preview-${article.id}`}
                          title="Предварительный просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => reprocessMutation.mutate(article.id)}
                          disabled={article.status === "processing" || reprocessMutation.isPending}
                          data-testid={`button-reprocess-${article.id}`}
                          title="Переобработать"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => window.open(article.link, "_blank")}
                          data-testid={`button-open-source-${article.id}`}
                          title="Открыть источник"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {filteredArticles.length > 0 && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Показано {Math.min(filteredArticles.length, 10)} из {filteredArticles.length} статей
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Назад
                </Button>
                <Button variant="outline" size="sm" disabled={filteredArticles.length <= 10}>
                  Вперед
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
