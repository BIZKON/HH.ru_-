export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-96 bg-muted animate-pulse rounded" />
          <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}
