export default function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col justify-between animate-pulse h-[450px]">
      <div>
        <div className="w-full h-72 bg-slate-700 rounded-lg mb-4"></div>
        <div className="h-6 bg-slate-700 rounded-md mb-2 w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded-md mb-3 w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-700 rounded-md w-full"></div>
          <div className="h-3 bg-slate-700 rounded-md w-full"></div>
          <div className="h-3 bg-slate-700 rounded-md w-5/6"></div>
        </div>
      </div>
      <div className="flex justify-between items-center border-t border-slate-700 pt-3 mt-4">
        <div className="h-4 bg-slate-700 rounded-md w-12"></div>
        <div className="h-4 bg-slate-700 rounded-md w-12"></div>
      </div>
    </div>
  );
}