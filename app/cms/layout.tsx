import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { logoutAdmin } from "@/actions/admin";
import { LogOut } from "lucide-react";
import { CMSSidebar } from "@/components/admin/CMSSidebar";

export default async function CMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row pt-20">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex w-64 bg-background border-r border-border flex-col shrink-0">
        <CMSSidebar username={session.username} />
        
        <div className="p-4 border-t border-border mt-auto">
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
        <span className="font-bold text-foreground">RDEV CMS</span>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="text-xs font-medium text-muted-foreground hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </form>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex gap-2 p-4 border-b border-border overflow-x-auto">
        <a href="/cms" className="px-4 py-2 text-xs font-medium bg-foreground/5 rounded whitespace-nowrap">
          Dashboard
        </a>
        <a href="/cms/posts" className="px-4 py-2 text-xs font-medium bg-foreground/5 rounded whitespace-nowrap">
          Blog Posts
        </a>
        <a href="/cms/projects" className="px-4 py-2 text-xs font-medium bg-foreground/5 rounded whitespace-nowrap">
          Projects
        </a>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}


