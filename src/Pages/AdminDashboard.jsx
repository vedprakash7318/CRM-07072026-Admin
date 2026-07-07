// import React, { useEffect, useState, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import Dashboard from '../Components/Dashboard';
// import { Toast } from 'primereact/toast';
// import './CSS/AdminDashboard.css';

// function MainDashboard() {
//   const navigate = useNavigate();
//   const [totalRecords, setTotalRecords] = useState(0);
//   const [totalUnAssignedRecords, setTotalUnAssignedRecords] = useState(0);
//   const [totalClosedRecords, setTotalClosedRecords] = useState(0);
//   const [totalAssignedRecords, setTotalAssignedRecords] = useState(0);
//   const [totalEmployees, setTotalEmployees] = useState(0);
//   const [totalUnactiveEmployees, setTotalUnactiveEmployees] = useState(0);
//   const [totalTags, setTotalTags] = useState(0);

//   const [leadsLoading, setLeadsLoading] = useState(false);
//   const [employeeLoading, setEmployeeLoading] = useState(false);
//   const [tagsLoading, setTagsLoading] = useState(false);

//   const toast = useRef(null);
//   const AdminId = sessionStorage.getItem('AdminId');
//   const APi_Url = import.meta.env.VITE_API_URL;

//   const fetchEmployee = async () => {
//     try {
//       setEmployeeLoading(true);

//       const [allRes, blockedRes] = await Promise.all([
//         axios.get(`${APi_Url}/digicoder/crm/api/v1/employee/getall/${AdminId}`),
//         axios.get(`${APi_Url}/digicoder/crm/api/v1/employee/employees/blocked/${AdminId}`)
//       ]);

//       if (allRes.data?.success) {
//         setTotalEmployees(allRes.data.employees.length);
//       } else {
//         setTotalEmployees(0);
//       }

//       if (blockedRes.data?.success) {
//         setTotalUnactiveEmployees(blockedRes.data.employees.length);
//       } else {
//         setTotalUnactiveEmployees(0);
//       }

//     } catch (error) {
//       toast.current?.show({
//         severity: 'error',
//         summary: 'Error',
//         detail: 'Failed to fetch employee data.',
//         life: 3000,
//       });
//     } finally {
//       setEmployeeLoading(false);
//     }
//   };

//   const fetchTags = async () => {
//     try {
//       setTagsLoading(true);
//       const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/tags/getall/${AdminId}`);
//       if (response.data?.success) {
//         setTotalTags(response.data.tags.length);
//       } else {
//         setTotalTags(0);
//       }
//     } catch (error) {
//       toast.current?.show({
//         severity: 'error',
//         summary: 'Error',
//         detail: 'Failed to fetch tag data.',
//         life: 3000,
//       });
//     } finally {
//       setTagsLoading(false);
//     }
//   };

//   const fetchLeads = async () => {
//     try {
//       setLeadsLoading(true);
//       const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/lead/getall/${AdminId}`);
//       if (response.data?.success) {
//         setTotalRecords(response.data.totalLeads);
//         setTotalAssignedRecords(response.data.totalAssignedLeads);
//         setTotalUnAssignedRecords(response.data.totalUnassignedLeads);
//         setTotalClosedRecords(response.data.totalClosedLeads);
//       } else {
//         setTotalRecords(0);
//       }
//     } catch (error) {
//       toast.current?.show({
//         severity: 'error',
//         summary: 'Error',
//         detail: 'Failed to fetch lead data.',
//         life: 3000,
//       });
//     } finally {
//       setLeadsLoading(false);
//     }
//   };

//   useEffect(() => {
//     const token = sessionStorage.getItem('Token');
//     if (!token) {
//       navigate('/');
//     } else {
//       fetchLeads();
//       fetchEmployee();
//       fetchTags();
//     }
//   }, [navigate]);

//   const actionCards = [
//     // {
//     //   title: 'Add Lead',
//     //   icon: 'ri-user-add-line',
//     //   route: '/addLead',
//     //   color: '#4CAF50'
//     // },
//     // {
//     //   title: 'Import Leads',
//     //   icon: 'ri-download-line',
//     //   route: '/importLeads',
//     //   color: '#2196F3'
//     // }
//   ];

