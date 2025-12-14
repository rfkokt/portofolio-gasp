"use client";

import { useState, useEffect } from "react";
import { getAdmins, createAdmin, deleteAdmin, getAdminById, updateAdminPassword, updateAdminUsername, updateAdminRole } from "@/actions/cms-settings";
import { getAdminLogs } from "@/actions/admin-logs";
import { useConfirm } from "@/components/admin/ConfirmModal";
import { Loader2, Check, AlertCircle, UserPlus, Trash2, Edit, Eye, X, Clock, Shield, User } from "lucide-react";

interface Admin {
  id: string;
  username: string;
  role?: 'admin' | 'user';
  created?: string;
  updated?: string;
}

interface Log {
  id: string;
  admin_id: string;
  admin_username: string;
  action: string;
  details: string;
  created: string;
}

// Helper to format dates safely
function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // View modal
  const [viewAdmin, setViewAdmin] = useState<Admin | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewLogs, setViewLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Edit modal
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setAdminsLoading(true);
    const result = await getAdmins();
    if (result.success) {
      setAdmins(result.admins || []);
    }
    setAdminsLoading(false);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newAdminPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setCreateLoading(true);

    try {
      const result = await createAdmin(newUsername, newAdminPassword, newRole);
      if (result.success) {
        setSuccess(`Admin "${newUsername}" created successfully as ${newRole}`);
        setNewUsername("");
        setNewAdminPassword("");
        setNewRole('user');
        loadAdmins();
      } else {
        setError(result.error || "Failed to create admin");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setCreateLoading(false);
    }
  };

  const confirm = useConfirm();

  const handleDeleteAdmin = async (admin: Admin) => {
    const confirmed = await confirm({
      title: "Delete Admin",
      message: `Are you sure you want to delete admin "${admin.username}"?`,
      confirmText: "Delete",
      type: "danger",
    });
    
    if (!confirmed) return;

    setError("");
    setSuccess("");

    const result = await deleteAdmin(admin.id);
    if (result.success) {
      setSuccess(`Admin "${admin.username}" deleted`);
      loadAdmins();
    } else {
      setError(result.error || "Failed to delete admin");
    }
  };

  const handleView = async (admin: Admin) => {
    setViewLoading(true);
    setLogsLoading(true);
    
    const result = await getAdminById(admin.id);
    if (result.success && result.admin) {
      setViewAdmin(result.admin);
    }
    setViewLoading(false);

    // Load logs for this admin
    const logsResult = await getAdminLogs(admin.id, 20);
    if (logsResult.success) {
      setViewLogs(logsResult.logs || []);
    }
    setLogsLoading(false);
  };

  const handleEdit = (admin: Admin) => {
    setEditAdmin(admin);
    setEditUsername(admin.username);
    setEditPassword("");
    setEditRole(admin.role || 'user');
  };

  const handleSaveEdit = async () => {
    if (!editAdmin) return;
    setEditLoading(true);
    setError("");

    try {
      // Update username if changed
      if (editUsername !== editAdmin.username) {
        const result = await updateAdminUsername(editAdmin.id, editUsername);
        if (!result.success) {
          setError(result.error || "Failed to update username");
          setEditLoading(false);
          return;
        }
      }

      // Update password if provided
      if (editPassword) {
        if (editPassword.length < 6) {
          setError("Password must be at least 6 characters");
          setEditLoading(false);
          return;
        }
        const result = await updateAdminPassword(editAdmin.id, editPassword);
        if (!result.success) {
          setError(result.error || "Failed to update password");
          setEditLoading(false);
          return;
        }
      }

      // Update role if changed
      if (editRole !== (editAdmin.role || 'user')) {
        const result = await updateAdminRole(editAdmin.id, editRole);
        if (!result.success) {
          setError(result.error || "Failed to update role");
          setEditLoading(false);
          return;
        }
      }

      setSuccess(`Admin "${editUsername}" updated successfully`);
      setEditAdmin(null);
      loadAdmins();
    } catch {
      setError("An error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  const closeViewModal = () => {
    setViewAdmin(null);
    setViewLogs([]);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Admin Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage CMS administrators
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {success}
          <button onClick={() => setSuccess("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Create New Admin */}
      <div className="border border-border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-bold text-foreground">Add New Admin</h2>
        </div>
        <form onSubmit={handleCreateAdmin} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="flex-1 bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
            placeholder="Username"
            required
          />
          <input
            type="password"
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
            className="flex-1 bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
            placeholder="Password (min 6 characters)"
            required
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
            className="bg-transparent border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
          >
            <option value="user" className="bg-background">User</option>
            <option value="admin" className="bg-background">Admin</option>
          </select>
          <button
            type="submit"
            disabled={createLoading}
            className="px-6 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider hover:bg-foreground/90 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Add Admin
          </button>
        </form>
      </div>

      {/* Admin Table */}
      <div className="border border-border overflow-hidden">
        {adminsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No admins found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="border-b border-border last:border-0 hover:bg-foreground/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground">{admin.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={async () => {
                        const newRole = admin.role === 'admin' ? 'user' : 'admin';
                        const result = await updateAdminRole(admin.id, newRole);
                        if (result.success) {
                          loadAdmins();
                          setSuccess(`Changed ${admin.username} role to ${newRole}`);
                        } else {
                          setError(result.error || 'Failed to update role');
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                        admin.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30'
                          : 'bg-foreground/10 text-muted-foreground hover:bg-foreground/20'
                      }`}
                      title={`Click to change to ${admin.role === 'admin' ? 'user' : 'admin'}`}
                    >
                      {admin.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {admin.role || 'user'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(admin)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(admin)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin)}
                        className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Modal with Activity Logs */}
      {viewAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeViewModal}>
          <div className="bg-background border border-border p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Admin Details</h2>
              <button onClick={closeViewModal} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Admin Info */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Username</label>
                <p className="text-foreground">{viewAdmin.username}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Created</label>
                <p className="text-foreground">{formatDate(viewAdmin.created)}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Updated</label>
                <p className="text-foreground">{formatDate(viewAdmin.updated)}</p>
              </div>
            </div>

            {/* Activity Logs */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Activity Log</h3>
              </div>
              
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : viewLogs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity recorded yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {viewLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm border-b border-border pb-3 last:border-0">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-foreground/30 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{log.action}</p>
                        {log.details && <p className="text-muted-foreground text-xs">{log.details}</p>}
                        <p className="text-muted-foreground text-xs mt-1">
                          {formatDate(log.created)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditAdmin(null)}>
          <div className="bg-background border border-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Edit Admin</h2>
              <button onClick={() => setEditAdmin(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-transparent border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">New Password (leave blank to keep)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')}
                  className="w-full bg-transparent border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                >
                  <option value="user" className="bg-background">User</option>
                  <option value="admin" className="bg-background">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditAdmin(null)}
                  className="flex-1 px-4 py-3 border border-border font-bold text-sm uppercase tracking-wider hover:bg-foreground/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="flex-1 px-4 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider hover:bg-foreground/90 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


