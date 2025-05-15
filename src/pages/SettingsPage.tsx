// src/pages/SettingsPage.jsx
import React, { useState, useEffect, FormEvent } from "react";
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
  } = useOutletContext<SettingsPageContext>();

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

  useEffect(() => {
    if (userNames && userNames.length >= 2) {
      setUser1NameInput(userNames[0]);
      setUser2NameInput(userNames[1]);
    }
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

  return (
    <div className="max-w-3xl mx-auto w-full p-4 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>

      {/* User Names Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Names</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUserNamesSave} className="space-y-4">
            <div>
              <Label htmlFor="user1Name">User 1 Name</Label>
              <Input
                type="text"
                id="user1Name"
                value={user1NameInput}
                onChange={(e) => setUser1NameInput(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="user2Name">User 2 Name</Label>
              <Input
                type="text"
                id="user2Name"
                value={user2NameInput}
                onChange={(e) => setUser2NameInput(e.target.value)}
                required
              />
            </div>
            <Button type="submit">Save User Names</Button>
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
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {cat.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        (ID: {cat.id.substring(0, 6)})
                      </span>
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteCategoryDialog(cat)}
                    >
                      Delete
                    </Button>
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
              <ul className="space-y-2">
                {sectors.map((sec) => (
                  <li
                    key={sec.id}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {sec.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        (ID: {sec.id.substring(0, 6)})
                      </span>
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteSectorDialog(sec)}
                    >
                      Delete
                    </Button>
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
                <li key={sec.id}>
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
                    className="flex gap-2 items-center"
                  >
                    <span className="w-32 font-medium">{sec.name}</span>
                    <Select
                      value={selectedCategoryForSector[sec.id] || ""}
                      onValueChange={(val) =>
                        setSelectedCategoryForSector((prev) => ({
                          ...prev,
                          [sec.id]: val,
                        }))
                      }
                    >
                      <SelectTrigger className="w-48 bg-background">
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
                    <Button type="submit" size="sm">
                      Add
                    </Button>
                  </form>
                  {sec.category_ids && sec.category_ids.length > 0 && (
                    <div className="ml-8 mt-1 text-xs text-muted-foreground">
                      Categories:{" "}
                      {sec.category_ids
                        .map((catId: string) => {
                          const cat = categories.find((c) => c.id === catId);
                          return cat ? cat.name : catId;
                        })
                        .join(", ")}
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
