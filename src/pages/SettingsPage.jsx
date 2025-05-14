// src/pages/SettingsPage.jsx
import { useState } from "react";
import { useOutletContext } from "react-router-dom";

function SettingsPage() {
  const {
    userNames,
    updateUserNames,
    categories,
    addCategory,
    deleteCategory,
  } = useOutletContext();

  // Local state for the input fields
  const [user1NameInput, setUser1NameInput] = useState(userNames[0] || "");
  const [user2NameInput, setUser2NameInput] = useState(userNames[1] || "");
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const handleUserNamesSave = (e) => {
    e.preventDefault();
    if (user1NameInput.trim() && user2NameInput.trim()) {
      updateUserNames(user1NameInput.trim(), user2NameInput.trim());
      alert("User names updated!");
    } else {
      alert("User names cannot be empty.");
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCategoryInput.trim()) {
      addCategory(newCategoryInput.trim());
      setNewCategoryInput(""); // Clear input
    }
  };

  return (
    <div>
      <h2>Settings</h2>

      {/* User Names Management */}
      <section style={{ marginBottom: "30px" }}>
        <h3>User Names</h3>
        <form onSubmit={handleUserNamesSave}>
          <div>
            <label htmlFor="user1Name">User 1 Name: </label>
            <input
              type="text"
              id="user1Name"
              value={user1NameInput}
              onChange={(e) => setUser1NameInput(e.target.value)}
              required
            />
          </div>
          <div style={{ marginTop: "10px" }}>
            <label htmlFor="user2Name">User 2 Name: </label>
            <input
              type="text"
              id="user2Name"
              value={user2NameInput}
              onChange={(e) => setUser2NameInput(e.target.value)}
              required
            />
          </div>
          <button type="submit" style={{ marginTop: "10px" }}>
            Save User Names
          </button>
        </form>
      </section>

      {/* Categories Management */}
      <section>
        <h3>Manage Categories</h3>
        <form onSubmit={handleAddCategory} style={{ marginBottom: "10px" }}>
          <label htmlFor="newCategory">Add New Category: </label>
          <input
            type="text"
            id="newCategory"
            value={newCategoryInput}
            onChange={(e) => setNewCategoryInput(e.target.value)}
          />
          <button type="submit" style={{ marginLeft: "5px" }}>
            Add Category
          </button>
        </form>

        <h4>Existing Categories:</h4>
        {categories.length === 0 ? (
          <p>No categories defined yet.</p>
        ) : (
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {categories.map((cat) => (
              <li
                key={cat}
                style={{
                  marginBottom: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  maxWidth: "300px",
                }}
              >
                <span>{cat}</span>
                <button
                  onClick={() => deleteCategory(cat)}
                  style={{ marginLeft: "10px" }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default SettingsPage;
