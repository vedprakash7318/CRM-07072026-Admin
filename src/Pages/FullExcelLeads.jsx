import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLocation, useNavigate } from "react-router-dom";
import './CSS/FullLeads.css';
import Dashboard from '../Components/Dashboard';
import axios from "axios";

function FullExcelLeads() {
  const APi_Url = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const { viewdata, TableTitle, fromEdit } = location.state || {};

  const [isDisabled, setIsDisabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Follow-ups state
  const [followUps, setFollowUps] = useState([]);
  const [isLoadingFollowUps, setIsLoadingFollowUps] = useState(true);

  // Dynamic Form Data
  const [formData, setFormData] = useState(viewdata?.dynamicData || {});

  useEffect(() => {
    const tokenId = localStorage.getItem('Token') || sessionStorage.getItem('Token');
    if (!tokenId) {
      navigate('/');
    }

    if (fromEdit) {
      setIsEditing(true);
      setIsDisabled(false);
    }
    
    if (viewdata?._id) {
        fetchFollowUps();
    }
  }, [navigate, fromEdit, viewdata]);

  const fetchFollowUps = async () => {
    setIsLoadingFollowUps(true);
    try {
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/followup/getall/${viewdata._id}`);
      if (response.status === 200) {
        setFollowUps(Array.isArray(response.data.followups) ? response.data.followups : []);
      }
    } catch (error) {
      console.error("Error fetching follow-up data:", error);
      toast.error("Error fetching follow-up data.");
    } finally {
      setIsLoadingFollowUps(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateBtn = () => {
    setIsEditing(true);
    setIsDisabled(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('Token') || sessionStorage.getItem('Token');
      const response = await axios.put(
        `${APi_Url}/digicoder/crm/api/v1/excel-leads/update/${viewdata._id}`,
        { dynamicData: formData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        toast.success("Updated successfully!");
        setIsEditing(false);
        setIsDisabled(true);
      }
    } catch (error) {
      console.error("Error updating excel lead:", error);
      toast.error("Error occurred while updating.");
    } finally {
      setIsLoading(false);
    }
  };


  const handleBack = () => {
    navigate(-1);
  };

  if (!viewdata) {
      return <div>No Data Found</div>;
  }

  return (
    <div>
      <Dashboard active={"excelLeads"}>
        <div className="content fullLead-outer" style={{ width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <ToastContainer />
          <div className="fullLead-outer">
            <div className="fullLeads-header">
              <div className="back-btn">
                <button onClick={handleBack}><i className="ri-arrow-left-line"></i> Back</button>
              </div>
            </div>

            <div className="fullLeads-view-data">
              <div className="view-data-title">
                <span>{viewdata.sheetName ? `${viewdata.sheetName} - LEAD INFO` : "EXCEL LEAD INFO"}</span>
              </div>
              <div className="view-info-form">
                <div className="form-row">
                  {Object.keys(formData).map((key) => (
                    <div key={key}>
                      <div className="label">{key}</div>
                      <input
                        type="text"
                        className="input-field"
                        name={key}
                        value={formData[key] || ""}
                        onChange={handleChange}
                        disabled={isDisabled}
                      />
                    </div>
                  ))}
                  
                  {/* Read Only Meta Data */}
                  <div>
                    <div className="label">Assigned At</div>
                    <input
                      type="text"
                      className="input-field"
                      value={viewdata.assignedAt ? new Date(viewdata.assignedAt).toLocaleString("en-IN") : "Not Assigned"}
                      disabled
                    />
                  </div>
                  <div>
                    <div className="label">Lead Status</div>
                    <input
                      type="text"
                      className="input-field"
                      value={viewdata.leadStatus?.statusName || viewdata.leadStatus?.leadStatusText || "New"}
                      disabled
                    />
                  </div>
                  <div>
                    <div className="label">Assigned To</div>
                    <input
                      type="text"
                      className="input-field"
                      value={viewdata.assignedTo ? (viewdata.assignedTo.name || viewdata.assignedTo.empName || 'Assigned') : "Unassigned"}
                      disabled
                    />
                  </div>
                </div>

                <div className="view-edit-btn">
                  <button onClick={isEditing ? handleSave : handleUpdateBtn} disabled={isLoading}>
                    {isLoading ? "Saving..." : isEditing ? "Save" : "Edit"}
                  </button>
                </div>
              </div>
            </div>

            <div className="follow-ups">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="view-data-titlee">
                  <span>FOLLOW UP HISTORY</span>
                </div>
              </div>

              <div className="follow-ups">
                {isLoadingFollowUps ? (
                   <p style={{textAlign: "center"}}>Loading follow-ups...</p>
                ) : followUps.length > 0 ? (
                  followUps.map((followUp, index) => (
                    <div key={followUp._id} className="follow-outer">
                      <div className="follow-body">
                        <div className="follow-body-header">
                          <div className="followup-srNo">{followUps.length - index}</div>
                          <div>
                            <span className="cratedBy">Created: </span> 
                            <span>{new Date(followUp.createdAt).toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="cratedBy">Followed By: </span> 
                            <span>{followUp.followedBy?.empName || followUp.followedBy?.name || "Unknown"}</span>
                          </div>
                        </div>
                        <hr style={{opacity:"0.2"}}/>
                        <div className="follow-body-footer">
                          <div style={{display:"flex", gap:"50px"}}>
                            <div>
                                <span className="cratedBy">Status: </span>
                                <span style={{color: "#3454D1"}}>{followUp.followupStatus?.statusName || followUp.followupStatus?.leadStatusText || "N/A"}</span>
                            </div>
                            {followUp.nextFollowupDate && (
                              <div>
                                <span className="cratedBy">Next Followup: </span>
                                <span style={{color: "#ff9800"}}>{new Date(followUp.nextFollowupDate).toLocaleString("en-IN")}</span>
                              </div>
                            )}
                          </div>
                          <div style={{marginTop: "10px"}}>
                            <span className="cratedBy">Remark: </span>
                            <span>{followUp.followupMessage}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{textAlign: "center"}}>No follow-ups found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Dashboard>
    </div>
  );
}

export default FullExcelLeads;
