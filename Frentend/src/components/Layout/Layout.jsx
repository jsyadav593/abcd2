import { useState } from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import "./Layout.css";

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => setCollapsed((p) => !p);

  return (
    <div className={`app-layout ${collapsed ? "collapsed" : ""}`}>
      <Header onToggleSidebar={handleToggle} />
      <Sidebar collapsed={collapsed} />

      <main className={`main-content ${collapsed ? "collapsed" : ""}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
