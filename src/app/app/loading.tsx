import { PageLoader } from "@/components/loaders";

export default function AppLoading() {
  return (
    <div>
      <div className="px-5 pt-16">
        <PageLoader label="Loading your rewards…" />
      </div>
    </div>
  );
}
