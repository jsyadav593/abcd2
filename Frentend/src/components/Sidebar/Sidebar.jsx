import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./Sidebar.css";

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className={collapsed ? "menu-bar collapsed" : "menu-bar"}>
      <ul className="menu">
        <li>
          <Link to="/users">
            <span className="material-icons">person</span>
            User
          </Link>
        </li>

        {/* INVENTORY (HOVER) */}
        <li className="dropdown has-submenu">
          <Link type="button" className="menu-btn menu-link">
           
            <span className="material-icons">inventory_2</span>
            Assets
          </Link>

          <ul className="dropdown-menu">
            <li>
              <Link to="/inventory">
                <span className="material-icons">inventory</span> Inventory
              </Link>
            </li>
            <li>
              <Link to="/accessory">
                <span className="material-icons">headphones</span> Accessories
              </Link>
            </li>
            <li>
              <Link to="/peripheral">
                <span className="material-icons">keyboard</span> Peripherals
              </Link>
            </li>
          </ul>
        </li>

        <li>
          <Link to="/issue-item">
            <span className="material-icons">assignment_ind</span> Issue To
          </Link>
        </li>

        <li>
          <Link to="/repair">
            <span className="material-icons">build</span> Repair
          </Link>
        </li>

        <li>
          <Link to="/upgrade">
            <span className="material-icons">upgrade</span> Upgrade
          </Link>
        </li>

        <li>
          <Link to="/report">
            <span className="material-icons">bar_chart</span> Report
          </Link>
        </li>

      </ul>

      {/* USER DETAILS (HOVER) */}
       <div
        ref={userRef}
        className={`user-details ${userOpen ? "active" : ""}`}
      >
        <button
          className="user-toggle"
          onClick={() => setUserOpen((prev) => !prev)}
        >
          <span className="material-icons">account_circle</span>
          John Doe
        </button>

        <div className="user-panel">
          <button
            onClick={() => {
              navigate("/profile");
              setUserOpen(false);
            }}
          >
            <span className="material-icons">person</span> Profile
          </button>

          <button onClick={() => setUserOpen(false)}>
            <span className="material-icons">image</span> Change Image
          </button>

          <button onClick={() => setUserOpen(false)}>
            <span className="material-icons">logout</span> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
