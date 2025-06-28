import React, { useState, useRef, FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/supabaseClient";
import { AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Category {
  id: string;
  name: string;
  image_url: string | null;
}

interface CategorySettingsProps {
  categories: Category[];
  addCategory: (name: string) => void;
  deleteCategory: (cat: Category) => void;
  updateCategory: (id: string, name: string) => Promise<void>;
  refetchCategories: () => void;
  sectors: { id: string; name: string; category_ids: string[] }[];
}

const CategorySettings: React.FC<CategorySettingsProps> = ({
  categories,
  addCategory,
  deleteCategory,
  updateCategory,
  refetchCategories,
  sectors,
}) => {
  const [newCategoryInput, setNewCategoryInput] = useState<string>("");
  const [deleteCategoryDialog, setDeleteCategoryDialog] =
    useState<Category | null>(null);
  const [uploadingCategoryId, setUploadingCategoryId] = useState<string | null>(
    null
  );
  const [categoryImagePreviews, setCategoryImagePreviews] = useState<
    Record<string, string>
  >({});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleAddCategory = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newCategoryInput.trim()) {
      addCategory(newCategoryInput.trim());
      setNewCategoryInput("");
    }
  };

  const uploadCategoryImage = async (file: File, categoryId: string) => {
    setUploadingCategoryId(categoryId);
    const fileExt = file.name.split(".").pop();
    const filePath = `category_${categoryId}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("category-images")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Failed to upload image: " + uploadError.message);
      setUploadingCategoryId(null);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("category-images")
      .getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl;

    if (publicUrl) {
      await supabase
        .from("categories")
        .update({ image_url: publicUrl })
        .eq("id", categoryId);
      setCategoryImagePreviews((prev) => ({
        ...prev,
        [categoryId]: publicUrl,
      }));
      refetchCategories();
    }
    setUploadingCategoryId(null);
  };

  const handleCategoryImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    categoryId: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCategoryImagePreviews((prev) => ({
          ...prev,
          [categoryId]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
      uploadCategoryImage(file, categoryId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
          <Label htmlFor="newCategory" className="sr-only">
            Add New Category
          </Label>
          <Input
            type="text"
            id="newCategory"
            value={newCategoryInput}
            onChange={(e) => setNewCategoryInput(e.target.value)}
            placeholder="New category name"
          />
          <Button type="submit">Add Category</Button>
        </form>
        <h4 className="font-semibold mb-2">Existing Categories</h4>
        {categories.length === 0 ? (
          <p className="text-muted-foreground">No categories defined.</p>
        ) : (
          <>
            <ul className="space-y-4">
              {categories.map((cat) => {
                const isUnlinked = !sectors.some((sector) =>
                  sector.category_ids.includes(cat.id)
                );
                return (
                  <li
                    key={cat.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-2 rounded-lg bg-background/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted-foreground/10 flex items-center justify-center overflow-hidden border">
                        {categoryImagePreviews[cat.id] || cat.image_url ? (
                          <img
                            src={
                              categoryImagePreviews[cat.id] || cat.image_url!
                            }
                            alt={cat.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl text-muted-foreground">
                            🗂️
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        {editingCategoryId === cat.id ? (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (editingCategoryName.trim()) {
                                await updateCategory(
                                  cat.id,
                                  editingCategoryName.trim()
                                );
                                setEditingCategoryId(null);
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            <Input
                              value={editingCategoryName}
                              onChange={(e) =>
                                setEditingCategoryName(e.target.value)
                              }
                              className="h-8 text-sm px-2 py-1"
                              autoFocus
                            />
                            <Button
                              type="submit"
                              size="sm"
                              className="px-2 text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="px-2 text-xs"
                              onClick={() => setEditingCategoryId(null)}
                            >
                              Cancel
                            </Button>
                          </form>
                        ) : (
                          <span className="font-medium text-base leading-tight break-words max-w-[140px] sm:max-w-none flex items-center gap-1">
                            {cat.name}
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="ml-1 p-1 text-xs"
                              onClick={() => {
                                setEditingCategoryId(cat.id);
                                setEditingCategoryName(cat.name);
                              }}
                              aria-label="Edit category name"
                            >
                              ✏️
                            </Button>
                            {isUnlinked && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="ml-1 text-yellow-500 cursor-pointer">
                                      <AlertTriangle className="w-4 h-4" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    This category is not linked to any sector.
                                    Link it to a sector so it appears correctly
                                    in the dashboard pie chart.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          (ID: {cat.id.substring(0, 6)})
                        </span>
                      </div>
                    </div>
                    <input
                      ref={(el) => {
                        fileInputRefs.current[cat.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      id={`catimg_${cat.id}`}
                      className="sr-only"
                      onChange={(e) => handleCategoryImageChange(e, cat.id)}
                      disabled={uploadingCategoryId === cat.id}
                    />
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[cat.id]?.click()}
                        disabled={uploadingCategoryId === cat.id}
                        className="text-xs w-full sm:w-auto"
                      >
                        {cat.image_url || categoryImagePreviews[cat.id]
                          ? "Change Image"
                          : "Add Image"}
                      </Button>
                      {uploadingCategoryId === cat.id && (
                        <span className="text-xs text-muted-foreground">
                          Uploading...
                        </span>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteCategoryDialog(cat)}
                        className="text-xs w-full sm:w-auto"
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <AlertDialog
              open={!!deleteCategoryDialog}
              onOpenChange={(open) => !open && setDeleteCategoryDialog(null)}
            >
              <AlertDialogTrigger asChild />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the category "
                    {deleteCategoryDialog?.name}"? This will also remove it from
                    any sectors.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => setDeleteCategoryDialog(null)}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (deleteCategoryDialog) {
                        deleteCategory(deleteCategoryDialog);
                        setDeleteCategoryDialog(null);
                      }
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CategorySettings;
