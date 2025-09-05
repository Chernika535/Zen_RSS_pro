import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Copy } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { RssConfig } from "@shared/schema";

export default function RSSConfig() {
  const [checkInterval, setCheckInterval] = useState<string>("30");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config } = useQuery<RssConfig>({
    queryKey: ["/api/rss-config"],
  });

  const updateConfigMutation = useMutation({
    mutationFn: (updates: Partial<RssConfig>) => 
      apiRequest("PATCH", `/api/rss-config/${config?.id}`, updates),
    onSuccess: () => {
      toast({
        title: "Настройки обновлены",
        description: "Конфигурация RSS успешно сохранена",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rss-config"] });
    },
    onError: () => {
      toast({
        title: "Ошибка обновления",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    },
  });

  const handleIntervalChange = (value: string) => {
    setCheckInterval(value);
    if (config) {
      updateConfigMutation.mutate({ checkInterval: value });
    }
  };

  const copyZenFeedUrl = () => {
    const url = `${window.location.origin}/zen-feed.xml`;
    navigator.clipboard.writeText(url);
    toast({
      title: "URL скопирован",
      description: "Ссылка на Zen RSS скопирована в буфер обмена",
    });
  };

  const openSourceUrl = () => {
    if (config?.sourceUrl) {
      window.open(config.sourceUrl, "_blank");
    }
  };

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-muted rounded mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-rss-config">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Источник RSS</CardTitle>
        <p className="text-muted-foreground text-sm">Настройки исходного RSS-фида</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">URL источника</Label>
          <div className="flex gap-2">
            <Input 
              type="url" 
              value={config.sourceUrl}
              className="flex-1 font-mono text-sm"
              readOnly
              data-testid="input-source-url"
            />
            <Button 
              variant="secondary" 
              size="icon"
              onClick={openSourceUrl}
              data-testid="button-open-source"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Интервал проверки</Label>
            <Select value={checkInterval} onValueChange={handleIntervalChange}>
              <SelectTrigger data-testid="select-check-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 минут</SelectItem>
                <SelectItem value="15">15 минут</SelectItem>
                <SelectItem value="30">30 минут</SelectItem>
                <SelectItem value="60">1 час</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Статус</Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-md text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span data-testid="text-config-status">
                {config.isActive ? 'Активен' : 'Неактивен'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Zen RSS URL</Label>
          <div className="flex gap-2">
            <Input 
              type="url" 
              value={`${window.location.origin}/zen-feed.xml`}
              className="flex-1 font-mono text-sm"
              readOnly
              data-testid="input-zen-feed-url"
            />
            <Button 
              variant="default"
              size="icon"
              onClick={copyZenFeedUrl}
              data-testid="button-copy-zen-url"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
