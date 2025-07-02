import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ChatbotDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="bg-white p-6 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Content Skeleton */}
        <Card>
          <div className="p-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      </div>
    </div>
  );
}
