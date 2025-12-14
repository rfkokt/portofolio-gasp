"use client";

import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  id: string;
  onDelete: (formData: FormData) => Promise<void>;
}

export function DeleteButton({ id, onDelete }: DeleteButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      e.preventDefault();
    }
  };

  return (
    <form action={onDelete}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
        onClick={handleClick}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </form>
  );
}
