// src/components/settings/ImportDialog.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Papa from "papaparse";
import { supabase } from "@/supabaseClient";
import TransactionList from "@/components/TransactionList";
import { Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface Category {
  id: string;
  name: string;
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userNames: string[];
  categories: Category[];
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  splitTypeOptions: { value: string; label: string }[];
  getSplitTypeLabel: (value: string) => string;
  getSplitTypeValueFromLabel: (label: string) => string;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  userNames,
  categories,
  transactions,
  setTransactions,
  splitTypeOptions,
  getSplitTypeLabel,
  getSplitTypeValueFromLabel,
}) => {
  const [modalState, setModalState] = useState<
    "closed" | "upload" | "preview" | "summary"
  >("upload");
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [importIssues, setImportIssues] = useState<any[]>([]);
  const [importInserts, setImportInserts] = useState<any[]>([]);
  const [importUpdates, setImportUpdates] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState<string>("");
  const [editingCell, setEditingCell] = useState<{
    rowIdx: number;
    key: string;
  } | null>(null);
  const [importedTransactionsList, setImportedTransactionsList] = useState<
    any[]
  >([]);
  const [finalImportedTransactions, setFinalImportedTransactions] = useState<
    Transaction[]
  >([]);

  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setModalState("upload");
    } else {
      setModalState("closed");
      resetImportState();
    }
  }, [isOpen]);

  const resetImportState = () => {
    setImportedRows([]);
    setImportIssues([]);
    setImportInserts([]);
    setImportUpdates([]);
    setImportFileName("");
    setImportedTransactionsList([]);
    setFinalImportedTransactions([]);
    if (importFileInputRef.current) {
      importFileInputRef.current.value = "";
    }
  };

  const transformRowToDb = (row: any) => {
    const { _cellIssues, ...csvData } = row;
    const mappedData = Object.entries(csvData).reduce((acc, [key, value]) => {
      const dbColumn = COLUMN_MAPPING[key];
      if (dbColumn) {
        if (key === "Category" && value) {
          const categoryId = getCategoryIdByName(value as string);
          if (categoryId) acc[dbColumn] = categoryId;
        } else if (key === "Split Type" && value) {
          acc[dbColumn] = getSplitTypeValueFromLabel(value as string);
        } else if (value !== undefined && value !== "") {
          acc[dbColumn] = value;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    if (
      mappedData.transaction_type === "income" ||
      mappedData.transaction_type === "reimbursement"
    ) {
      mappedData.paid_to_user_name = row["Paid to"];
      mappedData.paid_by_user_name = "";
    }
    return mappedData;
  };

  const getCategoryIdByName = (categoryName: string): string | null => {
    const category = categories.find((c) => c.name === categoryName);
    return category ? category.id : null;
  };

  const validateRowCells = (row: any, allRows: any[]) => {
    const issues: Record<string, string> = {};
    if (row.ID && !transactions.find((t) => t.id === row.ID)) {
      issues.ID = "ID does not match any existing transaction";
    }
    if (row.ID && allRows.filter((r) => r.ID === row.ID).length > 1) {
      issues.ID = "Duplicate ID in import file";
    }
    if (!row.Amount) issues.Amount = "Required";
    else if (isNaN(Number(row.Amount))) issues.Amount = "Must be a number";
    else if (Number(row.Amount) < 0) issues.Amount = "Cannot be negative";

    if (!row.Description) {
      issues.Description = "Required";
    }

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

    if (
      row.Type?.toLowerCase() === "income" ||
      row.Type?.toLowerCase() === "reimbursement"
    ) {
      if (!row["Paid to"]) {
        issues["Paid to"] = "Required for income and reimbursement";
      }
      if (row["Paid By"]) {
        issues["Paid By"] = "Must be empty for income and reimbursement";
      }
    } else {
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
        if (userNames && !userNames.includes(row["Paid By"])) {
          issues["Paid By"] = "Not a valid user";
        }
      }
    }

    if (row["Paid to"] && userNames && !userNames.includes(row["Paid to"])) {
      issues["Paid to"] = "Not a valid user";
    }

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

    if (
      row.Type?.toLowerCase() !== "reimbursement" &&
      row["Reimburses Transaction ID"]
    ) {
      issues["Reimburses Transaction ID"] =
        "Can only be used for reimbursement type";
    }

    if (row.Type?.toLowerCase() === "expense") {
      if (!row["Split Type"]) {
        issues["Split Type"] = "Required for expenses";
      }
      if (!row.Category) {
        issues.Category = "Required for expenses";
      }
      if (row["Paid to"]) {
        issues["Paid to"] = "Must be empty for expenses";
      }
    }

    if (row.Category && !categories.find((c) => c.name === row.Category)) {
      issues.Category = "Category does not exist";
    }

    if (row.Type?.toLowerCase() === "income") {
      if (row.Category) {
        issues.Category = "Must be empty for income";
      }
      if (row["Split Type"]) {
        issues["Split Type"] = "Must be empty for income";
      }
    }

    if (row.Type?.toLowerCase() === "reimbursement") {
      if (row.Category) {
        issues.Category = "Must be empty for reimbursement";
      }
      if (row["Split Type"]) {
        issues["Split Type"] = "Must be empty for reimbursement";
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
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        const foundHeaders = results.meta.fields || [];
        const headersMatch =
          foundHeaders.length === REQUIRED_HEADERS.length &&
          foundHeaders.every((h, i) => h === REQUIRED_HEADERS[i]);
        if (!headersMatch) {
          alert(
            `CSV header mismatch.\\n\\nRequired: \\n${REQUIRED_HEADERS.join(
              ", "
            )}\\n\\nFound: \\n${foundHeaders.join(", ")}`
          );
          if (importFileInputRef.current) importFileInputRef.current.value = "";
          return;
        }
        const rows = results.data as any[];
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
      if (key !== "ID" && prev[rowIdx].ID) {
        updated[rowIdx] = {
          ...updated[rowIdx],
          ID: prev[rowIdx].ID,
          [key]: value,
        };
      } else {
        updated[rowIdx] = { ...updated[rowIdx], [key]: value };
      }
      const cellIssues = validateRowCells(updated[rowIdx], updated);
      if (Object.keys(cellIssues).length > 0) {
        updated[rowIdx]._cellIssues = cellIssues;
      } else {
        delete updated[rowIdx]._cellIssues;
      }
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

  const handleImport = async () => {
    if (!importedRows.length) return;
    try {
      const transactionsToInsert = importInserts.map((row) =>
        transformRowToDb(row)
      );
      const transactionsToUpdate = importUpdates.map((row) =>
        transformRowToDb(row)
      );

      let allAffectedTransactions: Transaction[] = [];

      if (transactionsToInsert.length > 0) {
        const { data: insertedData, error: insertError } = await supabase
          .from("transactions")
          .insert(transactionsToInsert)
          .select();
        if (insertError) throw insertError;
        if (insertedData) allAffectedTransactions.push(...insertedData);
      }

      if (transactionsToUpdate.length > 0) {
        const { data: updatedData, error: updateError } = await supabase
          .from("transactions")
          .upsert(transactionsToUpdate)
          .select();
        if (updateError) throw updateError;
        if (updatedData) allAffectedTransactions.push(...updatedData);
      }

      setFinalImportedTransactions(allAffectedTransactions);

      setTransactions((prev) => {
        const transactionMap = new Map(prev.map((t) => [t.id, t]));
        allAffectedTransactions.forEach((t) => transactionMap.set(t.id, t));
        return Array.from(transactionMap.values());
      });

      setModalState("summary");
    } catch (error: any) {
      alert(`Error during import: ${error.message}`);
    }
  };

  const handleDeleteImportedTransaction = async (transactionId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this transaction? This will permanently remove it from the database."
      )
    ) {
      return;
    }
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);

      if (error) {
        throw error;
      }

      setFinalImportedTransactions((prev) =>
        prev.filter((t) => t.id !== transactionId)
      );
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    } catch (error: any) {
      alert(`Error deleting transaction: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col bg-gradient-to-b from-[#004D40] to-[#26A69A] border-none text-white">
        {modalState === "upload" && (
          <div className="flex flex-col items-center justify-center p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl mb-4">
                Import Transactions
              </DialogTitle>
            </DialogHeader>
            <p className="mb-6 text-center">
              Select a CSV file to import. The file must have the correct
              headers.
            </p>
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
              variant="default"
              className="bg-white text-teal-700 hover:bg-gray-200"
              onClick={() => document.getElementById("importCSVInput")?.click()}
            >
              Choose CSV File
            </Button>
            <DialogFooter className="mt-8">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={onClose}
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
        )}
        {modalState === "preview" ? (
          <>
            <DialogHeader>
              <DialogTitle>Import Transactions Preview</DialogTitle>
            </DialogHeader>
            <div className="mb-4 space-y-2 text-sm">
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
                    const isUpdate =
                      !isIssue &&
                      importUpdates.some((upd) => upd.ID === row.ID);
                    const isInsert = !isIssue && !isUpdate;

                    let rowBg = "";
                    if (isIssue) rowBg = "bg-red-50 dark:bg-red-900/40";
                    else if (isUpdate) rowBg = "bg-blue-50 dark:bg-blue-900/40";
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
                                              {splitTypeOptions.map((type) => (
                                                <SelectItem
                                                  key={type.value}
                                                  value={type.value}
                                                >
                                                  {type.label}
                                                </SelectItem>
                                              ))}
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
                                                  (e.target as HTMLInputElement)
                                                    .value
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
                  setModalState("upload");
                  resetImportState();
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
        {modalState === "summary" && (
          <div className="flex-1 flex flex-col h-full">
            <DialogHeader>
              <DialogTitle>Successfully Imported Transactions</DialogTitle>
              <DialogDescription>
                {importInserts.length} new transactions were added and{" "}
                {importUpdates.length} were updated.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex-1 overflow-y-auto">
              <TransactionList
                transactions={finalImportedTransactions}
                categories={categories}
                userNames={userNames}
                deleteTransaction={handleDeleteImportedTransaction}
                variant="dialog"
              />
            </div>
            <DialogFooter className="mt-4">
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
