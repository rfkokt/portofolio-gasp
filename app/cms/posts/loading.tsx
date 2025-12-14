import { Loader2 } from "lucide-react";

export default function PostsLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
      <p className="text-muted-foreground text-sm">Loading posts...</p>
    </div>
  );
}
