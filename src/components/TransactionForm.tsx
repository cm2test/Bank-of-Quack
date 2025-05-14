// src/components/TransactionForm.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  ChangeEvent,
  FormEvent,
} from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Transaction, Category } from "../App";

interface TransactionFormProps {
  onAddTransaction: (t: Partial<Transaction>) => void;
}

interface TransactionFormContext {
  userNames: string[];
  categories: Category[];
  transactions: Transaction[];
  editingTransaction: Transaction | null;
  updateTransaction: (t: Partial<Transaction>) => void;
  handleSetEditingTransaction: (t: Transaction | null) => void;
}

const TRANSACTION_TYPES = [
  { value: "expense", label: "Expense" },
  { value: "settlement", label: "Settlement" },
  { value: "income", label: "Income" },
  { value: "reimbursement", label: "Reimbursement" },
];

const TransactionForm: React.FC<TransactionFormProps> = ({
  onAddTransaction,
}) => {
  const {
    userNames,
    categories,
    transactions,
    editingTransaction,
    updateTransaction,
    handleSetEditingTransaction,
  } = useOutletContext<TransactionFormContext>();

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
    useState<string>("");

  const isEditing = !!editingTransaction;

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
      .filter((t) => t.transaction_type === "expense")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  useEffect(() => {
    setExpenseSplitTypes(getExpenseSplitTypes(userNames));

    if (isEditing && editingTransaction) {
      setId(editingTransaction.id);
      const currentType = editingTransaction.transaction_type || "expense";
      setTransactionType(currentType);
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setPaidOrReceivedBy(editingTransaction.paid_by_user_name);
      setSelectedReimbursesTransactionId(
        editingTransaction.reimburses_transaction_id || ""
      );

      if (currentType === "settlement") {
        setPaidToUserName(editingTransaction.paid_to_user_name || "");
        setSelectedCategoryId("");
        setSplitType("");
      } else if (currentType === "expense") {
        const categoryToEdit = categories.find(
          (c) => c.name === editingTransaction.category_name
        );
        setSelectedCategoryId(categoryToEdit ? categoryToEdit.id : "");
        setSplitType(
          editingTransaction.split_type ||
            getExpenseSplitTypes(userNames)[0]?.value ||
            "splitEqually"
        );
        setPaidToUserName("");
      } else if (currentType === "income" || currentType === "reimbursement") {
        setSelectedCategoryId("");
        setSplitType("");
        setPaidToUserName("");
      }
    } else {
      setId(null);
      setDate(new Date().toISOString().slice(0, 10));
      setSelectedReimbursesTransactionId("");
    }
  }, [isEditing, editingTransaction, userNames, categories]);

  useEffect(() => {
    if (!isEditing) {
      setDate(new Date().toISOString().slice(0, 10));
      setAmount("");
      setPaidOrReceivedBy(userNames.length > 0 ? userNames[0] : "");
      setSelectedReimbursesTransactionId("");

      if (transactionType === "expense") {
        setDescription("");
        setSelectedCategoryId(categories.length > 0 ? categories[0].id : "");
        setSplitType(EXPENSE_SPLIT_TYPES[0]?.value || "splitEqually");
        setPaidToUserName("");
      } else if (transactionType === "settlement") {
        setDescription("Settlement");
        setSelectedCategoryId("");
        setSplitType("");
        if (userNames.length === 2 && paidOrReceivedBy) {
          setPaidToUserName(
            paidOrReceivedBy === userNames[0] ? userNames[1] : userNames[0]
          );
        } else if (userNames.length === 2) {
          setPaidToUserName(
            userNames[0] === userNames[0] ? userNames[1] : userNames[0]
          );
        } else {
          setPaidToUserName("");
        }
      } else if (transactionType === "income") {
        setDescription("Income");
        setSelectedCategoryId("");
        setSplitType("");
        setPaidToUserName("");
      } else if (transactionType === "reimbursement") {
        setDescription("Reimbursement for ");
        setSelectedCategoryId("");
        setSplitType("");
        setPaidToUserName("");
      }
    }
  }, [
    transactionType,
    isEditing,
    userNames,
    categories,
    EXPENSE_SPLIT_TYPES,
    paidOrReceivedBy,
  ]);

  useEffect(() => {
    if (transactionType === "settlement" && userNames.length === 2) {
      if (paidOrReceivedBy === userNames[0]) {
        setPaidToUserName(userNames[1]);
      } else if (paidOrReceivedBy === userNames[1]) {
        setPaidToUserName(userNames[0]);
      } else {
        setPaidToUserName("");
      }
    }
  }, [paidOrReceivedBy, transactionType, userNames]);

  const resetFormAndState = () => {
    setId(null);
    setTransactionType("expense");
    setDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setAmount("");
    setSelectedCategoryId(categories.length > 0 ? categories[0].id : "");
    setPaidOrReceivedBy(userNames.length > 0 ? userNames[0] : "");
    setPaidToUserName("");
    setSplitType(EXPENSE_SPLIT_TYPES[0]?.value || "splitEqually");
    setSelectedReimbursesTransactionId("");
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

    let transactionDataPayload: Partial<Transaction> = {
      id: id || undefined,
      transaction_type: transactionType,
      date,
      description,
      amount: parseFloat(amount),
      paid_by_user_name: paidOrReceivedBy,
      category_name: null,
      split_type: null,
      paid_to_user_name: null,
      reimburses_transaction_id: selectedReimbursesTransactionId || null,
    };

    if (transactionType === "expense") {
      if (!selectedCategoryId) {
        alert("Please select a category for the expense.");
        return;
      }
      const categoryObject = categories.find(
        (c) => c.id === selectedCategoryId
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
      transactionDataPayload.category_name = null;
    }

    if (isEditing) {
      updateTransaction(transactionDataPayload);
      alert("Transaction updated!");
    } else {
      onAddTransaction(transactionDataPayload);
      alert("Transaction added!");
    }
    resetFormAndState();
    navigate("/");
  };

  const handleCancelEdit = () => {
    resetFormAndState();
    navigate("/");
  };
  const availablePayees = userNames.filter((name) => name !== paidOrReceivedBy);
  const paidOrReceivedByLabel =
    transactionType === "income" || transactionType === "reimbursement"
      ? "Received By:"
      : transactionType === "settlement"
      ? "Payer:"
      : "Paid By:";

  return (
    <form onSubmit={handleSubmit}>
      <h3>
        {isEditing
          ? `Edit ${editingTransaction?.transaction_type || "Transaction"}`
          : `Add New ${
              transactionType.charAt(0).toUpperCase() + transactionType.slice(1)
            }`}
      </h3>
      <div>
        <label htmlFor="transactionType">Transaction Type:</label>
        <select
          id="transactionType"
          value={transactionType}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setTransactionType(e.target.value)
          }
          disabled={isEditing}
        >
          {TRANSACTION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="date">Date:</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDate(e.target.value)
          }
          required
        />
      </div>
      <div>
        <label htmlFor="description">Description:</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDescription(e.target.value)
          }
          required
        />
      </div>
      <div>
        <label htmlFor="amount">Amount:</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setAmount(e.target.value)
          }
          min="0.01"
          step="0.01"
          required
        />
      </div>
      <div>
        <label htmlFor="paidOrReceivedBy">{paidOrReceivedByLabel}</label>
        <select
          id="paidOrReceivedBy"
          value={paidOrReceivedBy}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setPaidOrReceivedBy(e.target.value)
          }
          required
        >
          <option value="">-- Select User --</option>
          {userNames.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
        </select>
      </div>
      {transactionType === "settlement" && (
        <div>
          <label htmlFor="paidToUserName">Payee:</label>
          <select
            id="paidToUserName"
            value={paidToUserName}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setPaidToUserName(e.target.value)
            }
            required
          >
            <option value="">-- Select User --</option>
            {availablePayees.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>
      )}

      {transactionType === "expense" && (
        <div>
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            value={selectedCategoryId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setSelectedCategoryId(e.target.value)
            }
            required
          >
            <option value="">-- Select a Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {transactionType === "reimbursement" && (
        <div>
          <label htmlFor="reimbursesTransaction">
            Reimburses Expense (Optional):
          </label>
          <select
            id="reimbursesTransaction"
            value={selectedReimbursesTransactionId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setSelectedReimbursesTransactionId(e.target.value)
            }
          >
            <option value="">-- None (General Reimbursement) --</option>
            {availableExpensesForReimbursement.map((exp) => (
              <option key={exp.id} value={exp.id}>
                {exp.date} - {exp.description} (${exp.amount.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      )}

      {transactionType === "expense" && (
        <div>
          <label htmlFor="splitType">Split Type:</label>
          <select
            id="splitType"
            value={splitType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setSplitType(e.target.value)
            }
            required
          >
            {EXPENSE_SPLIT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <button type="submit" style={{ marginTop: "10px" }}>
        {isEditing ? "Update Transaction" : "Add Transaction"}
      </button>
      {isEditing && (
        <button
          type="button"
          onClick={handleCancelEdit}
          style={{ marginLeft: "10px", marginTop: "10px" }}
        >
          Cancel Edit
        </button>
      )}
    </form>
  );
};

export default TransactionForm;
