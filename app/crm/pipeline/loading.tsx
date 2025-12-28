export default function PipelineLoading() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Загрузка воронки найма...</p>
        </div>
      </div>
    </div>
  )
}
