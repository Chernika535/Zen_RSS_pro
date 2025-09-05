import ArticlesTable from "@/components/articles-table";
import ArticlePreviewModal from "@/components/article-preview-modal";
import Sidebar from "@/components/sidebar";
import { useState } from "react";

export default function ArticlesPage() {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border p-6">
          <div>
            <h2 className="text-2xl font-bold">Статьи</h2>
            <p className="text-muted-foreground">Управление обработанными статьями</p>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
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