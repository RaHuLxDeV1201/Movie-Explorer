export default function SkeletonCard() {
  return (
    // Main card container. We use 'animate-pulse' here to give it that standard loading shimmer effect.
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col justify-between animate-pulse h-[450px]">

      {/* Top section holding the image and text blocks */}
      <div>
        {/* Placeholder for the main thumbnail/image */}
        <div className="w-full h-72 bg-slate-700 rounded-lg mb-4"></div>

        {/* Fake title - made it 3/4 width so it looks natural */}
        <div className="h-6 bg-slate-700 rounded-md mb-2 w-3/4"></div>

        {/* Fake subtitle or maybe an author name / date */}
        <div className="h-4 bg-slate-700 rounded-md mb-3 w-1/2"></div>

        {/* A few lines simulating a description paragraph */}
        <div className="space-y-2">
          <div className="h-3 bg-slate-700 rounded-md w-full"></div>
          <div className="h-3 bg-slate-700 rounded-md w-full"></div>
          {/* Last line is a bit shorter to look like real wrapping text */}
          <div className="h-3 bg-slate-700 rounded-md w-5/6"></div>
        </div>
      </div>

      {/* Footer section separated by a top border */}
      <div className="flex justify-between items-center border-t border-slate-700 pt-3 mt-4">
        {/* Fake buttons, tags, or stats at the bottom */}
        <div className="h-4 bg-slate-700 rounded-md w-12"></div>
        <div className="h-4 bg-slate-700 rounded-md w-12"></div>
      </div>

    </div>
  );
}