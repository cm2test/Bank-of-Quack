// src/components/TransactionForm.jsx
import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

function TransactionForm({ onAddTransaction }) {
  // onAddTransaction is still passed for new transactions
  const {
    userNames,
    categories,
    editingTransaction, // Get the transaction being edited
    updateTransaction, // Get the update function
    handleSetEditingTransaction, // To clear editing state on cancel or successful add
  } = useOutletContext();

  const navigate = useNavigate();

  // Dynamically create SPLIT_TYPES based on userNames
  const getSplitTypes = (currentUsers) => [
    { value: "splitEqually", label: "Split Equally" },
    {
      value: "user1_only",
      label:
        currentUsers && currentUsers.length > 0
          ? `For ${currentUsers[0]} Only`
          : "For User 1 Only",
    },
    {
      value: "user2_only",
      label:
        currentUsers && currentUsers.length > 1
          ? `For ${currentUsers[1]} Only`
          : "For User 2 Only",
    },
  ];

  const [SPLIT_TYPES, setSPLIT_TYPES] = useState(getSplitTypes(userNames));

  const [id, setId] = useState(null); // To store ID when editing
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(
    categories.length > 0 ? categories[0] : ""
  );
  const [paidBy, setPaidBy] = useState(
    userNames.length > 0 ? userNames[0] : ""
  );
  const [splitType, setSplitType] = useState(
    SPLIT_TYPES[0]?.value || "splitEqually"
  );

  const isEditing = !!editingTransaction; // True if editingTransaction is not null

  useEffect(() => {
    // Update SPLIT_TYPES if userNames change
    setSPLIT_TYPES(getSplitTypes(userNames));

    // If userNames or categories change, update default selections if current ones are invalid
    if (userNames.length > 0 && !userNames.includes(paidBy)) {
      setPaidBy(userNames[0]);
    } else if (userNames.length === 0 && paidBy !== "") {
      setPaidBy("");
    }

    if (categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
    } else if (categories.length === 0 && category !== "") {
      setCategory("");
    }
  }, [userNames, categories, paidBy, category]); // Rerun when these change

  useEffect(() => {
    if (isEditing) {
      // Populate form with editingTransaction data
      setId(editingTransaction.id);
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString()); // Amount is number, input expects string
      setCategory(editingTransaction.category);
      setPaidBy(editingTransaction.paidBy);
      setSplitType(editingTransaction.splitType);
    } else {
      // Reset form for new transaction (or if editingTransaction becomes null)
      setId(null);
      setDate(new Date().toISOString().slice(0, 10));
      setDescription("");
      setAmount("");
      setCategory(categories.length > 0 ? categories[0] : "");
      setPaidBy(userNames.length > 0 ? userNames[0] : "");
      setSplitType(getSplitTypes(userNames)[0]?.value || "splitEqually");
    }
  }, [isEditing, editingTransaction, categories, userNames]); // Rerun when editing state changes

  const resetFormAndState = () => {
    setId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setAmount("");
    setCategory(categories.length > 0 ? categories[0] : "");
    setPaidBy(userNames.length > 0 ? userNames[0] : "");
    setSplitType(getSplitTypes(userNames)[0]?.value || "splitEqually");
    handleSetEditingTransaction(null); // Clear the editing state in App.jsx
  };

  const handleSubmit = (event) => {
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
    if (!paidBy) {
      alert(
        "Please select who paid. Configure users in Settings if the list is empty."
      );
      return;
    }
    if (!category) {
      alert(
        "Please select a category. Configure categories in Settings if the list is empty."
      );
      return;
    }

    const transactionData = {
      id, // Will be null for new transactions, or the existing ID for updates
      date,
      description,
      amount: parseFloat(amount),
      category,
      paidBy,
      splitType,
    };

    if (isEditing) {
      updateTransaction(transactionData);
      alert("Transaction updated!");
    } else {
      onAddTransaction(transactionData); // onAddTransaction is from TransactionsPage
      alert("Transaction added!");
    }
    resetFormAndState();
    navigate("/"); // Navigate to dashboard after add/update
  };

  const handleCancelEdit = () => {
    resetFormAndState();
    navigate("/"); // Or wherever you want to go after cancelling edit
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{isEditing ? "Edit Transaction" : "Add New Transaction"}</h3>
      <div>
        <label htmlFor="date">Date:</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="description">Description:</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="amount">Amount:</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          required
        />
      </div>
      <div>
        <label htmlFor="category">Category:</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          {categories.length === 0 && (
            <option value="">Please add categories in Settings</option>
          )}
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="paidBy">Paid By:</label>
        <select
          id="paidBy"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          required
        >
          {userNames.length === 0 && (
            <option value="">Please add users in Settings</option>
          )}
          {userNames.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="splitType">Split Type:</label>
        <select
          id="splitType"
          value={splitType}
          onChange={(e) => setSplitType(e.target.value)}
        >
          {SPLIT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit">
        {isEditing ? "Update Transaction" : "Add Transaction"}
      </button>
      {isEditing && (
        <button
          type="button"
          onClick={handleCancelEdit}
          style={{ marginLeft: "10px" }}
        >
          Cancel Edit
        </button>
      )}
    </form>
  );
}

export default TransactionForm;
