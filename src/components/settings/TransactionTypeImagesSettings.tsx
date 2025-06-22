import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";

interface TransactionTypeImagesSettingsProps {
  initialIncomeImageUrl: string | null;
  initialSettlementImageUrl: string | null;
  initialReimbursementImageUrl: string | null;
}

const TransactionTypeImagesSettings: React.FC<
  TransactionTypeImagesSettingsProps
> = ({
  initialIncomeImageUrl,
  initialSettlementImageUrl,
  initialReimbursementImageUrl,
}) => {
  const [incomeImageUrl, setIncomeImageUrl] = useState<string | null>(
    initialIncomeImageUrl
  );
  const [settlementImageUrl, setSettlementImageUrl] = useState<string | null>(
    initialSettlementImageUrl
  );
  const [reimbursementImageUrl, setReimbursementImageUrl] = useState<
    string | null
  >(initialReimbursementImageUrl);

  useEffect(() => {
    setIncomeImageUrl(initialIncomeImageUrl);
    setSettlementImageUrl(initialSettlementImageUrl);
    setReimbursementImageUrl(initialReimbursementImageUrl);
  }, [
    initialIncomeImageUrl,
    initialSettlementImageUrl,
    initialReimbursementImageUrl,
  ]);

  const [uploadingIncomeImage, setUploadingIncomeImage] =
    useState<boolean>(false);
  const [uploadingSettlementImage, setUploadingSettlementImage] =
    useState<boolean>(false);
  const [uploadingReimbursementImage, setUploadingReimbursementImage] =
    useState<boolean>(false);

  const uploadTransactionTypeImage = async (
    file: File,
    type: "income" | "settlement" | "reimbursement"
  ) => {
    let setUploading: (v: boolean) => void;
    let setImageUrl: (v: string | null) => void;
    let key: string;
    let folder: string;

    if (type === "income") {
      setUploading = setUploadingIncomeImage;
      setImageUrl = setIncomeImageUrl;
      key = "income_image_url";
      folder = "income-images";
    } else if (type === "settlement") {
      setUploading = setUploadingSettlementImage;
      setImageUrl = setSettlementImageUrl;
      key = "settlement_image_url";
      folder = "settlement-images";
    } else {
      setUploading = setUploadingReimbursementImage;
      setImageUrl = setReimbursementImageUrl;
      key = "reimbursement_image_url";
      folder = "reimbursement-images";
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${type}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from(folder)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Failed to upload image: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from(folder)
      .getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl;

    if (publicUrl) {
      await supabase
        .from("app_settings")
        .upsert({ key, value: publicUrl }, { onConflict: "key" });
      setImageUrl(publicUrl);
    }
    setUploading(false);
  };

  const handleRemoveTransactionTypeImage = async (
    type: "income" | "settlement" | "reimbursement"
  ) => {
    let setImageUrl: (v: string | null) => void;
    let key: string;

    if (type === "income") {
      setImageUrl = setIncomeImageUrl;
      key = "income_image_url";
    } else if (type === "settlement") {
      setImageUrl = setSettlementImageUrl;
      key = "settlement_image_url";
    } else {
      setImageUrl = setReimbursementImageUrl;
      key = "reimbursement_image_url";
    }

    await supabase.from("app_settings").update({ value: null }).eq("key", key);
    setImageUrl(null);
  };

  const handleTransactionTypeImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "income" | "settlement" | "reimbursement"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadTransactionTypeImage(file, type);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Type Images</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Income */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-24 h-24 rounded-lg bg-muted-foreground/10 flex items-center justify-center overflow-hidden border mb-2">
              {incomeImageUrl ? (
                <img
                  src={incomeImageUrl}
                  alt="Income preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-3xl text-muted-foreground">💰</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              id="incomeImageInput"
              className="sr-only"
              onChange={(e) => handleTransactionTypeImageChange(e, "income")}
              disabled={uploadingIncomeImage}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                document.getElementById("incomeImageInput")?.click()
              }
              disabled={uploadingIncomeImage}
              className="w-28 text-xs mt-1"
            >
              {incomeImageUrl ? "Change Image" : "Upload Image"}
            </Button>
            {uploadingIncomeImage && (
              <span className="text-xs text-muted-foreground mt-1">
                Uploading...
              </span>
            )}
            {incomeImageUrl && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveTransactionTypeImage("income")}
                className="text-xs mt-2"
                disabled={uploadingIncomeImage}
              >
                Remove Image
              </Button>
            )}
            <span className="text-xs mt-1">Income</span>
          </div>
          {/* Settlement */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-24 h-24 rounded-lg bg-muted-foreground/10 flex items-center justify-center overflow-hidden border mb-2">
              {settlementImageUrl ? (
                <img
                  src={settlementImageUrl}
                  alt="Settlement preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-3xl text-muted-foreground">🤝</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              id="settlementImageInput"
              className="sr-only"
              onChange={(e) =>
                handleTransactionTypeImageChange(e, "settlement")
              }
              disabled={uploadingSettlementImage}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                document.getElementById("settlementImageInput")?.click()
              }
              disabled={uploadingSettlementImage}
              className="w-28 text-xs mt-1"
            >
              {settlementImageUrl ? "Change Image" : "Upload Image"}
            </Button>
            {uploadingSettlementImage && (
              <span className="text-xs text-muted-foreground mt-1">
                Uploading...
              </span>
            )}
            {settlementImageUrl && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveTransactionTypeImage("settlement")}
                className="text-xs mt-2"
                disabled={uploadingSettlementImage}
              >
                Remove Image
              </Button>
            )}
            <span className="text-xs mt-1">Settlement</span>
          </div>
          {/* Reimbursement */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-24 h-24 rounded-lg bg-muted-foreground/10 flex items-center justify-center overflow-hidden border mb-2">
              {reimbursementImageUrl ? (
                <img
                  src={reimbursementImageUrl}
                  alt="Reimbursement preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-3xl text-muted-foreground">🔄</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              id="reimbursementImageInput"
              className="sr-only"
              onChange={(e) =>
                handleTransactionTypeImageChange(e, "reimbursement")
              }
              disabled={uploadingReimbursementImage}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                document.getElementById("reimbursementImageInput")?.click()
              }
              disabled={uploadingReimbursementImage}
              className="w-28 text-xs mt-1"
            >
              {reimbursementImageUrl ? "Change Image" : "Upload Image"}
            </Button>
            {uploadingReimbursementImage && (
              <span className="text-xs text-muted-foreground mt-1">
                Uploading...
              </span>
            )}
            {reimbursementImageUrl && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() =>
                  handleRemoveTransactionTypeImage("reimbursement")
                }
                className="text-xs mt-2"
                disabled={uploadingReimbursementImage}
              >
                Remove Image
              </Button>
            )}
            <span className="text-xs mt-1">Reimbursement</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          These images will be shown for their respective transaction types in
          the app.
        </p>
      </CardContent>
    </Card>
  );
};

export default TransactionTypeImagesSettings;
