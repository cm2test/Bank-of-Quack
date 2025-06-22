import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  transaction_type: string;
  category_id?: string;
  paid_by_user_name?: string;
  split_type?: string;
  paid_to_user_name?: string;
  reimburses_transaction_id?: string;
}

interface Category {
  id: string;
  name: string;
}

interface TransactionManagementProps {
  transactions: Transaction[];
  categories: Category[];
  getSplitTypeLabel: (value: string) => string;
  onImportClick: () => void;
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

const TransactionManagement: React.FC<TransactionManagementProps> = ({
  transactions,
  categories,
  getSplitTypeLabel,
  onImportClick,
}) => {
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
              /\\"/g,
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

      return {
        ID: t.id,
        Date: t.date,
        Description: t.description,
        Amount: t.amount,
        "Paid By": t.paid_by_user_name || "",
        "Split Type": t.split_type ? getSplitTypeLabel(t.split_type) : "",
        Type: t.transaction_type,
        Category: categoryName,
        "Paid to": t.paid_to_user_name || "",
        "Reimburses Transaction ID": t.reimburses_transaction_id || "",
      };
    });

    // Ensure the data conforms to the headers
    const orderedData = exportedData.map((row) => {
      const orderedRow: Record<string, any> = {};
      REQUIRED_HEADERS.forEach((header) => {
        orderedRow[header] = row[header as keyof typeof row] ?? "";
      });
      return orderedRow;
    });

    const csv = arrayToCSV(orderedData);
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

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Manage transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 items-start">
          <p className="text-muted-foreground text-sm">
            Download all your transactions as a CSV file for use in spreadsheets
            or backups.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="default">
              Export as CSV
            </Button>
            <Button type="button" variant="outline" onClick={onImportClick}>
              Import CSV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionManagement;
