import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ProductsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with button */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table skeleton */}
      <Card>
        <div className="p-1">
          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 p-4 border-b">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>

          {/* Table rows */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
