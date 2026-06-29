import { Skeleton } from "../components/Skeleton";

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
