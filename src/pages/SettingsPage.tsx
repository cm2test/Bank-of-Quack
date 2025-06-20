// src/pages/SettingsPage.jsx
import React, {
  useState,
  useEffect,
  FormEvent,
  useCallback,
  useRef,
  useMemo,
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
import DuckFabNav from "@/components/dashboard/DuckFabNav";
import Papa from "papaparse";
import { Pencil } from "lucide-react";
import TransactionList from "@/components/TransactionList";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  transaction_type: string;
  category_id?: string;
  category_name?: string;
  paid_by_user_name?: string;
  split_type?: string;
  paid_to_user_name?: string;
  reimburses_transaction_id?: string;
}

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
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const REQUIRED_HEADERS = [
  "ID",
  "Date",
  "Description",
  "Amount",
  "Paid By",
  "Split Type",
  "Type",
  "Category",
  "Paid to",
  "Reimburses Transaction ID",
];

// Map CSV headers to database column names
const COLUMN_MAPPING: Record<string, string> = {
  ID: "id",
  Date: "date",
  Description: "description",
  Amount: "amount",
  "Paid By": "paid_by_user_name",
  "Split Type": "split_type",
  Type: "transaction_type",
  Category: "category_id",
  "Paid to": "paid_to_user_name",
  "Reimburses Transaction ID": "reimburses_transaction_id",
};

