import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ProcessingStatus {
  isProcessing: boolean;
  currentStep: string;
  progress: number;
  recentArticles: Array<{
    id: string;
    title: string;
    status: string;
    processedAt: string | null;
  }>;
}

export default function ProcessingStatus() {
  const { data: status } = useQuery<ProcessingStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getStepIcon = (step: string, isActive: boolean) => {
    if (isActive && step === "processing") {
      return <Loader2 className="w-4 h-4 text-white animate-spin" />;
    }
    if (step === "completed") {
      return <CheckCircle className="w-4 h-4 text-white" />;
    }
    return <Clock className="w-4 h-4 text-background" />;
  };

  const getStepStatus = (step: string) => {
    if (!status) return "pending";
    
    switch (step) {
      case "fetch":
        return status.isProcessing || status.currentStep !== "idle" ? "completed" : "pending";
      case "process":
        return status.isProcessing ? "active" : status.currentStep !== "idle" ? "completed" : "pending";
      case "generate":
        return !status.isProcessing && status.currentStep !== "idle" ? "completed" : "pending";
      default:
        return "pending";
    }
  };

  const calculateProgress = () => {
    if (!status) return 0;
    if (status.isProcessing) return 60;
    if (status.currentStep !== "idle") return 100;
    return 0;
  };

  return (
    <Card data-testid="card-processing-status">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Статус обработки</CardTitle>
        <p className="text-muted-foreground text-sm">Текущее состояние</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-3 bg-muted rounded-lg ${
            getStepStatus("fetch") === "completed" ? "opacity-100" : "opacity-50"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              getStepStatus("fetch") === "completed" ? "bg-green-500" : "bg-muted-foreground"
            }`}>
              {getStepIcon("fetch", getStepStatus("fetch") === "active")}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">RSS получен</p>
              <p className="text-xs text-muted-foreground" data-testid="text-fetch-time">
                {status?.recentArticles?.[0] ? "Недавно" : "Ожидание"}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3 bg-muted rounded-lg ${
            getStepStatus("process") === "active" || getStepStatus("process") === "completed" ? "opacity-100" : "opacity-50"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              getStepStatus("process") === "active" ? "bg-blue-500" : 
              getStepStatus("process") === "completed" ? "bg-green-500" : "bg-muted-foreground"
            }`}>
              {getStepIcon("process", getStepStatus("process") === "active")}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Обработка статей</p>
              <p className="text-xs text-muted-foreground" data-testid="text-process-status">
                {status?.isProcessing ? "В процессе" : "Готово"}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3 bg-muted rounded-lg ${
            getStepStatus("generate") === "completed" ? "opacity-100" : "opacity-50"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              getStepStatus("generate") === "completed" ? "bg-green-500" : "bg-muted-foreground"
            }`}>
              {getStepIcon("generate", getStepStatus("generate") === "active")}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Создание Zen RSS</p>
              <p className="text-xs text-muted-foreground" data-testid="text-generate-status">
                {getStepStatus("generate") === "completed" ? "Готов" : "Ожидание"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Прогресс</span>
            <span data-testid="text-progress-percent">{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
