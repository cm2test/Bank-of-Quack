// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

function SettingsPage() {
  const {
    userNames,
    updateUserNames,
    categories, // Now an array of objects: [{ id, name }, ...]
    addCategory,
    deleteCategory,
    sectors, // Array of objects: [{ id, name, category_ids: [] }, ...]
    addSector,
    deleteSector,
    addCategoryToSector,
    removeCategoryFromSector,
  } = useOutletContext();

  // Local state for User Names form
  const [user1NameInput, setUser1NameInput] = useState("");
  const [user2NameInput, setUser2NameInput] = useState("");

  // Local state for Categories form
  const [newCategoryInput, setNewCategoryInput] = useState("");

  // Local state for Sectors form
  const [newSectorInput, setNewSectorInput] = useState("");
  const [selectedCategoryForSector, setSelectedCategoryForSector] =
    useState(""); // Stores category ID

  // Effect to initialize user name inputs when userNames context updates
  useEffect(() => {
    if (userNames && userNames.length >= 2) {
      setUser1NameInput(userNames[0]);
      setUser2NameInput(userNames[1]);
    }
  }, [userNames]);

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
      addCategory(newCategoryInput.trim()); // addCategory in App.jsx handles if it exists
      setNewCategoryInput("");
    }
  };

  const handleDeleteCategory = (category) => {
    // category is now an object {id, name}
    if (
      window.confirm(
        `Are you sure you want to delete the category "${category.name}"? This will also remove it from any sectors.`
      )
    ) {
      deleteCategory(category); // deleteCategory in App.jsx handles checking transactions
    }
  };

  const handleAddSector = async (e) => {
    e.preventDefault();
    if (newSectorInput.trim()) {
      const newSector = await addSector(newSectorInput.trim()); // addSector now returns the new sector or null
      if (newSector) {
        setNewSectorInput("");
        // Optionally, auto-select this new sector for category assignment or scroll to it
      }
    }
  };

  const handleDeleteSector = (sector) => {
    if (
      window.confirm(
        `Are you sure you want to delete the sector "${sector.name}"? All category associations for this sector will be removed.`
      )
    ) {
      deleteSector(sector.id);
    }
  };

  const handleAddCategoryToSectorSubmit = (e, sectorId) => {
    e.preventDefault();
    if (sectorId && selectedCategoryForSector) {
      addCategoryToSector(sectorId, selectedCategoryForSector);
      setSelectedCategoryForSector(""); // Reset dropdown for this form
    } else {
      alert("Please select a category to add.");
    }
  };

  return (
    <div>
      <h2>Settings</h2>

      {/* User Names Management */}
      <section
        style={{
          marginBottom: "30px",
          paddingBottom: "20px",
          borderBottom: "1px solid #eee",
        }}
      >
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
      <section
        style={{
          marginBottom: "30px",
          paddingBottom: "20px",
          borderBottom: "1px solid #eee",
        }}
      >
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
          <p>No categories defined.</p>
        ) : (
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {categories.map((cat) => (
              <li
                key={cat.id}
                style={{
                  marginBottom: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  maxWidth: "350px",
                }}
              >
                <span>
                  {cat.name} (ID: {cat.id.substring(0, 6)})
                </span>{" "}
                {/* Show part of ID for uniqueness if names clash, or remove ID display */}
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  style={{ marginLeft: "10px" }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sectors Management */}
      <section>
        <h3>Manage Sectors</h3>
        <form onSubmit={handleAddSector} style={{ marginBottom: "20px" }}>
          <label htmlFor="newSector">Add New Sector: </label>
          <input
            type="text"
            id="newSector"
            value={newSectorInput}
            onChange={(e) => setNewSectorInput(e.target.value)}
          />
          <button type="submit" style={{ marginLeft: "5px" }}>
            Add Sector
          </button>
        </form>

        <h4>Existing Sectors:</h4>
        {sectors.length === 0 ? (
          <p>No sectors defined yet.</p>
        ) : (
          sectors.map((sector) => (
            <div
              key={sector.id}
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                marginBottom: "15px",
                maxWidth: "500px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <strong>{sector.name}</strong>
                <button onClick={() => handleDeleteSector(sector)}>
                  Delete Sector
                </button>
              </div>

              <h5>Categories in this Sector:</h5>
              {sector.category_ids && sector.category_ids.length > 0 ? (
                <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                  {sector.category_ids.map((catId) => {
                    const category = categories.find((c) => c.id === catId);
                    return (
                      <li
                        key={catId}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "3px",
                        }}
                      >
                        <span>
                          {category ? category.name : "Unknown Category"}
                        </span>
                        <button
                          onClick={() =>
                            removeCategoryFromSector(sector.id, catId)
                          }
                          style={{ fontSize: "0.8em", padding: "2px 5px" }}
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={{ fontStyle: "italic", fontSize: "0.9em" }}>
                  No categories assigned to this sector yet.
                </p>
              )}

              <form
                onSubmit={(e) => handleAddCategoryToSectorSubmit(e, sector.id)}
                style={{
                  marginTop: "15px",
                  borderTop: "1px dashed #eee",
                  paddingTop: "10px",
                }}
              >
                <label htmlFor={`addCatToSector-${sector.id}`}>
                  Add Category to "{sector.name}":{" "}
                </label>
                <select
                  id={`addCatToSector-${sector.id}`}
                  value={selectedCategoryForSector} // This state is shared, might need per-sector state for dropdowns
                  // Or reset it upon successful add. For now, using shared state.
                  onChange={(e) => setSelectedCategoryForSector(e.target.value)}
                  style={{ marginRight: "5px" }}
                >
                  <option value="">-- Select a Category --</option>
                  {categories
                    .filter(
                      (cat) =>
                        !(
                          sector.category_ids &&
                          sector.category_ids.includes(cat.id)
                        )
                    ) // Only show categories not already in this sector
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                <button type="submit">Add to Sector</button>
              </form>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default SettingsPage;
