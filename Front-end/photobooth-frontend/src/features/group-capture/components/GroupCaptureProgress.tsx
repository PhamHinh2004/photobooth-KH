const steps = ['Cấu hình phòng', 'Kích thước frame', 'Style frame', 'Phòng chờ', 'Chụp nhóm', 'Kết quả'];

interface GroupCaptureProgressProps {
  activeStep: number;
}

export default function GroupCaptureProgress({ activeStep }: GroupCaptureProgressProps) {
  return (
    <nav aria-label="Tiến trình chụp nhóm" className="mb-6 overflow-x-auto rounded-2xl border border-white/80 bg-white/65 p-3 shadow-sm backdrop-blur md:p-4">
      <ol className="flex min-w-[680px] items-center gap-2 md:grid md:min-w-0 md:grid-cols-6">
        {steps.map((step, index) => (
          <li
            key={step}
            aria-current={index === activeStep ? 'step' : undefined}
            className={`flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-xs ${index === activeStep ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${index === activeStep ? 'bg-fuchsia-600 text-white' : index < activeStep ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 truncate font-medium">{step}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}