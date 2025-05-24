// src/components/TransactionForm.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
  FormEvent,
} from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface TransactionFormProps {
  onAddTransaction: (t: Partial<any>) => void;
  context?: any;
}

interface TransactionFormContext {
  userNames: string[];
  categories: any[];
  transactions: any[];
  editingTransaction: any | null;
  updateTransaction: (t: Partial<any>) => void;
  handleSetEditingTransaction: (t: any | null) => void;
}

const TRANSACTION_TYPES = [
  { value: "expense", label: "Expense" },
  { value: "settlement", label: "Settlement" },
  { value: "income", label: "Income" },
  { value: "reimbursement", label: "Reimbursement" },
];

const TransactionForm: React.FC<TransactionFormProps> = ({
  onAddTransaction,
  context: propContext,
}) => {
  const context = propContext || useOutletContext<TransactionFormContext>();
  const {
    userNames,
    categories,
    transactions,
    editingTransaction,
    updateTransaction,
    handleSetEditingTransaction,
  } = context;

  const navigate = useNavigate();

  const [id, setId] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<string>(
    TRANSACTION_TYPES[0].value
  );
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [paidOrReceivedBy, setPaidOrReceivedBy] = useState<string>("");
  const [paidToUserName, setPaidToUserName] = useState<string>("");
  const [splitType, setSplitType] = useState<string>("");
  const [selectedReimbursesTransactionId, setSelectedReimbursesTransactionId] =
    useState<string>("none");
  const [showSuccess, setShowSuccess] = useState(false);

  const isEditing = !!editingTransaction;
  const lastEditIdRef = useRef<string | null>(null);

  const getExpenseSplitTypes = (currentUsers: string[]) => {
    if (!currentUsers || currentUsers.length < 2)
      return [{ value: "splitEqually", label: "Split Equally" }];
    return [
      { value: "splitEqually", label: "Split Equally" },
      { value: "user1_only", label: `For ${currentUsers[0]} Only` },
      { value: "user2_only", label: `For ${currentUsers[1]} Only` },
    ];
  };
  const [EXPENSE_SPLIT_TYPES, setExpenseSplitTypes] = useState<
    { value: string; label: string }[]
  >(getExpenseSplitTypes(userNames));

  const availableExpensesForReimbursement = useMemo(() => {
    if (!transactions) return [];
    return transactions
      .filter((t: any) => t.transaction_type === "expense")
      .sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [transactions]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (
      isEditing &&
      editingTransaction &&
      categories.length > 0 &&
      userNames.length > 0 &&
      editingTransaction.id !== lastEditIdRef.current
    ) {
      timeoutId = setTimeout(() => {
        lastEditIdRef.current = editingTransaction.id;
        console.log("Editing transaction (delayed):", editingTransaction); // Debugging
        const currentType = editingTransaction.transaction_type || "expense";
        setTransactionType(currentType);
        setId(editingTransaction.id);
        setDate(editingTransaction.date);
        setDescription(editingTransaction.description);
        setAmount(editingTransaction.amount.toString());
        setPaidOrReceivedBy(
          userNames.includes(editingTransaction.paid_by_user_name)
            ? editingTransaction.paid_by_user_name
            : userNames[0]
        );
        setSelectedReimbursesTransactionId(
          editingTransaction.reimburses_transaction_id || "none"
        );
        if (currentType === "settlement") {
          setPaidToUserName(
            userNames.includes(editingTransaction.paid_to_user_name)
              ? editingTransaction.paid_to_user_name
              : userNames.find(
                  (u: any) => u !== editingTransaction.paid_by_user_name
                ) || ""
          );
          setSelectedCategoryId("");
          setSplitType("");
        } else if (currentType === "expense") {
          // Prefer category_id if present, else match by name
          let categoryToEdit = null;
          if (editingTransaction.category_id) {
            categoryToEdit = categories.find(
              (c: any) => c.id === editingTransaction.category_id
            );
          }
          if (!categoryToEdit) {
            categoryToEdit = categories.find(
              (c: any) =>
                c.name.trim().toLowerCase() ===
                (editingTransaction.category_name || "").trim().toLowerCase()
            );
          }
          setSelectedCategoryId(
            categoryToEdit ? categoryToEdit.id : categories[0]?.id || ""
          );
          setSplitType(
            editingTransaction.split_type &&
              getExpenseSplitTypes(userNames).some(
                (s) => s.value === editingTransaction.split_type
              )
              ? editingTransaction.split_type
              : getExpenseSplitTypes(userNames)[0]?.value || "splitEqually"
          );
          setPaidToUserName("");
        } else if (
          currentType === "income" ||
          currentType === "reimbursement"
        ) {
          setSelectedCategoryId("");
          setSplitType("");
          setPaidToUserName("");
        }
      }, 100);
    } else if (!isEditing && categories.length > 0 && userNames.length > 0) {
      lastEditIdRef.current = null;
      setId(null);
      setTransactionType("expense");
      setDate(new Date().toISOString().slice(0, 10));
      setDescription("");
      setAmount("");
      setPaidOrReceivedBy(userNames[0]);
      setSelectedReimbursesTransactionId("none");
      setSelectedCategoryId(categories[0].id);
      setSplitType(getExpenseSplitTypes(userNames)[0]?.value || "splitEqually");
      setPaidToUserName("");
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isEditing, editingTransaction, categories, userNames]);

  useEffect(() => {
    setExpenseSplitTypes(getExpenseSplitTypes(userNames));
  }, [userNames]);

  const resetFormAndState = () => {
    setId(null);
    setTransactionType("expense");
    setDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setAmount("");
    setSelectedCategoryId("");
    setPaidOrReceivedBy("");
    setPaidToUserName("");
    setSplitType("");
    setSelectedReimbursesTransactionId("none");
    if (handleSetEditingTransaction) {
      handleSetEditingTransaction(null);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !description ||
      !amount ||
      isNaN(parseFloat(amount)) ||
      parseFloat(amount) <= 0
    ) {
      alert("Please fill in a valid description and amount.");
      return;
    }
    if (!paidOrReceivedBy) {
      alert(
        transactionType === "income" || transactionType === "reimbursement"
          ? "Please select who received."
          : "Please select who paid."
      );
      return;
    }

    let transactionDataPayload: Partial<any> = {
      transaction_type: transactionType,
      date,
      description,
      amount: parseFloat(amount),
      paid_by_user_name: paidOrReceivedBy,
      category_name: null,
      split_type: null,
      paid_to_user_name: null,
      reimburses_transaction_id:
        selectedReimbursesTransactionId === "none"
          ? null
          : selectedReimbursesTransactionId,
    };

    // Only add id if editing
    if (isEditing && id) {
      transactionDataPayload.id = id;
    }

    if (transactionType === "expense") {
      if (!selectedCategoryId) {
        alert("Please select a category for the expense.");
        return;
      }
      const categoryObject = categories.find(
        (c: any) => c.id === selectedCategoryId
      );
      transactionDataPayload.category_name = categoryObject
        ? categoryObject.name
        : null;
      if (!transactionDataPayload.category_name && selectedCategoryId) {
        alert("Invalid category selected.");
        return;
      }
      if (!splitType) {
        alert("Please select a split type for the expense.");
        return;
      }
      transactionDataPayload.split_type = splitType;
    } else if (transactionType === "settlement") {
      if (!paidToUserName) {
        alert("Please select who is being paid for the settlement.");
        return;
      }
      if (paidOrReceivedBy === paidToUserName) {
        alert("Payer and Payee cannot be the same for a settlement.");
        return;
      }
      transactionDataPayload.paid_to_user_name = paidToUserName;
      transactionDataPayload.category_name = "Settlement";
    } else if (transactionType === "income") {
      transactionDataPayload.category_name = null;
    } else if (transactionType === "reimbursement") {
      // If reimbursing a specific transaction, copy its category
      if (selectedReimbursesTransactionId !== "none") {
        const reimbursedExpense = transactions.find(
          (t: any) => t.id === selectedReimbursesTransactionId
        );
        transactionDataPayload.category_name =
          reimbursedExpense?.category_name || null;
      } else {
        transactionDataPayload.category_name = null;
      }
    }

    if (isEditing) {
      updateTransaction(transactionDataPayload);
    } else {
      onAddTransaction(transactionDataPayload);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
    resetFormAndState();
  };

  const handleCancelEdit = () => {
    resetFormAndState();
    navigate("/");
  };
  const availablePayees = userNames.filter(
    (name: any) => name !== paidOrReceivedBy
  );
  const paidOrReceivedByLabel =
    transactionType === "income" || transactionType === "reimbursement"
      ? "Received By:"
      : transactionType === "settlement"
      ? "Payer:"
      : "Paid By:";

  return (
    <>
      {showSuccess && (
        <div className="sticky top-0 left-0 w-full flex justify-center z-50">
          <div className="max-w-md w-full m-4">
            <Alert>
              <AlertTitle>Transaction Added!</AlertTitle>
              <AlertDescription>
                Your transaction was successfully added.
                <button
                  className="ml-4 text-xs underline"
                  onClick={() => setShowSuccess(false)}
                >
                  Dismiss
                </button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      <Card className="max-w-xl mx-auto w-full">
        <CardHeader>
          <CardTitle>
            {isEditing
              ? `Edit ${editingTransaction?.transaction_type || "Transaction"}`
              : `Add New ${
                  transactionType.charAt(0).toUpperCase() +
                  transactionType.slice(1)
                }`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Select
                value={transactionType}
                onValueChange={setTransactionType}
                disabled={isEditing}
              >
                <SelectTrigger id="transactionType" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border border-border">
                  {TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full h-9 rounded-md px-3 py-2 bg-background text-sm appearance-none"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full h-9 rounded-md px-3 py-2 bg-background text-sm"
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                required
                className="w-full h-9 rounded-md px-3 py-2 bg-background text-sm"
              />
            </div>
            <div>
              <Label htmlFor="paidOrReceivedBy">{paidOrReceivedByLabel}</Label>
              <Select
                value={paidOrReceivedBy}
                onValueChange={setPaidOrReceivedBy}
                required
              >
                <SelectTrigger id="paidOrReceivedBy" className="bg-background">
                  <SelectValue placeholder="-- Select User --" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border border-border">
                  {userNames.map((user: any) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                  {transactionType === "expense" && (
                    <SelectItem key="shared" value="Shared">
                      Shared
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {transactionType === "settlement" && (
              <div>
                <Label htmlFor="paidToUserName">Payee</Label>
                <Select
                  value={paidToUserName}
                  onValueChange={setPaidToUserName}
                  required
                >
                  <SelectTrigger id="paidToUserName" className="bg-background">
                    <SelectValue placeholder="-- Select User --" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border border-border">
                    {availablePayees.map((user: any) => (
                      <SelectItem key={user} value={user}>
                        {user}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {transactionType === "expense" && (
              <>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={setSelectedCategoryId}
                    required
                  >
                    <SelectTrigger id="category" className="bg-background">
                      <SelectValue placeholder="-- Select a Category --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border border-border">
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="splitType">Split Type</Label>
                  <Select
                    value={splitType}
                    onValueChange={setSplitType}
                    required
                  >
                    <SelectTrigger id="splitType" className="bg-background">
                      <SelectValue placeholder="-- Select a Split Type --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border border-border">
                      {EXPENSE_SPLIT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {transactionType === "reimbursement" && (
              <div>
                <Label htmlFor="reimbursesTransaction">
                  Reimburses Expense (Optional)
                </Label>
                <Select
                  value={selectedReimbursesTransactionId}
                  onValueChange={setSelectedReimbursesTransactionId}
                >
                  <SelectTrigger
                    id="reimbursesTransaction"
                    className="bg-background"
                  >
                    <SelectValue placeholder="-- None (General Reimbursement) --" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border border-border">
                    <SelectItem value="none">
                      -- None (General Reimbursement) --
                    </SelectItem>
                    {availableExpensesForReimbursement.map((exp: any) => (
                      <SelectItem key={exp.id} value={exp.id}>
                        {exp.date} - {exp.description} (${exp.amount.toFixed(2)}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 mt-4 justify-center">
              <Button
                type="submit"
                className="bg-[#FFD54F] hover:bg-[#FFD54F] active:bg-[#FFD54F] text-black font-bold rounded shadow transition-colors duration-200 border-none"
              >
                {isEditing ? "Update Transaction" : "Add Transaction"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default TransactionForm;
