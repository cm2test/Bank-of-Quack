import React, { useState, FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

interface Sector {
  id: string;
  name: string;
  category_ids: string[];
}

interface SectorCategoryManagementProps {
  sectors: Sector[];
  categories: Category[];
  addCategoryToSector: (sectorId: string, categoryId: string) => void;
  removeCategoryFromSector: (sectorId: string, categoryId: string) => void;
}

const SectorCategoryManagement: React.FC<SectorCategoryManagementProps> = ({
  sectors,
  categories,
  addCategoryToSector,
  removeCategoryFromSector,
}) => {
  const [selectedCategoryForSector, setSelectedCategoryForSector] = useState<{
    [sectorId: string]: string;
  }>({});

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
            {sectors.map((sec) => {
              // Get all category IDs already assigned to any sector
              const assignedCategoryIds = sectors.flatMap(
                (s) => s.category_ids
              );
              // Only show categories not assigned to any sector
              const availableCategories = categories.filter(
                (cat) => !assignedCategoryIds.includes(cat.id)
              );
              return (
                <li
                  key={sec.id}
                  className="pb-4 mb-4 border-b border-border last:border-b-0 last:mb-0 last:pb-0"
                >
                  <form
                    onSubmit={(e) => handleAddCategoryToSectorSubmit(e, sec.id)}
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
                          {availableCategories.length === 0 ? (
                            <div className="px-2 py-1 text-muted-foreground text-sm">
                              No categories available
                            </div>
                          ) : (
                            availableCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        type="submit"
                        size="sm"
                        className="w-full sm:w-auto sm:ml-2"
                        disabled={availableCategories.length === 0}
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
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default SectorCategoryManagement;
