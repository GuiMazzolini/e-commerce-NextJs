import { Skeleton } from "../components/Skeleton";

export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Skeleton className="h-10 w-56 mb-2" />
        <Skeleton className="h-5 w-80 mb-8" />

        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="flex justify-between gap-4 border-b border-gray-100 px-6 py-4 bg-gray-50">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-24" />
              </div>
              <div className="px-6 py-5 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-16 w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
