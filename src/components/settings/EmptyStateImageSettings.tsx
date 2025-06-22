import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";

interface EmptyStateImageSettingsProps {
  initialEmptyStateImageUrl: string | null;
}

const EmptyStateImageSettings: React.FC<EmptyStateImageSettingsProps> = ({
  initialEmptyStateImageUrl,
}) => {
  const [emptyStateImageUrl, setEmptyStateImageUrl] = useState<string | null>(
    initialEmptyStateImageUrl
  );

  useEffect(() => {
    setEmptyStateImageUrl(initialEmptyStateImageUrl);
  }, [initialEmptyStateImageUrl]);

  const [uploadingEmptyStateImage, setUploadingEmptyStateImage] =
    useState<boolean>(false);

  const uploadEmptyStateImage = async (file: File) => {
    setUploadingEmptyStateImage(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `empty_state_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("empty-state-images")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Failed to upload image: " + uploadError.message);
      setUploadingEmptyStateImage(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("empty-state-images")
      .getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl;

    if (publicUrl) {
      await supabase
        .from("app_settings")
        .upsert(
          { key: "sector_category_empty_state_image_url", value: publicUrl },
          { onConflict: "key" }
        );
      setEmptyStateImageUrl(publicUrl);
    }
    setUploadingEmptyStateImage(false);
  };

  const handleEmptyStateImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadEmptyStateImage(file);
    }
  };

  const handleRemoveEmptyStateImage = async () => {
    if (!emptyStateImageUrl) return;
    await supabase
      .from("app_settings")
      .update({ value: null })
      .eq("key", "sector_category_empty_state_image_url");
    setEmptyStateImageUrl(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Empty State Image (Sector & Category Breakdown)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-lg bg-muted-foreground/10 flex items-center justify-center overflow-hidden border mb-2">
              {emptyStateImageUrl ? (
                <img
                  src={emptyStateImageUrl}
                  alt="Empty state preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-4xl text-muted-foreground">🖼️</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              id="emptyStateImageInput"
              className="sr-only"
              onChange={handleEmptyStateImageChange}
              disabled={uploadingEmptyStateImage}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                document.getElementById("emptyStateImageInput")?.click()
              }
              disabled={uploadingEmptyStateImage}
              className="w-32 text-xs mt-1"
            >
              {emptyStateImageUrl ? "Change Image" : "Upload Image"}
            </Button>
            {uploadingEmptyStateImage && (
              <span className="text-xs text-muted-foreground mt-1">
                Uploading...
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              This image will be shown in the dashboard's sector & category
              breakdown widget when there is no data to display.
            </p>
            {emptyStateImageUrl && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemoveEmptyStateImage}
                className="text-xs mt-2"
                disabled={uploadingEmptyStateImage}
              >
                Remove Image
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyStateImageSettings;