const SettingsPage = () => {
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
    transactions,
    setTransactions,
  } = useOutletContext<SettingsPageContext>();

  const getExpenseSplitTypes = (currentUsers: string[]) => {
    if (!currentUsers || currentUsers.length < 2)
      return [{ value: "splitEqually", label: "Split Equally" }];
    return [
      { value: "splitEqually", label: "Split Equally" },
      { value: "user1_only", label: `For ${currentUsers[0]} Only` },
      { value: "user2_only", label: `For ${currentUsers[1]} Only` },
    ];
  };

  const splitTypeOptions = useMemo(
    () => getExpenseSplitTypes(userNames),
    [userNames]
  );

  const getSplitTypeLabel = useCallback(
    (value: string) => {
      const option = splitTypeOptions.find((opt) => opt.value === value);
      return option ? option.label : value;
    },
    [splitTypeOptions]
  );

  const getSplitTypeValueFromLabel = useCallback(
    (label: string) => {
      const option = splitTypeOptions.find((opt) => opt.label === label);
      return option ? option.value : label; // If not found, assume it's already a value
    },
    [splitTypeOptions]
  );

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

  const [emptyStateImageUrl, setEmptyStateImageUrl] = useState<string | null>(
    null
  );
  const [uploadingEmptyStateImage, setUploadingEmptyStateImage] =
    useState<boolean>(false);

  const [incomeImageUrl, setIncomeImageUrl] = useState<string | null>(null);
  const [settlementImageUrl, setSettlementImageUrl] = useState<string | null>(
    null
  );
  const [reimbursementImageUrl, setReimbursementImageUrl] = useState<
    string | null
  >(null);
  const [uploadingIncomeImage, setUploadingIncomeImage] =
    useState<boolean>(false);
  const [uploadingSettlementImage, setUploadingSettlementImage] =
    useState<boolean>(false);
  const [uploadingReimbursementImage, setUploadingReimbursementImage] =
    useState<boolean>(false);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [importIssues, setImportIssues] = useState<any[]>([]);
  const [importInserts, setImportInserts] = useState<any[]>([]);
  const [importUpdates, setImportUpdates] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState<string>("");

  const [editingCell, setEditingCell] = useState<{
    rowIdx: number;
    key: string;
  } | null>(null);

  const [showImportedTransactions, setShowImportedTransactions] =
    useState(false);
  const [importedTransactionsList, setImportedTransactionsList] = useState<
    any[]
  >([]);

  const [modalState, setModalState] = useState<
    "closed" | "preview" | "summary"
  >("closed");

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

  // Fetch empty state image URL from app_settings
  useEffect(() => {
    const fetchEmptyStateImage = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "sector_category_empty_state_image_url")
        .single();
      if (data && data.value) setEmptyStateImageUrl(data.value);
    };
    fetchEmptyStateImage();
  }, []);

  // Fetch transaction type images from app_settings
  useEffect(() => {
    const fetchTransactionTypeImages = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [
          "income_image_url",
          "settlement_image_url",
          "reimbursement_image_url",
        ]);
      if (data) {
        const income = data.find((s: any) => s.key === "income_image_url");
        const settlement = data.find(
          (s: any) => s.key === "settlement_image_url"
        );
        const reimbursement = data.find(
          (s: any) => s.key === "reimbursement_image_url"
        );
        if (income && income.value) setIncomeImageUrl(income.value);
        if (settlement && settlement.value)
          setSettlementImageUrl(settlement.value);
        if (reimbursement && reimbursement.value)
          setReimbursementImageUrl(reimbursement.value);
      }
    };
    fetchTransactionTypeImages();
  }, []);

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

  // Handler to upload image to Supabase Storage and update app_settings
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
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("empty-state-images")
      .getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl;
    if (publicUrl) {
      // Update app_settings
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

  // Handler for file input change
  const handleEmptyStateImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadEmptyStateImage(file);
    }
  };

  // Handler to remove the image
  const handleRemoveEmptyStateImage = async () => {
    if (!emptyStateImageUrl) return;
    // Remove from app_settings
    await supabase
      .from("app_settings")
      .update({ value: null })
      .eq("key", "sector_category_empty_state_image_url");
    setEmptyStateImageUrl(null);
  };

  // Upload helpers for each type
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

  // Remove helpers for each type
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

  // File input change handlers
  const handleTransactionTypeImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "income" | "settlement" | "reimbursement"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadTransactionTypeImage(file, type);
    }
  };

  // Helper to convert array of objects to CSV string
  function arrayToCSV(data: any[]) {
    if (!data || !data.length) return "";
    const replacer = (key: string, value: any) =>
      value === null || value === undefined ? "" : value;
    const header = Object.keys(data[0]);
    const csv = [
      header.join(","),
      ...data.map((row) =>
        header
          .map((fieldName) =>
            JSON.stringify(replacer(fieldName, row[fieldName])).replace(
              /\"/g,
              '"'
            )
          )
          .join(",")
      ),
    ].join("\r\n");
    return csv;
  }

  function handleExportCSV() {
    if (!transactions || !transactions.length) {
      alert("No transactions to export.");
      return;
    }

    const exportedData = transactions.map((t) => {
      const categoryName =
        categories.find((c) => c.id === t.category_id)?.name || "";

      const rowData = {
        ID: t.id,
        Date: t.date,
        Description: t.description,
        Amount: t.amount,
        "Paid By": t.paid_by_user_name,
        "Split Type": t.split_type ? getSplitTypeLabel(t.split_type) : "",
        Type: t.transaction_type,
        Category: categoryName,
        "Paid to": t.paid_to_user_name,
        "Reimburses Transaction ID": t.reimburses_transaction_id,
      };

      const orderedRow: Record<string, any> = {};
      REQUIRED_HEADERS.forEach((header) => {
        orderedRow[header] = rowData[header as keyof typeof rowData] ?? "";
      });
      return orderedRow;
    });

    const csv = arrayToCSV(exportedData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_export_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function validateRowCells(row: any, allRows: any[]) {
    const issues: Record<string, string> = {};
    // If ID is present but does not match any existing transaction, it's an issue
    if (row.ID && !transactions.find((t) => t.id === row.ID)) {
      issues.ID = "ID does not match any existing transaction";
    }
    // Check for duplicate IDs in the import file
    if (row.ID && allRows.filter((r) => r.ID === row.ID).length > 1) {
      issues.ID = "Duplicate ID in import file";
    }
    if (!row.Amount) issues.Amount = "Required";
    else if (isNaN(Number(row.Amount))) issues.Amount = "Must be a number";

    if (!row.Description) {
      issues.Description = "Required";
    }

    // Date validation
    if (!row.Date) {
      issues.Date = "Required";
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.Date)) {
        issues.Date = "Invalid format (use YYYY-MM-DD)";
      } else {
        const [year, month, day] = row.Date.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day);
        if (
          dateObj.getFullYear() !== year ||
          dateObj.getMonth() !== month - 1 ||
          dateObj.getDate() !== day
        ) {
          issues.Date = "Invalid date (e.g., month or day out of range)";
        }
      }
    }

    if (!row.Type) issues.Type = "Required";
    else if (
      !["expense", "income", "settlement", "reimbursement"].includes(
        row.Type.toLowerCase()
      )
    ) {
      issues.Type =
        "Must be one of: expense, income, settlement, reimbursement";
    }
    if (!row["Paid By"]) {
      issues["Paid By"] = "Required";
    } else if (row.Type?.toLowerCase() === "expense") {
      if (
        userNames &&
        !userNames.includes(row["Paid By"]) &&
        row["Paid By"] !== "Shared"
      ) {
        issues["Paid By"] = 'Must be a valid user or "Shared"';
      }
    } else {
      // For types other than 'expense'
      if (userNames && !userNames.includes(row["Paid By"])) {
        issues["Paid By"] = "Not a valid user";
      }
    }

    if (row["Paid to"] && userNames && !userNames.includes(row["Paid to"])) {
      issues["Paid to"] = "Not a valid user";
    }

    // Settlement-specific validations
    if (row.Type?.toLowerCase() === "settlement") {
      if (!row["Paid to"]) {
        issues["Paid to"] = "Required for settlements";
      } else if (row["Paid By"] === row["Paid to"]) {
        issues["Paid to"] = "Cannot be the same as 'Paid By'";
      }
      if (row.Category) {
        issues.Category = "Must be empty for settlements";
      }
      if (row["Split Type"]) {
        issues["Split Type"] = "Must be empty for settlements";
      }
    }

    // Validate "Reimburses Transaction ID" is only used for reimbursements
    if (
      row.Type?.toLowerCase() !== "reimbursement" &&
      row["Reimburses Transaction ID"]
    ) {
      issues["Reimburses Transaction ID"] =
        "Can only be used for reimbursement type";
    }

    if (row.Type?.toLowerCase() === "expense" && !row["Split Type"]) {
      issues["Split Type"] = "Required for expenses";
    }
    // Validate category for expenses
    if (row.Type?.toLowerCase() === "expense" && !row.Category) {
      issues.Category = "Required for expenses";
    }
    // Validate category exists
    if (row.Category && !categories.find((c) => c.name === row.Category)) {
      issues.Category = "Category does not exist";
    }

    // Income-specific validations
    if (row.Type?.toLowerCase() === "income") {
      if (row.Category) {
        issues.Category = "Must be empty for income";
      }
      if (row["Split Type"]) {
        issues["Split Type"] = "Must be empty for income";
      }
      if (row["Paid to"]) {
        issues["Paid to"] = "Must be empty for income";
      }
      if (!row["Paid By"]) {
        issues["Paid By"] = "Required (who received the income)";
      }
    }

    // Reimbursement-specific validations
    if (row.Type?.toLowerCase() === "reimbursement") {
      if (row.Category) {
        issues.Category = "Must be empty for reimbursement";
      }
      if (row["Split Type"]) {
        issues["Split Type"] = "Must be empty for reimbursement";
      }
      if (row["Paid to"]) {
        issues["Paid to"] = "Must be empty for reimbursement";
      }
      if (row["Reimburses Transaction ID"]) {
        const reimbursedTx = transactions.find(
          (t) => t.id === row["Reimburses Transaction ID"]
        );
        if (!reimbursedTx) {
          issues["Reimburses Transaction ID"] =
            "Reimbursed transaction not found";
        } else if (reimbursedTx.transaction_type !== "expense") {
          issues["Reimburses Transaction ID"] =
            "Can only reimburse 'expense' type transactions";
        }
      }
    }

    // Validate "Split Type" value if provided
    if (row["Split Type"]) {
      const validSplitTypeValues = splitTypeOptions.map((opt) => opt.value);
      const validSplitTypeLabels = splitTypeOptions.map((opt) => opt.label);
      if (
        !validSplitTypeValues.includes(row["Split Type"]) &&
        !validSplitTypeLabels.includes(row["Split Type"])
      ) {
        issues["Split Type"] = "Invalid split type";
      }
    }

    return issues;
  }

  // Function to convert category name to ID
  const getCategoryIdByName = (categoryName: string): string | null => {
    const category = categories.find((c) => c.name === categoryName);
    return category ? category.id : null;
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        // Header validation
        const foundHeaders = results.meta.fields || [];
        console.log("Found CSV headers:", foundHeaders);
        console.log("Required headers:", REQUIRED_HEADERS);
        const headersMatch =
          foundHeaders.length === REQUIRED_HEADERS.length &&
          foundHeaders.every((h, i) => h === REQUIRED_HEADERS[i]);
        if (!headersMatch) {
          alert(
            `CSV header mismatch.\n\nRequired: \n${REQUIRED_HEADERS.join(
              ", "
            )}\n\nFound: \n${foundHeaders.join(", ")}`
          );
          if (importFileInputRef.current) importFileInputRef.current.value = "";
          return;
        }
        const rows = results.data as any[];
        console.log("First row of data:", rows[0]);
        // Validate and classify rows with per-cell validation
        const processedRows = rows.map((row, idx, arr) => {
          const cellIssues = validateRowCells(row, arr);
          if (Object.keys(cellIssues).length > 0) {
            return { ...row, _cellIssues: cellIssues };
          }
          return row;
        });
        setImportedRows(processedRows);
        setImportIssues(processedRows.filter((r) => r._cellIssues));
        setImportInserts(
          processedRows.filter(
            (r) =>
              !r._cellIssues &&
              (!r.ID || !transactions.find((t) => t.id === r.ID))
          )
        );
        setImportUpdates(
          processedRows.filter(
            (r) =>
              !r._cellIssues && r.ID && transactions.find((t) => t.id === r.ID)
          )
        );
        setModalState("preview");
      },
      error: (err: any) => {
        alert("Failed to parse CSV: " + err.message);
      },
    });
  };

  const handleEditImportCell = (rowIdx: number, key: string, value: string) => {
    setImportedRows((prev) => {
      const updated = [...prev];
      // Always preserve ID if present
      if (key !== "ID" && prev[rowIdx].ID) {
        updated[rowIdx] = {
          ...updated[rowIdx],
          ID: prev[rowIdx].ID,
          [key]: value,
        };
      } else {
        updated[rowIdx] = { ...updated[rowIdx], [key]: value };
      }
      // Re-validate this row
      const cellIssues = validateRowCells(updated[rowIdx], updated);
      if (Object.keys(cellIssues).length > 0) {
        updated[rowIdx]._cellIssues = cellIssues;
      } else {
        delete updated[rowIdx]._cellIssues;
      }
      // Re-classify
      setImportIssues(updated.filter((r) => r._cellIssues));
      setImportInserts(
        updated.filter(
          (r) =>
            !r._cellIssues &&
            (!r.ID || !transactions.find((t) => t.id === r.ID))
        )
      );
      setImportUpdates(
        updated.filter(
          (r) =>
            !r._cellIssues && r.ID && transactions.find((t) => t.id === r.ID)
        )
      );
      return updated;
    });
  };

  const handleCellEditDone = (rowIdx: number, key: string, value: string) => {
    // Use an empty string if the user selects the "None" option
    const finalValue = value === "--boq-none--" ? "" : value;
    handleEditImportCell(rowIdx, key, finalValue);
    setEditingCell(null);
  };

  const handleRemoveImportRow = (rowIdx: number) => {
    setImportedRows((prev) => {
      const updated = prev.filter((_, i) => i !== rowIdx);
      setImportIssues(updated.filter((r) => r._cellIssues));
      setImportInserts(
        updated.filter(
          (r) =>
            !r._cellIssues &&
            (!r.ID || !transactions.find((t) => t.id === r.ID))
        )
      );
      setImportUpdates(
        updated.filter(
          (r) =>
            !r._cellIssues && r.ID && transactions.find((t) => t.id === r.ID)
        )
      );
      return updated;
    });
  };

  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  // Function to process the actual import
  const handleImport = async () => {
    if (!importedRows.length) return;

    try {
      const updatedTransactions: Transaction[] = [];

      // Process updates first
      for (const row of importUpdates) {
        const { _cellIssues, ...csvData } = row;
        // Map CSV column names to database column names and convert category name to ID
        const mappedData = Object.entries(csvData).reduce(
          (acc, [key, value]) => {
            const dbColumn = COLUMN_MAPPING[key];
            if (dbColumn) {
              // Convert category name to ID if this is the category field
              if (key === "Category" && value) {
                const categoryId = getCategoryIdByName(value as string);
                if (categoryId) {
                  acc[dbColumn] = categoryId;
                }
              } else if (key === "Split Type" && value) {
                acc[dbColumn] = getSplitTypeValueFromLabel(value as string);
              } else if (value !== undefined && value !== "") {
                acc[dbColumn] = value;
              }
            }
            return acc;
          },
          {} as Record<string, any>
        );

        const { id, ...updatePayload } = mappedData;

        if (!id) continue;

        console.log("Update data being sent to Supabase:", updatePayload);

        const { data, error } = await supabase
          .from("transactions")
          .update(updatePayload)
          .eq("id", id)
          .select();

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
        if (data && data.length > 0) {
          updatedTransactions.push(data[0] as Transaction);
        }
      }

      // Process inserts
      const insertsData = importInserts.map(({ _cellIssues, ...csvData }) => {
        // Map CSV column names to database column names and convert category name to ID
        const mappedData = Object.entries(csvData).reduce(
          (acc, [key, value]) => {
            const dbColumn = COLUMN_MAPPING[key];
            if (dbColumn && value !== undefined && value !== "") {
              // Convert category name to ID if this is the category field
              if (key === "Category") {
                const categoryId = getCategoryIdByName(value as string);
                if (categoryId) {
                  acc[dbColumn] = categoryId;
                }
              } else if (key === "Split Type" && value) {
                acc[dbColumn] = getSplitTypeValueFromLabel(value as string);
              } else if (key !== "ID") {
                // Exclude ID from insert payload
                acc[dbColumn] = value;
              }
            }
            return acc;
          },
          {} as Record<string, any>
        );
        return mappedData;
      });

      if (insertsData.length > 0) {
        console.log("Insert data being sent to Supabase:", insertsData[0]);
        const { data, error } = await supabase
          .from("transactions")
          .insert(insertsData)
          .select();

        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }
        if (data) {
          updatedTransactions.push(...(data as Transaction[]));
        }
      }

      // Update app state
      setTransactions((prev) => {
        const updated = [...prev];
        // Update existing transactions
        updatedTransactions.forEach((newT) => {
          const index = updated.findIndex((t) => t.id === newT.id);
          if (index !== -1) {
            updated[index] = newT;
          } else {
            updated.unshift(newT);
          }
        });
        return updated;
      });

      // Store imported transactions for display
      setImportedTransactionsList(updatedTransactions);

      // Close import dialog and show results
      setModalState("summary");

      // Reset import state
      setImportedRows([]);
      setImportIssues([]);
      setImportInserts([]);
      setImportUpdates([]);
      if (importFileInputRef.current) {
        importFileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Full error:", error);
      alert(`Error importing transactions: ${error.message}`);
    }
  };

  return (
    <>
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
                        <span className="text-2xl text-muted-foreground">
                          🦆
                        </span>
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
                        <span className="text-2xl text-muted-foreground">
                          🦆
                        </span>
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

        {/* Transaction Type Images */}
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
                  onChange={(e) =>
                    handleTransactionTypeImageChange(e, "income")
                  }
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
                    onClick={() =>
                      handleRemoveTransactionTypeImage("settlement")
                    }
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
              These images will be shown for their respective transaction types
              in the app.
            </p>
          </CardContent>
        </Card>

        {/* Empty State Image for Sector & Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>
              Empty State Image (Sector & Category Breakdown)
            </CardTitle>
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
                              src={
                                categoryImagePreviews[cat.id] || cat.image_url
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
                  onOpenChange={(open) =>
                    !open && setDeleteCategoryDialog(null)
                  }
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
                        {deleteSectorDialog?.name}"? All category associations
                        for this sector will be removed.
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

        {/* Manage transactions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Manage transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 items-start">
              <p className="text-muted-foreground text-sm">
                Download all your transactions as a CSV file for use in
                spreadsheets or backups.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleExportCSV} variant="default">
                  Export as CSV
                </Button>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  id="importCSVInput"
                  className="sr-only"
                  onChange={handleImportCSV}
                  ref={importFileInputRef}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("importCSVInput")?.click()
                  }
                >
                  Import CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <DuckFabNav />
      <Dialog
        open={modalState !== "closed"}
        onOpenChange={(open) => !open && setModalState("closed")}
      >
        <DialogContent className="max-w-5xl w-full max-h-[80vh] overflow-y-auto p-8 bg-gradient-to-b from-[#004D40] to-[#26A69A] border-none">
          {modalState === "preview" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">
                  Import Transactions Preview
                </DialogTitle>
              </DialogHeader>
              <div className="mb-4 space-y-2 text-sm text-white">
                <p>
                  File: <span className="font-mono">{importFileName}</span>
                </p>
                <div className="flex gap-x-6 rounded-lg bg-black/20 p-3">
                  <span className="font-medium text-green-400">
                    Inserts: {importInserts.length}
                  </span>
                  <span className="font-medium text-blue-400">
                    Updates: {importUpdates.length}
                  </span>
                  <span className="font-medium text-red-400">
                    Issues: {importIssues.length}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[60vh] border rounded bg-white dark:bg-zinc-900">
                <table className="min-w-full text-xs border border-border">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white border-b border-border">
                      {importedRows[0] &&
                        Object.keys(importedRows[0] || {})
                          .filter((k) => k !== "_cellIssues")
                          .map((k) => (
                            <th
                              key={k}
                              className="px-3 py-2 text-left font-bold border-r border-border last:border-r-0 whitespace-nowrap"
                            >
                              {k}
                            </th>
                          ))}
                      <th className="px-3 py-2 font-bold border-r border-border last:border-r-0">
                        Type
                      </th>
                      <th className="px-3 py-2 font-bold border-r border-border last:border-r-0">
                        Row Issue
                      </th>
                      <th className="px-3 py-2 font-bold">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedRows.map((row, i) => {
                      const cellIssues = row._cellIssues || {};
                      const isIssue = Object.keys(cellIssues).length > 0;
                      const isUpdate = importUpdates.some(
                        (upd) => upd.ID === row.ID && !isIssue
                      );
                      const isInsert = importInserts.some(
                        (ins) => ins.ID === row.ID && !isIssue
                      );
                      let rowBg = "";
                      if (isIssue) rowBg = "bg-red-50 dark:bg-red-900/40";
                      else if (isUpdate)
                        rowBg = "bg-blue-50 dark:bg-blue-900/40";
                      else rowBg = "bg-green-50 dark:bg-green-900/40";
                      const cellErrorKeys = Object.keys(cellIssues || {});
                      return (
                        <tr
                          key={i}
                          className={`${rowBg} text-black dark:text-white border-b border-border`}
                        >
                          {Object.keys(row)
                            .filter((k) => k !== "_cellIssues")
                            .map((k) => {
                              const cellError = cellIssues[k];
                              const isEditing =
                                editingCell &&
                                editingCell.rowIdx === i &&
                                editingCell.key === k;
                              return (
                                <td
                                  key={k}
                                  className="px-3 py-1 border-r border-border last:border-r-0 align-top group"
                                >
                                  {isEditing ? (
                                    (() => {
                                      const commonSelectProps = {
                                        open: isEditing,
                                        onOpenChange: (open: boolean) =>
                                          !open && setEditingCell(null),
                                        value: row[k] ?? "",
                                        onValueChange: (value: string) =>
                                          handleCellEditDone(i, k, value),
                                      };
                                      const commonTriggerClasses = `w-full min-w-[120px] h-8 text-xs px-2 py-1 bg-white dark:bg-zinc-800 text-black dark:text-white border ${
                                        cellError
                                          ? "border-red-500 bg-red-100 dark:bg-red-900/60"
                                          : ""
                                      }`;

                                      switch (k) {
                                        case "Paid By":
                                        case "Paid to":
                                          return (
                                            <Select {...commonSelectProps}>
                                              <SelectTrigger
                                                className={commonTriggerClasses}
                                              >
                                                <SelectValue
                                                  placeholder={`Select ${k}`}
                                                />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="--boq-none--">
                                                  None
                                                </SelectItem>
                                                {userNames.map((name) => (
                                                  <SelectItem
                                                    key={name}
                                                    value={name}
                                                  >
                                                    {name}
                                                  </SelectItem>
                                                ))}
                                                {k === "Paid By" &&
                                                  row.Type?.toLowerCase() ===
                                                    "expense" && (
                                                    <SelectItem value="Shared">
                                                      Shared
                                                    </SelectItem>
                                                  )}
                                              </SelectContent>
                                            </Select>
                                          );
                                        case "Split Type":
                                          return (
                                            <Select {...commonSelectProps}>
                                              <SelectTrigger
                                                className={commonTriggerClasses}
                                              >
                                                <SelectValue placeholder="Select Split Type" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="--boq-none--">
                                                  None
                                                </SelectItem>
                                                {splitTypeOptions.map(
                                                  (type) => (
                                                    <SelectItem
                                                      key={type.value}
                                                      value={type.value}
                                                    >
                                                      {type.label}
                                                    </SelectItem>
                                                  )
                                                )}
                                              </SelectContent>
                                            </Select>
                                          );
                                        case "Type":
                                          return (
                                            <Select {...commonSelectProps}>
                                              <SelectTrigger
                                                className={commonTriggerClasses}
                                              >
                                                <SelectValue placeholder="Select Type" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {[
                                                  "expense",
                                                  "income",
                                                  "settlement",
                                                  "reimbursement",
                                                ].map((type) => (
                                                  <SelectItem
                                                    key={type}
                                                    value={type}
                                                  >
                                                    {type}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          );
                                        case "Category":
                                          return (
                                            <Select {...commonSelectProps}>
                                              <SelectTrigger
                                                className={commonTriggerClasses}
                                              >
                                                <SelectValue placeholder="Select Category" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="--boq-none--">
                                                  None
                                                </SelectItem>
                                                {categories.map((cat) => (
                                                  <SelectItem
                                                    key={cat.id}
                                                    value={cat.name}
                                                  >
                                                    {cat.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          );
                                        default:
                                          return (
                                            <Input
                                              autoFocus
                                              value={row[k] ?? ""}
                                              onChange={(e) =>
                                                handleEditImportCell(
                                                  i,
                                                  k,
                                                  e.target.value
                                                )
                                              }
                                              onBlur={(e) =>
                                                handleCellEditDone(
                                                  i,
                                                  k,
                                                  e.target.value
                                                )
                                              }
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                  handleCellEditDone(
                                                    i,
                                                    k,
                                                    (
                                                      e.target as HTMLInputElement
                                                    ).value
                                                  );
                                                }
                                              }}
                                              className={commonTriggerClasses}
                                              style={{
                                                fontFamily: "monospace",
                                              }}
                                            />
                                          );
                                      }
                                    })()
                                  ) : (
                                    <div
                                      className="flex items-center gap-1 min-h-[28px] cursor-pointer"
                                      onDoubleClick={() =>
                                        setEditingCell({ rowIdx: i, key: k })
                                      }
                                    >
                                      <span className="truncate font-mono">
                                        {k === "Split Type"
                                          ? getSplitTypeLabel(row[k])
                                          : row[k]}
                                      </span>
                                      <button
                                        type="button"
                                        className="opacity-60 hover:opacity-100 ml-1"
                                        tabIndex={-1}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingCell({ rowIdx: i, key: k });
                                        }}
                                        aria-label="Edit cell"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  {cellError && (
                                    <div className="text-xs text-red-600 mt-0.5">
                                      {cellError}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          <td className="px-3 py-1 border-r border-border last:border-r-0">
                            {isIssue ? "Issue" : isUpdate ? "Update" : "Insert"}
                          </td>
                          <td className="px-3 py-1 border-r border-border last:border-r-0 text-xs text-red-700 align-top">
                            {isIssue && cellErrorKeys.length > 0 && (
                              <span>
                                {cellErrorKeys
                                  .map((k: string) => `${k}: ${cellIssues[k]}`)
                                  .join(", ")}
                              </span>
                            )}
                            {isIssue && cellErrorKeys.length === 0 && (
                              <span>Unknown row issue</span>
                            )}
                          </td>
                          <td className="px-3 py-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="h-6 w-6 p-0"
                              onClick={() => handleRemoveImportRow(i)}
                              aria-label="Remove row"
                            >
                              ×
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setModalState("closed");
                    if (importFileInputRef.current)
                      importFileInputRef.current.value = "";
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    importIssues.length > 0 ||
                    (importInserts.length === 0 && importUpdates.length === 0)
                  }
                >
                  Import {importInserts.length + importUpdates.length}{" "}
                  Transactions
                </Button>
              </DialogFooter>
            </>
          ) : null}
          {modalState === "summary" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center mb-4 text-white">
                  Successfully Imported Transactions
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 p-4 rounded-lg bg-black/20 max-h-[60vh] overflow-y-auto">
                <TransactionList
                  transactions={importedTransactionsList}
                  deleteTransaction={() => {}}
                  showValues={true}
                  variant="dialog"
                />
              </div>
              <DialogFooter className="mt-4">
                <Button onClick={() => setModalState("closed")}>Close</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsPage;
