import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";
import Dashboard from '../Components/Dashboard';
import axios from "axios";
import Swal from 'sweetalert2';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { format } from 'date-fns';

import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TodayIcon from '@mui/icons-material/Today';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CancelIcon from '@mui/icons-material/Cancel';
import TagIcon from '@mui/icons-material/Tag';
import Skeleton from '@mui/material/Skeleton';

import './CSS/EmployeesFullPage.css';

function EmployeesFullPage() {
  const APi_Url = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const EmployeeData = JSON.parse(localStorage.getItem("Employee"));
  const currentEmployeeId = EmployeeData._id;
  let EmpStatus = EmployeeData.blocked ? "Blocked" : "Active";

  // State variables
  const [assignedLeads, setAssignedLeads] = useState([]);
  const [followupData, setFollowUpData] = useState([]);
  const [pendingLeads, setPendingLeads] = useState([]);
  const [visible, setVisible] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [followupsForDate, setFollowupsForDate] = useState([]);
  const [followupsModalVisible, setFollowupsModalVisible] = useState(false);
  const [loading, setLoading] = useState({
    assignedLeads: true,
    followups: true,
    pendingLeads: true,
    tags: true, // Added loading state for tags
    report: true // ✅ Added loading state for report
  });

  const [reportData, setReportData] = useState({
    totalAssigned: 0,
    closedLeads: 0,
    pendingLeads: 0,
    negativeLeads: 0,
    leadsAdded: 0,
    todaysFollowups: 0,
    totalFollowups: 0,
    todayReminders: 0,
    missedLeads: 0,
    uniqueTagNames: [],
    assignedColleges: []
  });

  const [formData, setFormData] = useState({
    Name: EmployeeData?.empName || "",
    Email: EmployeeData?.empEmail || "",
    Password: EmployeeData?.empPassword || "",
    Phone: EmployeeData?.empPhoneNumber || "",
    Gender: EmployeeData?.empGender || "",
    DateOfBirth: EmployeeData?.empDOB || "",
    Designation: EmployeeData?.empDesignation || "",
    City: EmployeeData?.empCity || "",
    ZipCode: EmployeeData?.empZipCode || "",
    State: EmployeeData?.empState || "",
    Country: EmployeeData?.empCountry || "",
    JoiningDate: EmployeeData?.createdAt || "",
    Status: EmpStatus,
    Target: EmployeeData?.target || 80, // ✅ added Target field
  });

  // Fetch data functions
  const fetchPendingLeads = async () => {
    try {
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/lead/pendingleads/${currentEmployeeId}`);
      setPendingLeads(response.data.leads || []);
    } catch (error) {
      console.error("Error fetching pending leads:", error);
      toast.error("Failed to fetch pending leads");
    } finally {
      setLoading(prev => ({ ...prev, pendingLeads: false }));
    }
  };

  const fetchAssignedLeads = async () => {
    try {
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/lead/empgetall/${currentEmployeeId}`);
      console.log(response);
      
      setAssignedLeads(response.data.leads || []);
      setLoading(prev => ({ ...prev, tags: false })); // Tags data is ready when assigned leads are loaded
    } catch (error) {
      if (error.response && error.response.status === 404) {
        toast.warn("No Assigned leads found");
      } else {
        toast.error("Failed to fetch assigned leads");
      }
      setLoading(prev => ({ ...prev, tags: false })); // Even if error, stop loading
    } finally {
      setLoading(prev => ({ ...prev, assignedLeads: false }));
    }
  };

  const fetchFollowUps = async () => {
    try {
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/followup/getfollowedby/${currentEmployeeId}`);
      setFollowUpData(response.data.followups || []);
    } catch (error) {
      console.error("Error fetching followups:", error);
    } finally {
      setLoading(prev => ({ ...prev, followups: false }));
    }
  };

  const fetchReportData = async () => {
    try {
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/employee/report/${currentEmployeeId}`);
      if (response.data.success && response.data.report) {
        setReportData(response.data.report);
      }
    } catch (error) {
      console.error("Error fetching employee report:", error);
      toast.error("Failed to fetch employee performance report");
    } finally {
      setLoading(prev => ({ ...prev, report: false }));
    }
  };

  // Calculate metrics
  const calculateReportMetrics = () => {
    const totalAssigned = reportData.totalAssigned;
    const closedLeads = reportData.closedLeads;
    const negativeLeads = reportData.negativeLeads;
    const pendingLeads = reportData.pendingLeads;
    const todaysFollowups = reportData.todaysFollowups;
    const totalFollowups = reportData.totalFollowups;
    const leadsAdded = reportData.leadsAdded;
    const todayReminders = reportData.todayReminders || 0;
    const missedLeads = reportData.missedLeads || 0;

    const leadsWithNoFollowups = assignedLeads.filter(lead => 
      !followupData.some(followup => followup.leadId === lead._id)
    ).length;

    const uniqueTagNames = reportData.uniqueTagNames;
    const assignedColleges = reportData.assignedColleges || [];

    return {
      totalAssigned,
      closedLeads,
      negativeLeads,
      pendingLeads,
      todaysFollowups,
      totalFollowups,
      leadsWithNoFollowups,
      uniqueTagNames,
      assignedColleges,
      leadsAdded,
      todayReminders,
      missedLeads
    };
  };
