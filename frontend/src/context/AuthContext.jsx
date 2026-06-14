import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Fetch current user details
  const fetchUser = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  // Login with email and password
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      await fetchUser(data.access_token);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Register with email and password
  const register = async (email, password, name) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      await fetchUser(data.access_token);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Login with Google (OAuth flow in a Popup)
  const loginWithGoogle = () => {
    return new Promise((resolve) => {
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        `${API_BASE_URL}/api/auth/google`,
        "Google Sign In - AgentBond AI",
        `width=${width},height=${height},top=${top},left=${left}`
      );

      let completed = false;

      const handleMessage = async (event) => {
        if (completed) return;
        // Validate origin if production has specific domain
        if (event.data && event.data.type === "AUTH_SUCCESS") {
          completed = true;
          clearInterval(checkPopupClosed);
          window.removeEventListener("message", handleMessage);

          const googleToken = event.data.token;
          localStorage.setItem("token", googleToken);
          setToken(googleToken);
          try {
            await fetchUser(googleToken);
            resolve({ success: true });
          } catch (err) {
            resolve({ success: false, error: err.message || "Failed to fetch user profile" });
          }
        }
      };

      window.addEventListener("message", handleMessage);

      // Check if popup is closed before completing
      const checkPopupClosed = setInterval(() => {
        if (completed) return;
        if (!popup || popup.closed) {
          // Give the message event listener a short window (200ms) to process any pending postMessage
          setTimeout(() => {
            if (completed) return;
            completed = true;
            clearInterval(checkPopupClosed);
            window.removeEventListener("message", handleMessage);
            resolve({ success: false, error: "Popup closed by user" });
          }, 200);
        }
      }, 1000);
    });
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
