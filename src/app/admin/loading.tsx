import { PageLoader, CardSkeletonGrid } from "@/components/loaders";
import { Card } from "@/components/ui";

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="skeleton mb-6 h-8 w-56 rounded-lg" />
      <CardSkeletonGrid count={4} />
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="h-72 lg:col-span-2"><PageLoader label="Loading analytics…" /></Card>
        <Card className="h-72"><PageLoader /></Card>
      </div>
    </div>
  );
}
