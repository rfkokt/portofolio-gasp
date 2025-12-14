"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, FolderOpen } from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/cms", icon: LayoutDashboard },
  { name: "Blog Posts", path: "/cms/posts", icon: FileText },
  { name: "Projects", path: "/cms/projects", icon: FolderOpen },
];

export function CMSSidebar({ username }: { username: string }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/cms") {
      return pathname === "/cms";
    }
    return pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/cms" className="text-xl font-bold text-foreground tracking-tight">
          RDEV CMS
        </Link>
        <p className="text-xs text-muted-foreground mt-1">
          Welcome, {username}
        </p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
