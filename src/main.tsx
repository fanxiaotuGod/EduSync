/**
 * Application entry / 应用入口
 *
 * AuthProvider wraps the whole tree so any component can call useAuth() /
 * 用 AuthProvider 包裹整棵 React 树，这样子组件里都能使用 useAuth()
 */
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "@/context/AuthContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
