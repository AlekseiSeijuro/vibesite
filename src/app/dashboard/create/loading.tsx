export default function CreateLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      {/* Заголовок */}
      <div className="mb-8 space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-24 bg-gray-100 rounded-lg" />
      </div>

      {/* Прогресс-бар */}
      <div className="flex items-center gap-1 mb-10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            {i < 6 && <div className="flex-1 h-0.5 mx-1 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Контент карточки */}
      <div className="card space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