//   const metrics = [
//     {
//       title: 'Total Leads',
//       icon: 'ri-database-2-line',
//       value: totalRecords,
//       loading: leadsLoading,
//       route: '/leads',
//     },
//     {
//       title: 'Unassigned Leads',
//       icon: 'ri-user-unfollow-line',
//       value: totalUnAssignedRecords,
//       loading: leadsLoading,
//       route: '/unassignedLeads',
//     },
//     {
//       title: 'Assigned Leads',
//       icon: 'ri-user-follow-line',
//       value: totalAssignedRecords,
//       loading: leadsLoading,
//       route: '/assignedLeads',
//     },
//     {
//       title: 'Closed Leads',
//       icon: 'ri-check-double-line',
//       value: totalClosedRecords,
//       loading: leadsLoading,
//       route: '',
//     },
//     {
//       title: 'Total Employees',
//       icon: 'ri-group-line',
//       value: totalEmployees,
//       loading: employeeLoading,
//       route: '/employee',
//     },
//     {
//       title: 'Unactive Employees',
//       icon: 'ri-user-settings-line',
//       value: totalUnactiveEmployees,
//       loading: employeeLoading,
//       route: '/employee?status=inactive',
//     },
//     {
//       title: 'Total Tags',
//       icon: 'ri-price-tag-3-line',
//       value: totalTags,
//       loading: tagsLoading,
//       route: '/tag',
//     },
//     {
//       title: 'Export Numbers',
//       icon: 'ri-download-2-line', // Changed icon for Export Numbers
//       value: 'Export', // Changed value to text
//       loading: tagsLoading,
//       route: '/exportNumbers',
//     },
//     {
//       title: 'Employee Report',
//       icon: 'ri-download-2-line', 
//       value: '', // Changed value to text
//       loading: tagsLoading,
//       route: '/emp-work',
//     },
//   ];

//   return (
//     <Dashboard active="dashboard">
//       <Toast ref={toast} />
//       <div className="main-dashboard-container">
//         <div className="main-dashboard-outer">
//           {/* Action Cards Row */}
//           <div className="dashboard-cards-container">
//             {actionCards.map((card, index) => (
//               <div
//                 className="dashboard-card action-card"
//                 key={`action-${index}`}
//                 onClick={() => navigate(card.route)}
//                 style={{ backgroundColor: card.color, cursor: 'pointer' }}
//               >
//                 <div className="card-icon">
//                   <i className={card.icon} style={{ color: 'white' }}></i>
//                 </div>
//                 <div className="card-content">
//                   <h4 style={{ color: 'white' }}>{card.title}</h4>
//                 </div>
//               </div>
//             ))}
//           </div>
          
//           {/* Metrics Cards */}
//           <div className="dashboard-cards-container">
//             {metrics.map((metric, index) => {
//               const handleClick = () => {
//                 if (metric.route) {
//                   navigate(metric.route);
//                 }
//               };

//               const isClickable = !!metric.route;

//               return (
//                 <div
//                   className="dashboard-card"
//                   key={index}
//                   onClick={handleClick}
//                   style={{ cursor: isClickable ? 'pointer' : 'default' }}
//                 >
//                   <div className="card-icon">
//                     <i className={metric.icon}></i>
//                   </div>
//                   <div className="card-content">
//                     <h4>{metric.title}</h4>
//                     <h1>
//                       {metric.loading ? (
//                         <div className="circle-loader"></div>
//                       ) : (
//                         metric.value
//                       )}
//                     </h1>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
          
//           <div className="main-dashboard-bottom">
//             <div className="main-table-container"></div>
//           </div>
//           <div className="main-card-container"></div>
//         </div>
//       </div>
//     </Dashboard>
//   );
// }

// export default MainDashboard;


import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Dashboard from '../Components/Dashboard';
import { Toast } from 'primereact/toast';
import './CSS/AdminDashboard.css';

