import PocketBase from "pocketbase";
import { FileText, FolderOpen, Eye, Clock } from "lucide-react";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-auth";

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.rdev.cloud");

async function authenticatePB() {
  const email = process.env.PB_ADMIN_EMAIL;
  const pass = process.env.PB_ADMIN_PASS;
  if (email && pass) {
    await pb.admins.authWithPassword(email, pass);
  }
}

async function getStats(username: string, isAdmin: boolean) {
  try {
    await authenticatePB();
    
    // Role-based filter
    const userFilter = isAdmin ? '' : `created_by = "${username}"`;

    const [posts, projects] = await Promise.all([
      pb.collection("posts").getList(1, 1, { filter: userFilter || undefined, fields: "id,published" }),
      pb.collection("projects").getList(1, 1, { filter: userFilter || undefined, fields: "id" }),
    ]);

    // Get draft count
    const draftsFilter = userFilter 
      ? `published = false && ${userFilter}`
      : "published = false";
    const drafts = await pb.collection("posts").getList(1, 1, {
      filter: draftsFilter,
      fields: "id",
    });

    return {
      totalPosts: posts.totalItems,
      totalDrafts: drafts.totalItems,
      totalProjects: projects.totalItems,
    };
  } catch {
    return {
      totalPosts: 0,
      totalDrafts: 0,
      totalProjects: 0,
    };
  }
}

export default async function CMSDashboard() {
  const session = await getAdminSession();
  const isAdmin = session?.role === 'admin';
  const stats = await getStats(session?.username || '', isAdmin);

  const statCards = [
    {
      title: "Total Posts",
      value: stats.totalPosts,
      icon: FileText,
      href: "/cms/posts",
      color: "text-blue-500",
    },
    {
      title: "Drafts",
      value: stats.totalDrafts,
      icon: Clock,
      href: "/cms/posts?filter=drafts",
      color: "text-yellow-500",
    },
    {
      title: "Projects",
      value: stats.totalProjects,
      icon: FolderOpen,
      href: "/cms/projects",
      color: "text-green-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your content from here.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="border border-border p-6 hover:border-foreground/20 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <card.icon className={`w-8 h-8 ${card.color}`} />
              <span className="text-4xl font-bold text-foreground">
                {card.value}
              </span>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
              {card.title}
            </h3>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/cms/posts/new"
            className="px-6 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors"
          >
            New Blog Post
          </Link>
          <Link
            href="/cms/projects/new"
            className="px-6 py-3 border border-foreground text-foreground font-bold text-sm uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
          >
            New Project
          </Link>
          <Link
            href="/"
            target="_blank"
            className="px-6 py-3 border border-border text-muted-foreground font-bold text-sm uppercase tracking-wider hover:border-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Site
          </Link>
        </div>
      </div>
    </div>
  );
}
