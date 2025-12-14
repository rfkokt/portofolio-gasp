"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useConfirm } from "./ConfirmModal";

interface DeleteButtonProps {
  id: string;
  onDelete: (formData: FormData) => Promise<void>;
  itemName?: string;
}

export function DeleteButton({ id, onDelete, itemName }: DeleteButtonProps) {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    const confirmed = await confirm({
      title: "Hapus Item",
      message: itemName 
        ? `Apakah kamu yakin ingin menghapus "${itemName}"? Tindakan ini tidak dapat dibatalkan.`
        : "Apakah kamu yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("id", id);
      await onDelete(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="p-2 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
