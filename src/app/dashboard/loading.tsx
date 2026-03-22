export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Шапка */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-200 rounded-lg" />
          <div className="h-4 w-20 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-xl" />
      </div>

      {/* Карточки сайтов */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3">
            <div className="w-full h-36 bg-gray-200 rounded-xl" />
            <div className="h-5 w-3/4 bg-gray-200 rounded-lg" />
            <div className="h-4 w-1/2 bg-gray-100 rounded-lg" />
            <div className="h-4 w-1/3 bg-gray-100 rounded-lg" />
            <div className="flex gap-2 pt-2">
              <div className="h-8 flex-1 bg-gray-200 rounded-xl" />
              <div className="h-8 flex-1 bg-gray-100 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
