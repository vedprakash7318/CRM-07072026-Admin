import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Users,
  Search,
  UserCheck,
  Timer,
  Layers,
  Star,
  Briefcase,
  Tag,
  Bell,
  FileText,
  GitBranch,
  BarChart3,
  Filter,
  Settings
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "./CSS/Dashboard.css";

const Dashboard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  // ✅ Menu List with Direct Icons
  const menuList = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },

    {
      label: "Leads",
      icon: Users,
      key: "leads",
      children: [
        { label: "Total Leads", path: "/leads" },
        { label: "Assigned Leads", path: "/assignedLeads" },
        { label: "Unassigned Leads", path: "/unassignedLeads" },
        { label: "Excel Upload Leads", path: "/excel-leads-admin" }
      ]
    },


    { label: "Search Leads", path: "/search", icon: Search },
    { label: "Enquiries", path: "/enquiries", icon: Users },
    { label: "Employee", path: "/employee", icon: UserCheck },

    { label: "Notification", path: "/notifications", icon: Bell },
    {
      label: "Requests",
      icon: FileText,
      key: "requests",
      children: [
        { label: "Tag Requests", path: "/request" },
        { label: "Lead Transfers", path: "/lead-requests" }
      ]
    },
    {
      label: "Reports",
      icon: BarChart3,
      key: "reports",
      children: [
        { label: "Daily Work Stats", path: "/emp-work" },
        { label: "All-Over Report", path: "/employee-report" }
      ]
    },
    {
      key: "setting",
      label: "Setting",
      icon: Settings,
      children: [
        { label: "Leads Status", path: "/status", icon: Timer },
        { label: "Lead Sources", path: "/source", icon: Layers },
        { label: "Priority", path: "/priority", icon: Star },
        { label: "Services", path: "/services", icon: Briefcase },
        { label: "Tags", path: "/tag", icon: Tag },
        { label: "Tag Parent", path: "/tag-parent", icon: GitBranch }
      ]
    },

  ];


  // ✅ Check active submenu
  const isParentActive = (item) => {
    if (!item.children) return false;
    return item.children.some(child => location.pathname === child.path);
  };

  // ✅ Auto open submenu
  useEffect(() => {
    menuList.forEach(item => {
      if (item.children && isParentActive(item)) {
        setOpenSubmenu(item.key);
      }
    });
  }, [location.pathname]);

  // ✅ Logout
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const check = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", check);
    return () => document.removeEventListener("mousedown", check);
  }, []);

  // ✅ Responsive sidebar
  useEffect(() => {
    const detect = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    detect();
    window.addEventListener("resize", detect);
    return () => window.removeEventListener("resize", detect);
  }, []);

  const handleProfileToggle = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate("/profile");
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    handleLogout();
  };

  return (
    <div className="dashboard">

      {/* Mobile Overlay */}
      {isSidebarOpen && isMobile && (
        <div className="overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isSidebarOpen ? "open" : "closed"} ${isMobile ? "mobile" : ""
          }`}
      >
        <div className="sidebar-content">

          {/* Header */}
          <div className="sidebar-header">
            {isSidebarOpen ? (
              <div className="logo">
                <div className="logo-icon">D</div>
                <h2>Dashboard</h2>
              </div>
            ) : (
              <div className="logo-icon">D</div>
            )}
          </div>

          {/* Menu */}
          <nav className="nav">
            <ul>
              {menuList.map((item) => {
                const IconComponent = item.icon || Users;

                return (
                  <li key={item.label}>
                    {!item.children ? (
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => isActive ? "active" : ""}
                        onClick={() => isMobile && setIsSidebarOpen(false)}
                      >
                        <div className={`nav-btn ${!isSidebarOpen ? "collapsed" : ""}`}>
                          <IconComponent className="nav-icon" />
                          {isSidebarOpen && <span>{item.label}</span>}
                        </div>
                      </NavLink>
                    ) : (
                      <>
                        <div
                          className={`nav-btn has-sub ${openSubmenu === item.key ? "submenu-open" : ""
                            } ${!isSidebarOpen ? "collapsed" : ""} ${isParentActive(item) ? "active" : ""
                            }`}
                          onClick={() =>
                            setOpenSubmenu(openSubmenu === item.key ? null : item.key)
                          }
                        >
                          <IconComponent className="nav-icon" />
                          {isSidebarOpen && <span>{item.label}</span>}
                          {isSidebarOpen && (
                            <ChevronDown
                              className={openSubmenu === item.key ? "rotate" : ""}
                            />
                          )}
                        </div>

                        {openSubmenu === item.key && isSidebarOpen && (
                          <ul className="submenu">
                            {item.children.map((sub) => (
                              <li key={sub.path}>
                                <NavLink
                                  to={sub.path}
                                  className={({ isActive }) =>
                                    `submenu-item ${isActive ? "active" : ""}`
                                  }
                                  onClick={() => isMobile && setIsSidebarOpen(false)}
                                >
                                  {sub.label}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          {isSidebarOpen && (
            <div className="sidebar-footer">
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div
        className={`main ${isSidebarOpen && !isMobile
          ? "expanded"
          : isMobile
            ? "mobile"
            : "collapsed"
          }`}
      >
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <button
                className="menu-btn"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X /> : <Menu />}
              </button>
              <h1 className="title">Welcome Back!</h1>
            </div>

            {/* Profile */}
            <div className="header-right" ref={dropdownRef}>
              <div className="user" onClick={handleProfileToggle}>
                <div className="avatar">AD</div>
                <div className="user-info">
                  <p>Admin</p>
                  <p>Panel</p>
                </div>
                <ChevronDown />
              </div>

              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <ul>
                    <li onClick={handleProfileClick}>Profile</li>
                    <li onClick={handleLogoutClick}>Logout</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
};

export default Dashboard;