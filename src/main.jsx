// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // Our main App component
import "./index.css";

// 1. Import necessary things from 'react-router-dom'
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// 2. Import your page components
import DashboardPage from "./pages/DashboardPage.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

// 3. Define the router configuration
const router = createBrowserRouter([
  {
    path: "/", // The main path for our application
    element: <App />, // The App component will render for this path AND its children
    children: [
      // These are "nested" routes that will render inside App's <Outlet />
      {
        index: true, // This is the default child route for '/'
        element: <DashboardPage />,
      },
      {
        path: "transactions", // Corresponds to '/transactions'
        element: <TransactionsPage />,
      },
      {
        path: "settings", // Corresponds to '/settings'
        element: <SettingsPage />,
      },
    ],
  },
  // You could define other top-level paths here, e.g., an auth section
  // { path: '/login', element: <LoginPage /> }
]);

// 4. Provide the router to your application
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
