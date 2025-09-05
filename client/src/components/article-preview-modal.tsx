import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Edit, RotateCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@shared/schema";

interface ArticlePreviewModalProps {
  articleId: string | null;
  onClose: () => void;
}

export default function ArticlePreviewModal({ articleId, onClose }: ArticlePreviewModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: article, isLoading } = useQuery<Article>({
    queryKey: ["/api/articles", articleId],
    enabled: !!articleId,
  });

  const reprocessMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/articles/${articleId}/reprocess`),
    onSuccess: () => {
      toast({
        title: "Статья поставлена в очередь",
        description: "Статья будет переобработана",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Ошибка переобработки",
        description: "Не удалось поставить статью в очередь",
        variant: "destructive",
      });
    },
  });

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

  const calculateContentSize = (content: string) => {
    const sizeInBytes = new Blob([content]).size;
    return sizeInBytes > 1024 ? `${Math.round(sizeInBytes / 1024)}KB` : `${sizeInBytes}B`;
  };

  return (
    <Dialog open={!!articleId} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="modal-article-preview">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg">Предварительный просмотр</DialogTitle>
              <p className="text-muted-foreground text-sm">Как статья будет выглядеть в Zen RSS</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-modal">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ) : article ? (
          <>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose prose-invert max-w-none">
                <div className="mb-4">
                  <h1 className="text-2xl font-bold mb-2" data-testid="text-preview-title">
                    {article.title}
                  </h1>
                  <div className="flex items-center gap-4 text-muted-foreground text-sm mb-4">
                    <span>Автор: {article.author}</span>
                    <span>{formatDate(article.pubDate)}</span>
                    {getStatusBadge(article.status)}
                  </div>
                  {article.category && article.category.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-muted-foreground">Категории:</span>
                      {article.category.map((cat, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                {article.description && (
                  <p className="text-muted-foreground mb-4 italic">
                    {article.description}
                  </p>
                )}
                
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                  data-testid="content-preview"
                />
              </div>
            </div>

            <div className="p-6 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <p data-testid="text-content-stats">
                    Размер: {calculateContentSize(article.content)} | 
                    Изображений: {article.images?.length || 0} | 
                    Zen-совместимо: {article.zenCompliant ? 'Да' : 'Нет'}
                  </p>
                  {article.errorMessage && (
                    <p className="text-destructive mt-1">Ошибка: {article.errorMessage}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" data-testid="button-edit-article">
                    <Edit className="w-4 h-4 mr-2" />
                    Редактировать
                  </Button>
                  <Button 
                    onClick={() => reprocessMutation.mutate()}
                    disabled={reprocessMutation.isPending}
                    data-testid="button-reprocess-article"
                  >
                    <RotateCcw className={`w-4 h-4 mr-2 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
                    {reprocessMutation.isPending ? 'Обработка...' : 'Переобработать'}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 p-6 text-center text-muted-foreground">
            Статья не найдена
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
