import React, { useState, FormEvent } from "react";
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

interface Sector {
  id: string;
  name: string;
}

interface SectorSettingsProps {
  sectors: Sector[];
  addSector: (name: string) => Promise<any | null>;
  deleteSector: (id: string) => void;
  updateSector: (id: string, name: string) => Promise<void>;
}

const SectorSettings: React.FC<SectorSettingsProps> = ({
  sectors,
  addSector,
  deleteSector,
  updateSector,
}) => {
  const [newSectorInput, setNewSectorInput] = useState<string>("");
  const [deleteSectorDialog, setDeleteSectorDialog] = useState<Sector | null>(
    null
  );
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
  const [editingSectorName, setEditingSectorName] = useState<string>("");

  const handleAddSector = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newSectorInput.trim()) {
      const newSector = await addSector(newSectorInput.trim());
      if (newSector) {
        setNewSectorInput("");
      }
    }
  };

  return (
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
                          if (editingSectorName.trim()) {
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
                          onChange={(e) => setEditingSectorName(e.target.value)}
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
  );
};

export default SectorSettings;
