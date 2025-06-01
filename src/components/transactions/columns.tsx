"use client";
import { ColumnDef } from "@tanstack/react-table";

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  transaction_type: string;
  category_id?: string;
  category_name?: string;
  paid_by_user_name?: string;
  split_type?: string;
};

export const getColumns = (
  userNames: string[],
  categories: { id: string; name: string }[],
  showValues: boolean = true
): ColumnDef<Transaction>[] => [
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {showValues ? `$${row.original.amount.toFixed(2)}` : "•••••"}
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "transaction_type",
    header: "Type",
    cell: ({ row }) =>
      row.original.transaction_type.charAt(0).toUpperCase() +
      row.original.transaction_type.slice(1),
  },
  {
    accessorKey: "category_id",
    header: "Category",
    cell: ({ row }) => {
      const catId = row.original.category_id;
      const cat = categories.find((c) => c.id === catId);
      return cat ? cat.name : "Uncategorized";
    },
  },
  {
    accessorKey: "paid_by_user_name",
    header: "Paid By",
  },
  {
    accessorKey: "split_type",
    header: "Split",
    cell: ({ row }) => {
      const splitType = row.original.split_type;
      if (!userNames || userNames.length < 2) {
        switch (splitType) {
          case "splitEqually":
            return "Split Equally";
          case "user1_only":
            return "For User 1 Only";
          case "user2_only":
            return "For User 2 Only";
          default:
            return splitType || "N/A";
        }
      }
      switch (splitType) {
        case "splitEqually":
          return "Split Equally";
        case "user1_only":
          return `For ${userNames[0]} Only`;
        case "user2_only":
          return `For ${userNames[1]} Only`;
        default:
          return splitType || "N/A";
      }
    },
  },
];
