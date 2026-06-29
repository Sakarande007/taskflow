import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

const init = { user: null, loading: true, isAuthenticated: false };

function reducer(state, action) {
  switch (action.type) {
    case "SET_USER":  return { user: action.payload, loading: false, isAuthenticated: true };
    case "LOGOUT":    return { user: null,           loading: false, isAuthenticated: false };
    case "DONE":      return { ...state,              loading: false };
    default:          return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init);

  // On mount — try to restore session
  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/api/user/profile");
        dispatch({ type: "SET_USER", payload: res.data.data });
      } catch {
        dispatch({ type: "DONE" });
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await API.post("/api/user/login", { email, password });
    const { accesstoken } = res.data.data;
    if (accesstoken) localStorage.setItem("tf_access_token", accesstoken);
    // Fetch full profile (includes role, department, etc)
    const profile = await API.get("/api/user/profile");
    dispatch({ type: "SET_USER", payload: profile.data.data });
    return profile.data.data;
  }, []);

  const logout = useCallback(async () => {
    try { await API.get("/api/user/logout"); } catch {}
    localStorage.removeItem("tf_access_token");
    dispatch({ type: "LOGOUT" });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
