// src/components/TransactionForm.jsx
import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

function TransactionForm({ onAddTransaction }) {
  const {
    userNames,
    categories, // Array of objects: [{ id, name }, ...]
    editingTransaction,
    updateTransaction,
    handleSetEditingTransaction,
  } = useOutletContext();

  const navigate = useNavigate();

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

  // Form state
  const [id, setId] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  // category state should store the ID of the selected category
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [paidBy, setPaidBy] = useState(""); // Will be initialized by useEffect
  const [splitType, setSplitType] = useState(
    SPLIT_TYPES[0]?.value || "splitEqually"
  );

  const isEditing = !!editingTransaction;

  useEffect(() => {
    // Update SPLIT_TYPES if userNames change
    setSPLIT_TYPES(getSplitTypes(userNames));

    // Initialize paidBy
    if (userNames.length > 0 && !userNames.includes(paidBy)) {
      setPaidBy(userNames[0]);
    } else if (userNames.length === 0 && paidBy !== "") {
      setPaidBy("");
    }

    // Initialize selectedCategoryId
    if (categories.length > 0 && !selectedCategoryId) {
      // If not editing and no category selected yet, default to first category's ID
      if (!isEditing) {
        setSelectedCategoryId(categories[0].id);
      }
    } else if (categories.length === 0 && selectedCategoryId !== "") {
      setSelectedCategoryId("");
    }
  }, [userNames, categories, paidBy, selectedCategoryId, isEditing]);

  useEffect(() => {
    if (isEditing && editingTransaction) {
      setId(editingTransaction.id);
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setPaidBy(editingTransaction.paid_by_user_name); // Use DB field name
      setSplitType(editingTransaction.split_type); // Use DB field name

      // Find the ID of the category whose name matches editingTransaction.category_name
      const categoryToEdit = categories.find(
        (c) => c.name === editingTransaction.category_name
      );
      setSelectedCategoryId(
        categoryToEdit
          ? categoryToEdit.id
          : categories.length > 0
          ? categories[0].id
          : ""
      );
    } else {
      // Reset form for new transaction
      setId(null);
      setDate(new Date().toISOString().slice(0, 10));
      setDescription("");
      setAmount("");
      setSelectedCategoryId(categories.length > 0 ? categories[0].id : "");
      setPaidBy(userNames.length > 0 ? userNames[0] : "");
      setSplitType(getSplitTypes(userNames)[0]?.value || "splitEqually");
    }
  }, [isEditing, editingTransaction, categories, userNames]); // Rerun when editing state or dependent data changes

  const resetFormAndState = () => {
    // ... (reset logic from previous version, ensure selectedCategoryId is reset correctly)
    setId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setAmount("");
    setSelectedCategoryId(categories.length > 0 ? categories[0].id : "");
    setPaidBy(userNames.length > 0 ? userNames[0] : "");
    setSplitType(getSplitTypes(userNames)[0]?.value || "splitEqually");
    if (handleSetEditingTransaction) {
      // Check if function exists before calling
      handleSetEditingTransaction(null);
    }
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
      alert("Please select who paid.");
      return;
    }
    if (!selectedCategoryId) {
      // Check selectedCategoryId
      alert("Please select a category.");
      return;
    }

    // Find the name of the selected category using its ID
    const selectedCategoryObject = categories.find(
      (c) => c.id === selectedCategoryId
    );
    const categoryNameForSubmission = selectedCategoryObject
      ? selectedCategoryObject.name
      : null;

    if (!categoryNameForSubmission) {
      alert("Selected category is invalid. Please try again.");
      return;
    }

    const transactionData = {
      id,
      date,
      description,
      amount: parseFloat(amount),
      category: categoryNameForSubmission, // Submit category NAME as App.jsx expects
      paidBy, // This is already a user name string
      splitType,
    };

    if (isEditing) {
      updateTransaction(transactionData);
      alert("Transaction updated!");
    } else {
      onAddTransaction(transactionData);
      alert("Transaction added!");
    }
    resetFormAndState();
    navigate("/");
  };

  const handleCancelEdit = () => {
    resetFormAndState();
    navigate("/");
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
          value={selectedCategoryId} /* Use selectedCategoryId for value */
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          required
        >
          <option value="">-- Select a Category --</option>{" "}
          {/* Added a default empty option */}
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
          {categories.length === 0 && (
            <option value="" disabled>
              Please add categories in Settings
            </option>
          )}
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
          <option value="">-- Select User --</option>{" "}
          {/* Added a default empty option */}
          {userNames.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
          {userNames.length === 0 && (
            <option value="" disabled>
              Please add users in Settings
            </option>
          )}
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
