import React, { useState, useEffect } from "react";
import Dashboard from "../Components/Dashboard";
import "./CSS/Profile.css";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const userString = sessionStorage.getItem("Name");
  const nameData = userString ? JSON.parse(userString) : {};

  const [user, setUser] = useState({
    name: nameData.name || "",
    email: nameData.email || "",
    phone: nameData.mobile || "",
  });

  // 🔥 Get 2-letter initials from name
  const getInitials = (fullName) => {
    if (!fullName) return "";
    const words = fullName.trim().split(" ");
    return words.length >= 2
      ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
      : words[0][0].toUpperCase();
  };

  const handleEditSaveToggle = () => {
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    const tokenId = sessionStorage.getItem("Token");
    if (!tokenId) {
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Dashboard active={"profile"}>
      <div className="profile-wrapper">
        <div className="profile-card">
          
          {/* Header */}
          <div className="profile-header">
            <div className="avatarProfile">
              {getInitials(user.name)}
            </div>
            <h2>{user.name || "Your Name"}</h2>
            <p>{user.email}</p>
          </div>

          {/* Body */}
          <div className="profile-body">
            <div className="input-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="input-group">
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                value={user.phone}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Button */}
          <div className="profile-footer">
            <button onClick={handleEditSaveToggle}>
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>
          </div>

        </div>
      </div>
    </Dashboard>
  );
}

export default Profile;