useEffect(()=>{
  console.log("FollowUps",followupsForDate);
  
})
  const reportMetrics = calculateReportMetrics();

  // Event handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    setIsEditing(true);
    setIsDisabled(false);
  };

  const handleSave = async () => {
    const EmployeeDataEdit = {
      empName: formData.Name,
      empPhoneNumber: formData.Phone,
      empEmail: formData.Email,
      empPassword: formData.Password,
      empGender: formData.Gender,
      empDOB: formData.DateOfBirth,
      empDesignation: formData.Designation,
      empCity: formData.City,
      empState: formData.State,
      empZipCode: formData.ZipCode,
      empCountry: formData.Country,
      target: formData.Target // ✅ Save target field
    };

    try {
      const response = await axios.put(
        `${APi_Url}/digicoder/crm/api/v1/employee/update/${currentEmployeeId}`,
        EmployeeDataEdit,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200) {
        toast.success("Updated successfully!");
        setIsEditing(false);
        setIsDisabled(true);
        navigate('/employee');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update data!");
    }
  };

  const handleBack = () => {
    navigate('/employee');
    localStorage.removeItem("Employee");
  };

  const handleBlock = async () => {
    const result = await Swal.fire({
      title: `Are you sure you want to ${EmployeeData.blocked ? 'unblock' : 'block'} ${EmployeeData.empName}?`,
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${EmployeeData.blocked ? 'unblock' : 'block'} it!`,
      cancelButtonText: 'No, cancel!',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      const AdminId = sessionStorage.getItem("AdminId");
      const blockEmployee = EmployeeData._id;

      const response = await axios.put(
        `${APi_Url}/digicoder/crm/api/v1/employee/block/${AdminId}`,
        { empId: blockEmployee }
      );

      if (response.status === 200) {
        toast.success(`${EmployeeData.empName} has been ${EmployeeData.blocked ? 'unblocked' : 'blocked'} successfully.`);
        navigate('/employee');
        setFormData(prev => ({ ...prev, Status: response.data.employee.blocked ? "Blocked" : "Active" }));
      }
    } catch (error) {
      toast.error(`Failed to ${EmployeeData.blocked ? 'unblock' : 'block'} the employee.`);
    }
  };

  const handleDateFilterClick = () => {
    setDateFilterVisible(true);
  };

  const handleDateSelect = (e) => {
    setSelectedDate(e.value);
    setDateFilterVisible(false);
    
    const filtered = followupData.filter(item => {
      const followupDate = new Date(item.createdAt).toISOString().split('T')[0];
      const selectedDateStr = format(e.value, 'yyyy-MM-dd');
      return followupDate === selectedDateStr;
    });
    
    setFollowupsForDate(filtered);
    setFollowupsModalVisible(true);
  };
const handleOpenLeads = (followupsForDate) => {
  console.log(followupsForDate);
  navigate('/dateWiseFilter', { state: { followups: followupsForDate } });
};

  // Initial data fetch
  useEffect(() => {
    const tokenId = sessionStorage.getItem('Token');
    if (!tokenId) navigate('/');

    const fetchData = async () => {
      await Promise.all([
        fetchAssignedLeads(),
        fetchFollowUps(),
        fetchPendingLeads(),
        fetchReportData()
      ]);
    };

    fetchData();
  }, [navigate]);

  const footerContent = (
    <div>
      <Button
        label="Close"
        icon="pi pi-times"
        onClick={() => setVisible(false)}
        className="p-button-text"
      />
    </div>
  );

  // Loading component
  const LoadingIndicator = () => (
    <Skeleton variant="text" width={60} height={40} />
  );

  return (
    <div>
      <Dashboard active={'employee'}>
        <div className="content fullLead-outer">
          <div className="fullLead-outer">
            <div className="fullLeads-header">
              <div className="back-btn">
                <button onClick={handleBack}><i className="ri-arrow-left-line"></i> Back</button>
              </div>
              <div className="fullLeads-icons">
                <button
                  style={{ color: EmployeeData.blocked ? "green" : "red" }}
                  onClick={handleBlock}
                >
                  <i className={EmployeeData.blocked ? "ri-user-unfollow-fill" : "ri-user-follow-fill"}></i>
                  {EmployeeData.blocked ? " Unblock" : " Block"}
                </button>
              </div>
            </div>

            {/* Employee Details Section */}
            <div className="fullLeads-view-data">
              <div className="view-data-title">
                <span>EMPLOYEE DETAILS</span>
              </div>
              <div className="view-info-form">
                <div className="form-row">
                  <div>
                    <div className="label">Name</div>
                    <input
                      type="text"
                      className="input-field"
                      name="Name"
                      value={formData.Name}
                      onChange={handleChange}
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <div className="label">Phone Number</div>
                    <input
                      type="number"
                      className="input-field"
                      name="Phone"
                      value={formData.Phone}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                  <div>
                    <div className="label">Email</div>
                    <input
                      type="email"
                      className="input-field"
                      name="Email"
                      value={formData.Email}
                      onChange={handleChange}
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <div className="label">Password</div>
                    <input
                      type="text"
                      className="input-field"
                      name="Password"
                      value={formData.Password}
                      onChange={handleChange}
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <div className="label">Gender</div>
                    <select
                      className="input-field"
                      name="Gender"
                      value={formData.Gender}
                      onChange={handleChange}
                      disabled={isDisabled}
                    >
                      <option value="" disabled>-- Select --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <div className="label">Date of Birth</div>
                    <input
                      type="date"
                      className="input-field"
                      name="DateOfBirth"
                      value={formData.DateOfBirth}
                      onChange={handleChange}
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <div className="label">Designation</div>
                    <input
                      type="text"
                      className="input-field"
                      name="Designation"
                      value={formData.Designation}
                      onChange={handleChange}
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <div className="label">City</div>
                    <input
                      type="text"
                      className="input-field"
                      name="City"
                      value={formData.City}
                      onChange={handleChange}
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <div className="label">Zip Code</div>
                    <input
                      type="number"
                      className="input-field"
                      name="ZipCode"
                      value={formData.ZipCode}
                      onChange={handleChange}
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <div className="label">State</div>
                    <input
                      type="text"
                      className="input-field"
                      name="State"
                      value={formData.State}
                      onChange={handleChange}
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <div className="label">Country</div>
                    <input
                      type="text"
                      className="input-field"
                      name="Country"
                      value={formData.Country}
                      onChange={handleChange}
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <div className="label">Target</div>
                    <input
                      type="number"
                      className="input-field"
                      name="Target"
                      value={formData.Target}
                      onChange={handleChange}
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <div className="label">Joining Date</div>
                    <input
                      type="text"
                      className="input-field"
                      name="createdDate"
                      value={new Date(formData.JoiningDate).toLocaleDateString()}
                      disabled
                    />
                  </div>
                  <div>
                    <div className="label">Status</div>
                    <input
                      type="text"
                      className="input-field"
                      name="LeadStatus"
                      value={formData.Status}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                </div>
                <div className="view-edit-btn">
                  <button onClick={isEditing ? handleSave : handleUpdate}>
                    {isEditing ? "Save Changes" : "Edit Profile"}
                  </button>
                </div>
              </div>
            </div>

            {/* Performance Report Section */}
            <div className="report-title">
              <span>EMPLOYEE PERFORMANCE REPORT</span>
              <div className="report-filter-buttons">
                <Button
                  label="View Assigned Colleges"
                  icon="pi pi-building"
                  onClick={() => setVisible(true)}
                  className="AssignedTagsBtn"
                />
              </div>
            </div>

            <div className="report-grid">
              {/* Assigned Leads Card */}
              <div className="report-card">
                <div className="report-icon">
                  <AssignmentIndIcon style={{ fontSize: "40px", color: "#3f51b5" }} />
                </div>
                <div className="report-content">
                  <span>Assigned Leads</span>
                  {loading.report ? <LoadingIndicator /> : <p>{reportMetrics.totalAssigned}</p>}
                  <small>Total leads assigned to this employee</small>
                </div>
              </div>

              {/* Closed Leads Card */}
              <div className="report-card success-card">
                <div className="report-icon">
                  <CheckCircleIcon style={{ fontSize: "40px", color: "white" }} />
                </div>
                <div className="report-content">
                  <span>Closed Leads</span>
                  {loading.report ? <LoadingIndicator /> : <p>{reportMetrics.closedLeads}</p>}
                  <small>
                    {reportMetrics.totalAssigned > 0 ?
                      `${Math.round((reportMetrics.closedLeads / reportMetrics.totalAssigned) * 100)}% Success Rate` :
                      'No leads assigned'}
                  </small>
                </div>
              </div>

              {/* Pending Leads Card */}
              <div className="report-card warning-card">
                <div className="report-icon">
                  <PendingActionsIcon style={{ fontSize: "40px", color: "white" }} />
                </div>
                <div className="report-content">
                  <span>Pending Leads</span>
                  {loading.report ? <LoadingIndicator /> : <p>{reportMetrics.pendingLeads}</p>}
                  <small>From API: {pendingLeads.length} pending leads</small>
                </div>
              </div>

              {/* Negative Leads Card */}
              <div className="report-card danger-card">
                <div className="report-icon">
                  <CancelIcon style={{ fontSize: "40px", color: "white" }} />
                </div>
                <div className="report-content">
                  <span>Negative Leads</span>
                  {loading.report ? <LoadingIndicator /> : <p>{reportMetrics.negativeLeads}</p>}
                  <small>
                    {reportMetrics.totalAssigned > 0 ?
                      `${Math.round((reportMetrics.negativeLeads / reportMetrics.totalAssigned) * 100)}% of total` :
                      ''}
                  </small>
                </div>
              </div>

              {/* Leads Added Card */}
              <div className="report-card" style={{ background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', color: 'white' }}>
                <div className="report-icon" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <AssignmentIndIcon style={{ fontSize: "40px", color: "white" }} />
                </div>
                <div className="report-content">
                  <span style={{ color: 'white' }}>Leads Added</span>
                  {loading.report ? <LoadingIndicator /> : <p style={{ color: 'white' }}>{reportMetrics.leadsAdded}</p>}
                  <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Total leads added by this employee</small>
                </div>
              </div>

              {/* Today's Followups Card */}
              <div className="report-card info-card">
                <div className="report-icon">
                  <TodayIcon style={{ fontSize: "40px", color: "white" }} />
                </div>
                <div className="report-content">
                  <span>Today's Followups</span>
                  {loading.report ? <LoadingIndicator /> : <p>{reportMetrics.todaysFollowups}</p>}
                  <small>{new Date().toLocaleDateString()}</small>
                </div>
              </div>

              {/* Total Followups Card */}
              <div className="report-card primary-card">
                <div className="report-icon">
                  <WorkHistoryIcon style={{ fontSize: "40px", color: "white" }} />
                </div>
                <div className="report-content">
                  <span>Total Followups</span>
                  {loading.report ? <LoadingIndicator /> : <p>{reportMetrics.totalFollowups}</p>}
                  <small>
                    Avg: {reportMetrics.totalAssigned > 0 ?
                      Math.round(reportMetrics.totalFollowups / reportMetrics.totalAssigned) : 0} per lead
                  </small>
                  
                  <div className="card-filter-button">
                    <Button
                      label="Filter"
                      onClick={handleDateFilterClick}
                      className="p-button-sm p-button-info"
                      aria-label="Filter by Date"
                    />
                  </div>
                </div>
              </div>

              {/* Today's Reminders Card */}
              <div className="report-card" style={{ background: 'linear-gradient(135deg, #FFB74D 0%, #F57C00 100%)', color: 'white' }}>
                <div className="report-icon" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <TodayIcon style={{ fontSize: "40px", color: "white" }} />
                </div>
                <div className="report-content">
                  <span style={{ color: 'white' }}>Today's Reminders</span>
                  {loading.report ? <LoadingIndicator /> : <p style={{ color: 'white' }}>{reportMetrics.todayReminders}</p>}
                  <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Pending reminders scheduled for today</small>
                </div>
              </div>

              {/* Missed Reminders Card */}
              <div className="report-card" style={{ background: 'linear-gradient(135deg, #EF5350 0%, #D32F2F 100%)', color: 'white' }}>
                <div className="report-icon" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <CancelIcon style={{ fontSize: "40px", color: "white" }} />
                </div>
                <div className="report-content">
                  <span style={{ color: 'white' }}>Missed Reminders</span>
                  {loading.report ? <LoadingIndicator /> : <p style={{ color: 'white' }}>{reportMetrics.missedLeads}</p>}
                  <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Unaddressed past due reminders</small>
                </div>
              </div>
            </div>

            {/* Dialogs */}
            <Dialog
              className="AssignedTagsContainer"
              header={
                <div className="dialog-header" style={{ display: 'flex', alignItems: 'center' }}>
                  <TagIcon style={{ marginRight: '10px', color: '#4f46e5' }} />
                  <span style={{ fontWeight: '700', fontSize: '18px', color: '#1f2937' }}>Assigned Colleges</span>
                </div>
              }
              visible={visible}
              onHide={() => setVisible(false)}
              footer={footerContent}
              style={{ width: '50vw' }}
            >
              <div className="tags-container" style={{ padding: '10px 0', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {loading.tags || loading.report ? (
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '20px' }}>
                    <LoadingIndicator />
                  </div>
                ) : reportMetrics.assignedColleges.length > 0 ? (
                  reportMetrics.assignedColleges.map((college, index) => (
                    <div key={index} className="college-badge" style={{
                      display: "flex",
                      alignItems: "center",
                      background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                      color: "#3730a3",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "600",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      border: "1px solid #a5b4fc"
                    }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4f46e5", marginRight: "8px" }}></div>
                      {college}
                    </div>
                  ))
                ) : (
                  <div style={{ width: '100%', textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
                    <p style={{ fontSize: '15px', margin: 0 }}>No colleges assigned to this employee's leads</p>
                  </div>
                )}
              </div>
            </Dialog>

            <Dialog
              header="Select Date to Filter Followups"
              visible={dateFilterVisible}
              onHide={() => setDateFilterVisible(false)}
              style={{ width: '350px' }}
            >
              <div className="p-fluid">
                <Calendar   
                  value={selectedDate} 
                  onChange={handleDateSelect}
                  dateFormat="dd/mm/yy"
                  placeholder="Select Date"
                />
              </div>
            </Dialog>

            <Dialog
              header={`Followups on ${selectedDate ? format(selectedDate, 'MMMM do, yyyy') : ''}`}
              visible={followupsModalVisible}
              onHide={() => setFollowupsModalVisible(false)}
              style={{ width: '50vw' }}
            >
              <div className="followups-results">
                {followupsForDate.length > 0 ? (
                  <>
                    <div className="total-followups d-flex gap-5">
                      <h3>Total Followups: {followupsForDate.length}</h3>
                      <button onClick={()=>handleOpenLeads(followupsForDate)}>Open Leads</button>
                    </div>
                  </>
                ) : (
                  <p>No followups found for this date</p>
                )}
              </div>
            </Dialog>
          </div>
        </div>
      </Dashboard>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default EmployeesFullPage;