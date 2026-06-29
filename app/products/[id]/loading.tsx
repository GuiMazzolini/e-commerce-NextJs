import { Skeleton } from "../../components/Skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-8 flex items-center justify-center">
              <Skeleton className="w-full max-w-md aspect-square rounded-xl" />
            </div>
            <div className="lg:w-1/2 p-8 lg:p-12 space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-10 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-14 flex-1 rounded-lg" />
                <Skeleton className="h-14 flex-1 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
