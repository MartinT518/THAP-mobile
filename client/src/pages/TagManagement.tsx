import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Pencil, Tag as TagIcon, Trash2 } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";

interface TagItem {
  name: string;
  count: number;
}

function SortableTag({
  tag,
  onRename,
  onDelete,
  disabled,
}: {
  tag: TagItem;
  onRename: (name: string) => void;
  onDelete: (name: string) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.9 : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 ${isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 -ml-1"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
          <TagIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-medium break-words">{tag.name}</p>
          <p className="text-sm text-muted-foreground">
            {t("tags.itemCount", { count: tag.count })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRename(tag.name)}
            disabled={disabled}
          >
            <Pencil className="h-4 w-4 mr-1" />
            {t("tags.rename")}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => onDelete(tag.name)}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t("tags.delete")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function TagManagement() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: tags, isLoading, isError, refetch } = trpc.tags.list.useQuery();

  const [renameOpen, setRenameOpen] = useState(false);
  const [tagToRename, setTagToRename] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const refreshTagData = async () => {
    await Promise.all([utils.tags.list.invalidate(), utils.products.myProducts.invalidate()]);
  };

  const renameMutation = trpc.tags.rename.useMutation({
    onSuccess: async () => {
      toast.success(t("tags.renameSuccess"));
      setRenameOpen(false);
      setTagToRename(null);
      setRenameValue("");
      await refreshTagData();
    },
    onError: (error) => {
      toast.error(error.message || t("tags.updateFailed"));
    },
  });

  const deleteMutation = trpc.tags.delete.useMutation({
    onSuccess: async () => {
      toast.success(t("tags.deleteSuccess"));
      setTagToDelete(null);
      await refreshTagData();
    },
    onError: (error) => {
      toast.error(error.message || t("tags.deleteFailed"));
    },
  });

  const reorderMutation = trpc.tags.reorder.useMutation({
    onSuccess: async () => {
      toast.success(t("tags.reorderSuccess"));
      await utils.tags.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("tags.reorderFailed"));
      utils.tags.list.invalidate();
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !tags) return;

      const oldIndex = tags.findIndex((t) => t.name === active.id);
      const newIndex = tags.findIndex((t) => t.name === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(tags, oldIndex, newIndex);

      utils.tags.list.setData(undefined, reordered);

      reorderMutation.mutate({
        orderedNames: reordered.map((t) => t.name),
      });
    },
    [tags, utils.tags.list, reorderMutation],
  );

  function openRenameDialog(name: string) {
    setTagToRename(name);
    setRenameValue(name);
    setRenameOpen(true);
  }

  function handleRenameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tagToRename) return;

    const nextName = renameValue.trim();
    if (!nextName) {
      toast.error(t("tags.nameRequired"));
      return;
    }

    renameMutation.mutate({
      oldName: tagToRename,
      newName: nextName,
    });
  }

  const mutating = renameMutation.isPending || deleteMutation.isPending;

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("tags.title")} onBack={() => navigate("/")} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (isError) {
    return (
      <MobileLayout showBottomNav={false}>
        <AppBar title={t("tags.title")} onBack={() => navigate("/")} />
        <ErrorRetry message={t("tags.loadError")} onRetry={() => refetch()} />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <AppBar title={t("tags.title")} onBack={() => navigate("/")} />

      <div className="container py-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{t("tags.description")}</p>
          {tags && tags.length > 1 && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              {t("tags.reorderHint")}
            </p>
          )}
        </div>

        {!tags || tags.length === 0 ? (
          <EmptyState
            icon={TagIcon}
            title={t("tags.emptyTitle")}
            description={t("tags.emptyDescription")}
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tags.map((t) => t.name)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {tags.map((tag) => (
                  <SortableTag
                    key={tag.name}
                    tag={tag}
                    onRename={openRenameDialog}
                    onDelete={setTagToDelete}
                    disabled={mutating}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open);
          if (!open) {
            setTagToRename(null);
            setRenameValue("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tags.renameTitle")}</DialogTitle>
            <DialogDescription>{t("tags.renameDescription")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenameSubmit} className="space-y-4">
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder={t("tags.renamePlaceholder")}
              autoFocus
              maxLength={100}
              disabled={renameMutation.isPending}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
                disabled={renameMutation.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={renameMutation.isPending}>
                {renameMutation.isPending ? t("common.loading") : t("tags.rename")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={tagToDelete !== null} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tags.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("tags.deleteConfirm", { name: tagToDelete ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending || !tagToDelete}
              onClick={() => {
                if (!tagToDelete) return;
                deleteMutation.mutate({ name: tagToDelete });
              }}
            >
              {deleteMutation.isPending ? t("common.loading") : t("tags.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
