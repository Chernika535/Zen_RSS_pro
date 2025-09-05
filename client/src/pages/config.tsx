import RSSConfig from "@/components/rss-config";
import Sidebar from "@/components/sidebar";

export default function ConfigPage() {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border p-6">
          <div>
            <h2 className="text-2xl font-bold">Настройки</h2>
            <p className="text-muted-foreground">Конфигурация RSS источника и Zen параметров</p>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl">
            <RSSConfig />
          </div>
        </div>
      </main>
    </div>
  );
}