function MainDashboard() {
  const navigate = useNavigate();
  const toast = useRef(null);

  // Admin/Employee ID from sessionStorage
  const AdminId = sessionStorage.getItem('AdminId');
  const token = sessionStorage.getItem('Token');
  const API_URL = import.meta.env.VITE_API_URL;

  // ----------------------------
  // State
  // ----------------------------
  const [dashboardData, setDashboardData] = useState({
    leads: {
      totalLeads: 0,
      totalAssignedLeads: 0,
      totalUnassignedLeads: 0,
      totalClosedLeads: 0,
      totalEnquiries: 0,
    },
    employees: {
      totalEmployees: 0,
      totalUnactiveEmployees: 0,
    },
    tags: 0,
    followups: {
      totalFollowups: 0,
      todayFollowups: 0,
    },
    priorities: 0,
    sources: 0,
  });

  const [loading, setLoading] = useState(true);

  // ----------------------------
  // Fetch Dashboard Data
  // ----------------------------
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/digicoder/crm/api/v1/dashboard/dashboard`, {
        params: { addedBy: AdminId },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setDashboardData(response.data.data);
      } else {
        toast.current?.show({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Failed to fetch dashboard data',
          life: 3000,
        });
      }
    } catch (error) {
      console.error('Dashboard Fetch Error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Something went wrong while fetching dashboard',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // On Mount
  // ----------------------------
  useEffect(() => {
    if (!token) {
      navigate('/');
    } else {
      fetchDashboard();
    }
  }, [navigate]);

  // ----------------------------
  // Metrics Cards Config
  // ----------------------------
  const metrics = [
    {
      title: 'Total Leads',
      icon: 'ri-database-2-line',
      value: dashboardData.leads.totalLeads,
      route: '/leads',
    },
    {
      title: 'Unassigned Leads',
      icon: 'ri-user-unfollow-line',
      value: dashboardData.leads.totalUnassignedLeads,
      route: '/unassignedLeads',
    },
    {
      title: 'Assigned Leads',
      icon: 'ri-user-follow-line',
      value: dashboardData.leads.totalAssignedLeads,
      route: '/assignedLeads',
    },
    {
      title: 'Closed Leads',
      icon: 'ri-check-double-line',
      value: dashboardData.leads.totalClosedLeads,
      route: '/closedLeads',
    },
    {
      title: 'Total Enquiries',
      icon: 'ri-question-answer-line',
      value: dashboardData.leads.totalEnquiries,
      route: '/enquiries',
    },
    {
      title: 'Total Employees',
      icon: 'ri-group-line',
      value: dashboardData.employees.totalEmployees,
      route: '/employee',
    },
    {
      title: 'Unactive Employees',
      icon: 'ri-user-settings-line',
      value: dashboardData.employees.totalUnactiveEmployees,
      route: '/employee?status=inactive',
    },
    {
      title: 'Total Tags',
      icon: 'ri-price-tag-3-line',
      value: dashboardData.tags,
      route: '/tag',
    },
    {
      title: 'Total Priorities',
      icon: 'ri-flag-line',
      value: dashboardData.priorities,
      route: '/priority',
    },
    {
      title: 'Total Sources',
      icon: 'ri-compass-line',
      value: dashboardData.sources,
      route: '/source',
    },
    {
      title: 'Employee Report',
      icon: 'ri-file-chart-line',
      value: 'View',
      route: '/emp-work',
    },
    {
      title: 'Export Numbers',
      icon: 'ri-download-cloud-line',
      value: 'Export',
      route: '/exportNumbers',
    },
  ];

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <Dashboard active="dashboard">
      <Toast ref={toast} />
      <div className="main-dashboard-container">
        <div className="dashboard-cards-container">
          {metrics.map((metric, index) => {
            const isClickable = !!metric.route;
            return (
              <div
                key={index}
                className="dashboard-card"
                onClick={() => isClickable && navigate(metric.route)}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
              >
                <div className="card-icon">
                  <i className={metric.icon}></i>
                </div>
                <div className="card-content">
                  <h4>{metric.title}</h4>
                  <h1>{loading ? <div className="circle-loader"></div> : metric.value}</h1>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Dashboard>
  );
}

export default MainDashboard;
