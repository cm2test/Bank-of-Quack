// src/pages/SettingsPage.jsx
import React, {
  useState,
  useEffect,
  FormEvent,
  useCallback,
  useRef,
} from "react";
import { useOutletContext } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "../supabaseClient";

interface SettingsPageContext {
  userNames: string[];
  updateUserNames: (n1: string, n2: string) => void;
  categories: any[];
  addCategory: (name: string) => void;
  deleteCategory: (cat: any) => void;
  sectors: any[];
  addSector: (name: string) => Promise<any | null>;
  deleteSector: (id: string) => void;
  addCategoryToSector: (sectorId: string, categoryId: string) => void;
  removeCategoryFromSector: (sectorId: string, categoryId: string) => void;
  setCategories?: any;
  updateCategory?: any;
  updateSector?: any;
}

const SettingsPage: React.FC = () => {
  const {
    userNames,
    updateUserNames,
    categories,
    addCategory,
    deleteCategory,
    sectors,
    addSector,
    deleteSector,
    addCategoryToSector,
    removeCategoryFromSector,
    setCategories,
    updateCategory,
    updateSector,
  } = useOutletContext<
    SettingsPageContext & {
      setCategories?: any;
      updateCategory?: any;
      updateSector?: any;
    }
  >();

  const [user1NameInput, setUser1NameInput] = useState<string>("");
  const [user2NameInput, setUser2NameInput] = useState<string>("");
  const [newCategoryInput, setNewCategoryInput] = useState<string>("");
  const [newSectorInput, setNewSectorInput] = useState<string>("");
  const [selectedCategoryForSector, setSelectedCategoryForSector] = useState<{
    [sectorId: string]: string;
  }>({});
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<any | null>(
    null
  );
  const [deleteSectorDialog, setDeleteSectorDialog] = useState<any | null>(
    null
  );
  const [user1Image, setUser1Image] = useState<string | null>(null);
  const [user2Image, setUser2Image] = useState<string | null>(null);
  const [user1ImageUrl, setUser1ImageUrl] = useState<string | null>(null);
  const [user2ImageUrl, setUser2ImageUrl] = useState<string | null>(null);
  const [uploadingUser, setUploadingUser] = useState<1 | 2 | null>(null);
  const [uploadingCategoryId, setUploadingCategoryId] = useState<string | null>(
    null
  );
  const [categoryImagePreviews, setCategoryImagePreviews] = useState<
    Record<string, string>
  >({});

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
  const [editingSectorName, setEditingSectorName] = useState<string>("");

  const refetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, image_url")
      .order("name", { ascending: true });
    if (!error && typeof setCategories === "function") {
      setCategories(data || []);
    }
  }, [setCategories]);

  useEffect(() => {
    if (userNames && userNames.length >= 2) {
      setUser1NameInput(userNames[0]);
      setUser2NameInput(userNames[1]);
    }
    // Fetch avatar URLs from app_settings
    const fetchAvatars = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["user1_avatar_url", "user2_avatar_url"]);
      if (data) {
        const u1 = data.find((s: any) => s.key === "user1_avatar_url");
        const u2 = data.find((s: any) => s.key === "user2_avatar_url");
        if (u1 && u1.value) setUser1ImageUrl(u1.value);
        if (u2 && u2.value) setUser2ImageUrl(u2.value);
      }
    };
    fetchAvatars();
  }, [userNames]);

  const handleUserNamesSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user1NameInput.trim() && user2NameInput.trim()) {
      updateUserNames(user1NameInput.trim(), user2NameInput.trim());
      alert("User names updated!");
    } else {
      alert("User names cannot be empty.");
    }
  };

  const handleAddCategory = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newCategoryInput.trim()) {
      addCategory(newCategoryInput.trim());
      setNewCategoryInput("");
    }
  };

  const handleAddSector = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newSectorInput.trim()) {
      const newSector = await addSector(newSectorInput.trim());
      if (newSector) {
        setNewSectorInput("");
      }
    }
  };

  const handleAddCategoryToSectorSubmit = (
    e: FormEvent<HTMLFormElement>,
    sectorId: string
  ) => {
    e.preventDefault();
    if (sectorId && selectedCategoryForSector[sectorId]) {
      addCategoryToSector(sectorId, selectedCategoryForSector[sectorId]);
      setSelectedCategoryForSector((prev) => ({ ...prev, [sectorId]: "" }));
    } else {
      alert("Please select a category to add.");
    }
  };

  // Helper to upload image to Supabase Storage and update app_settings
  const uploadAvatar = async (file: File, user: 1 | 2) => {
    setUploadingUser(user);
    const fileExt = file.name.split(".").pop();
    const filePath = `user${user}_avatar_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      alert("Failed to upload image: " + uploadError.message);
      setUploadingUser(null);
      return;
    }
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl;
    if (publicUrl) {
      // Update app_settings
      const key = user === 1 ? "user1_avatar_url" : "user2_avatar_url";
      await supabase
        .from("app_settings")
        .upsert({ key, value: publicUrl }, { onConflict: "key" });
      if (user === 1) setUser1ImageUrl(publicUrl);
      if (user === 2) setUser2ImageUrl(publicUrl);
    }
    setUploadingUser(null);
  };

  // Helper to handle image upload and preview
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<string | null>>,
    user: 1 | 2
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      uploadAvatar(file, user);
    }
  };

  // Helper to upload image to Supabase Storage and update category image_url
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
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("category-images")
      .getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl;
    if (publicUrl) {
      // Update category row
      await supabase
        .from("categories")
        .update({ image_url: publicUrl })
        .eq("id", categoryId);
      setCategoryImagePreviews((prev) => ({
        ...prev,
        [categoryId]: publicUrl,
      }));
      // Refetch categories from Supabase to ensure fresh data
      if (typeof refetchCategories === "function") {
        refetchCategories();
      }
    }
    setUploadingCategoryId(null);
  };

  // Handler for category image input
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
    <div className="max-w-3xl mx-auto w-full p-4 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>

      {/* User Names Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Names</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUserNamesSave} className="space-y-0">
            {/* Mobile layout: stacked, visible below md */}
            <div className="block md:hidden">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center overflow-hidden border mb-2">
                    {user1ImageUrl ? (
                      <img
                        src={user1ImageUrl}
                        alt="User 1 avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : user1Image ? (
                      <img
                        src={user1Image}
                        alt="User 1 avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-muted-foreground">🦆</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    id="user1Image"
                    className="sr-only"
                    onChange={(e) => handleImageChange(e, setUser1Image, 1)}
                    disabled={uploadingUser === 1}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("user1Image")?.click()
                    }
                    disabled={uploadingUser === 1}
                    className="w-32 text-xs mt-1"
                  >
                    {user1ImageUrl || user1Image
                      ? "Change File"
                      : "Choose File"}
                  </Button>
                  {user1Image && !user1ImageUrl && (
                    <span className="text-xs text-muted-foreground">
                      Selected
                    </span>
                  )}
                  {uploadingUser === 1 && (
                    <span className="text-xs text-muted-foreground">
                      Uploading...
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-center w-full">
                  <Label
                    htmlFor="user1Name"
                    className="mb-2 w-full text-center"
                  >
                    User 1 Name
                  </Label>
                  <Input
                    type="text"
                    id="user1Name"
                    value={user1NameInput}
                    onChange={(e) => setUser1NameInput(e.target.value)}
                    required
                    className="h-9 rounded-md px-3 py-2 bg-background text-sm w-full max-w-xs"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center overflow-hidden border mb-2">
                    {user2ImageUrl ? (
                      <img
                        src={user2ImageUrl}
                        alt="User 2 avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : user2Image ? (
                      <img
                        src={user2Image}
                        alt="User 2 avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-muted-foreground">🦆</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    id="user2Image"
                    className="sr-only"
                    onChange={(e) => handleImageChange(e, setUser2Image, 2)}
                    disabled={uploadingUser === 2}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("user2Image")?.click()
                    }
                    disabled={uploadingUser === 2}
                    className="w-32 text-xs mt-1"
                  >
                    {user2ImageUrl || user2Image
                      ? "Change File"
                      : "Choose File"}
                  </Button>
                  {user2Image && !user2ImageUrl && (
                    <span className="text-xs text-muted-foreground">
                      Selected
                    </span>
                  )}
                  {uploadingUser === 2 && (
                    <span className="text-xs text-muted-foreground">
                      Uploading...
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-center w-full">
                  <Label
                    htmlFor="user2Name"
                    className="mb-2 w-full text-center"
                  >
                    User 2 Name
                  </Label>
                  <Input
                    type="text"
                    id="user2Name"
                    value={user2NameInput}
                    onChange={(e) => setUser2NameInput(e.target.value)}
                    required
                    className="h-9 rounded-md px-3 py-2 bg-background text-sm w-full max-w-xs"
                  />
                </div>
              </div>
            </div>
            {/* Desktop layout: 2x2 grid, visible md+ */}
            <div className="hidden md:grid grid-cols-2 gap-8 mb-6">
              {/* User 1 Avatar/Change File */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center overflow-hidden border mb-2">
                  {user1ImageUrl ? (
                    <img
                      src={user1ImageUrl}
                      alt="User 1 avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : user1Image ? (
                    <img
                      src={user1Image}
                      alt="User 1 avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-muted-foreground">🦆</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="user1Image"
                  className="sr-only"
                  onChange={(e) => handleImageChange(e, setUser1Image, 1)}
                  disabled={uploadingUser === 1}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("user1Image")?.click()}
                  disabled={uploadingUser === 1}
                  className="w-32 text-xs mt-1"
                >
                  {user1ImageUrl || user1Image ? "Change File" : "Choose File"}
                </Button>
                {user1Image && !user1ImageUrl && (
                  <span className="text-xs text-muted-foreground">
                    Selected
                  </span>
                )}
                {uploadingUser === 1 && (
                  <span className="text-xs text-muted-foreground">
                    Uploading...
                  </span>
                )}
              </div>
              {/* User 2 Avatar/Change File */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center overflow-hidden border mb-2">
                  {user2ImageUrl ? (
                    <img
                      src={user2ImageUrl}
                      alt="User 2 avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : user2Image ? (
                    <img
                      src={user2Image}
                      alt="User 2 avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-muted-foreground">🦆</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="user2Image"
                  className="sr-only"
                  onChange={(e) => handleImageChange(e, setUser2Image, 2)}
                  disabled={uploadingUser === 2}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("user2Image")?.click()}
                  disabled={uploadingUser === 2}
                  className="w-32 text-xs mt-1"
                >
                  {user2ImageUrl || user2Image ? "Change File" : "Choose File"}
                </Button>
                {user2Image && !user2ImageUrl && (
                  <span className="text-xs text-muted-foreground">
                    Selected
                  </span>
                )}
                {uploadingUser === 2 && (
                  <span className="text-xs text-muted-foreground">
                    Uploading...
                  </span>
                )}
              </div>
              {/* User 1 Name/Input */}
              <div className="flex flex-col items-center md:items-start justify-center">
                <Label
                  htmlFor="user1Name"
                  className="mb-2 w-full md:w-auto text-center md:text-left"
                >
                  User 1 Name
                </Label>
                <Input
                  type="text"
                  id="user1Name"
                  value={user1NameInput}
                  onChange={(e) => setUser1NameInput(e.target.value)}
                  required
                  className="h-9 rounded-md px-3 py-2 bg-background text-sm w-full max-w-xs"
                />
              </div>
              {/* User 2 Name/Input */}
              <div className="flex flex-col items-center md:items-start justify-center">
                <Label
                  htmlFor="user2Name"
                  className="mb-2 w-full md:w-auto text-center md:text-left"
                >
                  User 2 Name
                </Label>
                <Input
                  type="text"
                  id="user2Name"
                  value={user2NameInput}
                  onChange={(e) => setUser2NameInput(e.target.value)}
                  required
                  className="h-9 rounded-md px-3 py-2 bg-background text-sm w-full max-w-xs"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <Button type="submit" className="mt-2">
                Save User Names
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Categories Management */}
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
                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-2 rounded-lg bg-background/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted-foreground/10 flex items-center justify-center overflow-hidden border">
                        {categoryImagePreviews[cat.id] || cat.image_url ? (
                          <img
                            src={categoryImagePreviews[cat.id] || cat.image_url}
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
                              if (
                                editingCategoryName.trim() &&
                                updateCategory
                              ) {
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
                          <span className="font-medium text-base leading-tight break-words max-w-[140px] sm:max-w-none">
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
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          (ID: {cat.id.substring(0, 6)})
                        </span>
                      </div>
                    </div>
                    {/* Hidden file input outside the flex container */}
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
                ))}
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
                      {deleteCategoryDialog?.name}"? This will also remove it
                      from any sectors.
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

      {/* Sectors Management */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Sectors</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSector} className="flex gap-2 mb-4">
            <Label htmlFor="newSector" className="sr-only">
              Add New Sector
            </Label>
            <Input
              type="text"
              id="newSector"
              value={newSectorInput}
              onChange={(e) => setNewSectorInput(e.target.value)}
              placeholder="New sector name"
            />
            <Button type="submit">Add Sector</Button>
          </form>
          <h4 className="font-semibold mb-2">Existing Sectors</h4>
          {sectors.length === 0 ? (
            <p className="text-muted-foreground">No sectors defined.</p>
          ) : (
            <>
              <ul className="space-y-4">
                {sectors.map((sec) => (
                  <li
                    key={sec.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-2 rounded-lg bg-background/80"
                  >
                    <div className="flex flex-col">
                      {editingSectorId === sec.id ? (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (editingSectorName.trim() && updateSector) {
                              await updateSector(
                                sec.id,
                                editingSectorName.trim()
                              );
                              setEditingSectorId(null);
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <Input
                            value={editingSectorName}
                            onChange={(e) =>
                              setEditingSectorName(e.target.value)
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
                            onClick={() => setEditingSectorId(null)}
                          >
                            Cancel
                          </Button>
                        </form>
                      ) : (
                        <span className="font-medium text-base leading-tight break-words max-w-[180px] sm:max-w-none">
                          {sec.name}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="ml-1 p-1 text-xs"
                            onClick={() => {
                              setEditingSectorId(sec.id);
                              setEditingSectorName(sec.name);
                            }}
                            aria-label="Edit sector name"
                          >
                            ✏️
                          </Button>
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        (ID: {sec.id.substring(0, 6)})
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteSectorDialog(sec)}
                        className="text-xs w-full sm:w-auto"
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <AlertDialog
                open={!!deleteSectorDialog}
                onOpenChange={(open) => !open && setDeleteSectorDialog(null)}
              >
                <AlertDialogTrigger asChild />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Sector</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the sector "
                      {deleteSectorDialog?.name}"? All category associations for
                      this sector will be removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => setDeleteSectorDialog(null)}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (deleteSectorDialog) {
                          deleteSector(deleteSectorDialog.id);
                          setDeleteSectorDialog(null);
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

      {/* Add Category to Sector */}
      <Card>
        <CardHeader>
          <CardTitle>Add Category to Sector</CardTitle>
        </CardHeader>
        <CardContent>
          {sectors.length === 0 || categories.length === 0 ? (
            <p className="text-muted-foreground">
              Add sectors and categories first.
            </p>
          ) : (
            <ul className="space-y-4">
              {sectors.map((sec) => (
                <li
                  key={sec.id}
                  className="pb-4 mb-4 border-b border-border last:border-b-0 last:mb-0 last:pb-0"
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const catId = selectedCategoryForSector[sec.id];
                      if (sec.id && catId) {
                        addCategoryToSector(sec.id, catId);
                        setSelectedCategoryForSector((prev) => ({
                          ...prev,
                          [sec.id]: "",
                        }));
                      } else {
                        alert("Please select a category to add.");
                      }
                    }}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <span className="font-medium sm:flex-1">{sec.name}</span>
                    <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:justify-end sm:items-center sm:gap-2">
                      <Select
                        value={selectedCategoryForSector[sec.id] || ""}
                        onValueChange={(val) =>
                          setSelectedCategoryForSector((prev) => ({
                            ...prev,
                            [sec.id]: val,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full sm:w-48 bg-background">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-zinc-900 border border-border">
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="submit"
                        size="sm"
                        className="w-full sm:w-auto sm:ml-2"
                      >
                        Add
                      </Button>
                    </div>
                  </form>
                  {sec.category_ids && sec.category_ids.length > 0 && (
                    <div className="ml-8 mt-1">
                      <div className="text-xs text-muted-foreground mb-1">
                        Categories:
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {sec.category_ids.map((catId: string) => {
                          const cat = categories.find((c) => c.id === catId);
                          return cat ? (
                            <span
                              key={cat.id}
                              className="inline-flex items-center bg-muted-foreground/10 text-foreground px-2 py-0.5 rounded-md text-xs font-medium shadow-sm"
                            >
                              {cat.name}
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="ml-1 h-4 w-4 p-0 text-xs"
                                onClick={() =>
                                  removeCategoryFromSector(sec.id, cat.id)
                                }
                                aria-label={`Remove ${cat.name} from sector`}
                              >
                                ×
                              </Button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
