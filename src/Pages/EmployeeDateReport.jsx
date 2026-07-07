import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import Dashboard from '../Components/Dashboard';

const EmployeeDateReport = () => {
  const { empId } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useRef(null);
  const employeeId = empId || sessionStorage.getItem('EmployeeId') || sessionStorage.getItem('AdminId'); 
  const token = sessionStorage.getItem('token');
  const APi_Url = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchReports();
  }, [employeeId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/report/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReports(response.data.data);
        setFilteredReports(response.data.data);
      } else {
        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch reports' });
      }
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Server Error' });
    } finally {
      setLoading(false);
    }
  };

  const dateBodyTemplate = (rowData) => {
    return new Date(rowData.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSearch = () => {
    if (!startDate && !endDate) {
      setFilteredReports(reports);
      return;
    }
    
    let filtered = reports;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(r => new Date(r.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.date) <= end);
    }
    setFilteredReports(filtered);
  };

  const numberTemplate = (rowData, field, severity = 'info') => {
    return <Tag value={rowData[field]} severity={severity} rounded style={{ minWidth: '30px' }} />;
  };

  return (
    <Dashboard>
      <Toast ref={toast} />
      <div className="employee-report-container p-3 sm:p-4">
        <div className="flex align-items-center mb-4 pb-2 border-bottom-1 surface-border">
            {empId && (
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-button p-component p-button-text p-button-rounded p-button-icon-only mr-3 shadow-1"
                    style={{ color: "var(--main-color)", backgroundColor: "#f8f9fa" }}
                >
                    <i className="pi pi-arrow-left" style={{ fontSize: '1.2rem' }}></i>
                </button>
            )}
            <div>
                <h2 style={{ color: "#3454D1", margin: 0, fontWeight: 700, fontSize: '1.8rem' }}>
                {empId ? "Employee Activity Report" : "Daily Activity Report"}
                </h2>
                <span className="text-500 font-medium">Track daily leads, reminders, and progress</span>
            </div>
        </div>

        <div className="flex flex-column md:flex-row align-items-end gap-3 mb-4 p-4 border-round-xl bg-white shadow-2" style={{ borderLeft: '4px solid #3454D1' }}>
           <div className="flex flex-column gap-2 flex-1">
             <label htmlFor="startDate" className="font-semibold text-700 text-sm">Start Date</label>
             <input 
                id="startDate" 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="p-inputtext p-component p-filled border-round-md" 
                style={{ padding: '0.75rem', width: '100%', borderColor: '#e5e7eb' }}
             />
           </div>
           <div className="flex flex-column gap-2 flex-1">
             <label htmlFor="endDate" className="font-semibold text-700 text-sm">End Date</label>
             <input 
                id="endDate" 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="p-inputtext p-component p-filled border-round-md" 
                style={{ padding: '0.75rem', width: '100%', borderColor: '#e5e7eb' }}
             />
           </div>
           <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0">
             <button 
                onClick={handleSearch} 
                className="p-button p-component border-round-md transition-colors flex-1 md:flex-none justify-content-center"
                style={{ height: '46px', minWidth: '120px', backgroundColor: '#3454D1', borderColor: '#3454D1', color: 'white' }}
             >
                <i className="pi pi-search mr-2"></i>
                <span className="p-button-label font-bold">Search</span>
             </button>
             <button 
                onClick={() => { setStartDate(''); setEndDate(''); setFilteredReports(reports); }} 
                className="p-button p-component p-button-outlined border-round-md transition-colors flex-1 md:flex-none justify-content-center"
                style={{ height: '46px', minWidth: '120px', color: '#3454D1', borderColor: '#3454D1', backgroundColor: 'transparent' }}
             >
                <i className="pi pi-filter-slash mr-2"></i>
                <span className="p-button-label font-bold">Clear</span>
             </button>
           </div>
        </div>

        <div className="card shadow-2 border-round-xl overflow-hidden bg-white">
          <DataTable 
            value={filteredReports} 
            loading={loading}
            paginator 
            rows={10} 
            stripedRows
            showGridlines
            responsiveLayout="scroll"
            emptyMessage="No reports found for the selected dates."
            className="p-datatable-sm p-datatable-gridlines"
            rowHover
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} reports"
          >
            <Column field="date" header="Date" body={dateBodyTemplate} sortable style={{ minWidth: '150px', fontWeight: 'bold' }}></Column>
            <Column field="assignedLeads" header="Total Assigned" body={(r) => numberTemplate(r, 'assignedLeads', 'info')} sortable align="center"></Column>
            <Column field="pendingLeads" header="Pending" body={(r) => numberTemplate(r, 'pendingLeads', 'warning')} sortable align="center"></Column>
            <Column field="reminders" header="Reminders" body={(r) => numberTemplate(r, 'reminders', 'success')} sortable align="center"></Column>
            <Column field="missedLeads" header="Missed" body={(r) => numberTemplate(r, 'missedLeads', 'danger')} sortable align="center"></Column>
            <Column field="negativeLeads" header="Negative" body={(r) => numberTemplate(r, 'negativeLeads', 'danger')} sortable align="center"></Column>
            <Column field="closedLeads" header="Closed" body={(r) => numberTemplate(r, 'closedLeads', 'success')} sortable align="center"></Column>
          </DataTable>
        </div>
      </div>
    </Dashboard>
  );
};

export default EmployeeDateReport;
