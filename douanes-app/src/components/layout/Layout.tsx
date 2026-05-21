// src/components/layout/Layout.tsx
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./Navbar";
import RightSidebar from "./RightSidebar";
import { initThemePreferences } from "../../utils/themeUtils";

export default function Layout() {
  useEffect(() => {
    initThemePreferences();
    const preloader = document.querySelector(".pre-loader");
    if (preloader) preloader.classList.add("hidden");
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f2f4f9', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <RightSidebar />
      <div style={{ flex: 1, padding: '24px 28px' }}>
        <Outlet />
      </div>
    </div>
  );
}