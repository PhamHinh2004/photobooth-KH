interface ReviewScreenProps {
  photos: string[]
  onRetake: () => void
  onNext: () => void
}

export default function ReviewScreen({ photos, onRetake, onNext }: ReviewScreenProps) {
  return (
    <div className="w-full max-w-5xl mx-auto animate-fadeIn flex flex-col items-center">
      <div className="text-center mb-8 bg-white/5 rounded-3xl py-4 px-8 border border-white/10 shadow-sm inline-block">
        <h2 className="text-xl font-bold text-pink-400 mb-1">
          Bước 4: Review Ảnh & Chụp Lại
        </h2>
        <p className="text-white/60 text-sm">
          Kiểm tra lại những bức ảnh tuyệt đẹp của bạn nhé!
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-3xl mb-10 bg-black/20 p-6 rounded-3xl border border-white/10">
        {photos.map((photo, i) => (
          <div
            key={i}
            className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white/20 shadow-md group relative bg-black/50"
          >
            <img 
              src={photo} 
              alt={`Shot ${i + 1}`} 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 bg-white/90 text-slate-800 font-bold text-xs px-3 py-1 rounded-full shadow-lg">
              Ảnh {i + 1}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6 w-full max-w-3xl justify-between px-4">
        <button
          onClick={onRetake}
          className="px-8 py-3 rounded-full bg-white text-slate-800 font-bold hover:bg-slate-200 transition-all shadow-md flex items-center gap-2"
        >
          🔄 Chụp Lại (Retake)
        </button>
        <button
          onClick={onNext}
          className="px-10 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          Tiếp Tục ➡️
        </button>
      </div>
    </div>
  )
}
