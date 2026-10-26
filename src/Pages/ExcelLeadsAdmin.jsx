import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { ClipLoader } from 'react-spinners';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Paginator } from 'primereact/paginator';
import { Dialog } from 'primereact/dialog';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../Components/Dashboard';
import RangeSelectionModal from '../Components/RangeSelectionModal';

import '../Components/CSS/DynamicCard.css';

export default function ExcelLeadsAdmin() {
    const APi_Url = import.meta.env.VITE_API_URL;
    const adminId = sessionStorage.getItem('AdminId');
    const token = localStorage.getItem('Token') || sessionStorage.getItem('Token');
    const navigate = useNavigate();

    const [sheets, setSheets] = useState([]);
    const [activeSheetIndex, setActiveSheetIndex] = useState(0);
    const [leads, setLeads] = useState([]);
    
    // Pagination & Search state
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 1,
        search: ''
    });
    
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [rangeModalVisible, setRangeModalVisible] = useState(false);
    const [file, setFile] = useState(null);
    const [sheetNameInput, setSheetNameInput] = useState("");

    // Mobile view state
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const toast = useRef(null);

    const authHeaders = {
        headers: { Authorization: `Bearer ${token}` }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${APi_Url}/digicoder/crm/api/v1/employee/getall/${adminId}?nopage=true`, authHeaders);
            if (res.data && res.data.employees) {
                const mapped = res.data.employees.map(emp => ({ label: emp.name || emp.empName, value: emp._id }));
                setEmployees(mapped);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSheets = async () => {
        try {
            const res = await axios.get(`${APi_Url}/digicoder/crm/api/v1/excel-leads/admin-sheets`, authHeaders);
            if (res.data && res.data.sheets) {
                setSheets(res.data.sheets);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchLeads = async (sheetName = sheets[activeSheetIndex], params = lazyParams) => {
        if (!sheetName) return;
        setLoading(true);
        try {
            const res = await axios.get(`${APi_Url}/digicoder/crm/api/v1/excel-leads/admin-leads`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    sheetName,
                    page: params.page,
                    limit: params.rows,
                    search: params.search
                }
            });
            if (res.data && res.data.success) {
                setLeads(res.data.leads);
                setTotalRecords(res.data.totalLeads);
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch leads' });
        } finally {
            setLoading(false);
        }
    };

    const handleRangeSelect = async (from, to) => {
        if (sheets.length === 0) return;
        setLoading(true);
        try {
            const res = await axios.get(`${APi_Url}/digicoder/crm/api/v1/excel-leads/admin-leads`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    sheetName: sheets[activeSheetIndex],
                    page: 1,
                    limit: to, // fetch up to 'to'
                    search: lazyParams.search
                }
            });
            if (res.data && res.data.success) {
                const rangeLeads = res.data.leads.slice(from - 1, to);
                setSelectedLeads(rangeLeads);
                toast.current?.show({ severity: 'success', summary: 'Success', detail: `Selected leads from ${from} to ${to}` });
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch leads for range selection' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchSheets();
    }, []);

    // Whenever active tab or pagination params change, refetch leads
    useEffect(() => {
        if (sheets.length > 0) {
            fetchLeads(sheets[activeSheetIndex], lazyParams);
        }
    }, [activeSheetIndex, lazyParams, sheets]);

    const handlePageChange = (event) => {
        setLazyParams({
            ...lazyParams,
            first: event.first,
            rows: event.rows,
            page: event.page + 1
        });
    };

    const handleSearch = (e) => {
        setLazyParams({
            ...lazyParams,
            search: e.target.value,
            first: 0,
            page: 1
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.current.show({ severity: 'warn', summary: 'Missing File', detail: 'Please select an excel file' });
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (sheetNameInput.trim()) {
            formData.append('sheetName', sheetNameInput.trim());
        }
        
        try {
            const res = await axios.post(`${APi_Url}/digicoder/crm/api/v1/excel-leads/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.data.success) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: res.data.message });
                setFile(null);
                setSheetNameInput("");
                setUploadModalVisible(false);
                fetchSheets(); // refresh sheets, it will auto-trigger fetchLeads
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Upload Error', detail: error.response?.data?.message || 'Upload failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedEmployee) {
            toast.current.show({ severity: 'warn', summary: 'Select Employee', detail: 'Please select an employee first' });
            return;
        }
        if (!selectedLeads || selectedLeads.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'Select Leads', detail: 'Please select at least one lead' });
            return;
        }

        const leadIds = selectedLeads.map(l => l._id);
        setLoading(true);
        try {
            const res = await axios.post(`${APi_Url}/digicoder/crm/api/v1/excel-leads/assign`, {
                leadIds,
                employeeId: selectedEmployee
            }, authHeaders);
            
            if (res.data.success) {
                toast.current.show({ severity: 'success', summary: 'Assigned', detail: res.data.message });
                setSelectedLeads([]);
                setSelectedEmployee(null);
                setAssignModalVisible(false);
                fetchLeads(); // refresh current table
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Assign Error', detail: 'Failed to assign leads' });
        } finally {
            setLoading(false);
        }
    };

    const handleUnassign = async () => {
        if (!selectedLeads || selectedLeads.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'Select Leads', detail: 'Please select at least one lead to unassign' });
            return;
        }

        const leadIds = selectedLeads.map(l => l._id);
        setLoading(true);
        try {
            const res = await axios.post(`${APi_Url}/digicoder/crm/api/v1/excel-leads/unassign`, {
                leadIds
            }, authHeaders);
            
            if (res.data.success) {
                toast.current.show({ severity: 'success', summary: 'Unassigned', detail: res.data.message });
                setSelectedLeads([]);
                fetchLeads(); // refresh current table
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Unassign Error', detail: 'Failed to unassign leads' });
        } finally {
            setLoading(false);
        }
    };

    const assignedToTemplate = (rowData) => {
        return rowData.assignedTo ? (rowData.assignedTo.name || rowData.assignedTo.empName || 'Assigned') : <span style={{color: 'red'}}>Unassigned</span>;
    };

    const getColumnsForSheet = () => {
        if (!leads || leads.length === 0) return [];
        if (!leads[0].dynamicData) return [];
        return Object.keys(leads[0].dynamicData).map(key => ({
            field: `dynamicData.${key}`,
            header: key
        }));
    };

    const actionTemplate = (rowData) => {
        return (
            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => navigate('/fullExcelLeads', { state: { viewdata: rowData, TableTitle: "excelLeads", fromEdit: false } })}
                    style={{ background: '#3454D1', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
                >
                    View
                </button>
                <button
                    onClick={() => navigate('/fullExcelLeads', { state: { viewdata: rowData, TableTitle: "excelLeads", fromEdit: true } })}
                    style={{ background: '#28a745', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Edit
                </button>
            </div>
        );
    };

    return (
        <Dashboard active="excelLeads">
            <div style={{ padding: '20px', background: '#fff', borderRadius: '10px', width: '100%', boxSizing: 'border-box' }}>
                <style>
                    {`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                        .p-tabview-panels {
                            padding: 0;
                        }
                    `}
                </style>
                <Toast ref={toast} />
                
                {/* Header & Actions Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <h2>Excel Leads</h2>
                    
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {/* Search Box */}
                        <span className="p-input-icon-left">
                            <i className="ri-search-line" />
                            <InputText 
                                placeholder="Search Name, Contact..." 
                                value={lazyParams.search} 
                                onChange={handleSearch} 
                                style={{ width: '250px' }}
                            />
                        </span>

                        {/* Assignment Section */}
                        <button 
                            onClick={() => setRangeModalVisible(true)}
                            style={{ padding: '10px 15px', background: '#f39c12', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            Select Range
                        </button>

                        <button 
                            onClick={handleUnassign}
                            disabled={loading || selectedLeads.length === 0}
                            style={{ padding: '10px 15px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: selectedLeads.length === 0 ? 0.6 : 1 }}
                        >
                            Unassign Selected ({selectedLeads.length})
                        </button>
                        <button 
                            onClick={() => {
                                if (selectedLeads.length === 0) {
                                    toast.current.show({ severity: 'warn', summary: 'Select Leads', detail: 'Please select at least one lead' });
                                    return;
                                }
                                setAssignModalVisible(true);
                            }}
                            disabled={loading || selectedLeads.length === 0}
                            style={{ padding: '10px 15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: selectedLeads.length === 0 ? 0.6 : 1 }}
                        >
                            Assign Selected ({selectedLeads.length})
                        </button>

                        <button 
                            onClick={() => setUploadModalVisible(true)}
                            style={{ padding: '10px 20px', background: '#3454D1', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <i className="ri-upload-cloud-2-line"></i> Upload Leads
                        </button>
                    </div>
                </div>

                {/* Dynamic Table Tabs */}
                {sheets.length > 0 ? (
                    <TabView activeIndex={activeSheetIndex} onTabChange={(e) => {
                        setActiveSheetIndex(e.index);
                        setLazyParams(prev => ({...prev, first: 0, page: 1}));
                        setSelectedLeads([]);
                    }}>
                        {sheets.map((sheetKey) => {
                            const cols = getColumnsForSheet();
                            return (
                                <TabPanel header={`${sheetKey}`} key={sheetKey}>
                                    {isMobile ? (
                                        <div className="dynamic-card-outer" style={{ padding: '0', background: 'transparent' }}>
                                            {leads.map((lead, index) => {
                                                const phone = getPhoneNumber(lead.dynamicData);
                                                const name = getName(lead.dynamicData);
                                                return (
                                                    <div key={lead._id || index} className="Dynamic-card" style={{ width: '100%', margin: '10px 0' }}>
                                                        <div className="dynamic-card-details-body">
                                                            <div className="dynamic-card-details">
                                                                <div className="card-body">
                                                                    <p>
                                                                        <span className="card-heading">Name:- </span>
                                                                        <span>{name}</span>
                                                                    </p>
                                                                    {phone && (
                                                                        <p>
                                                                            <span className="card-heading">Phone:- </span>
                                                                            <span>{phone}</span>
                                                                        </p>
                                                                    )}
                                                                    <p>
                                                                        <span className="card-heading">Assigned To:- </span>
                                                                        {assignedToTemplate(lead)}
                                                                    </p>
                                                                    {Object.keys(lead.dynamicData).slice(0, 3).map(key => {
                                                                        if (key.toLowerCase().includes('name') || key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile') || key.toLowerCase().includes('contact')) return null;
                                                                        return (
                                                                            <p key={key}>
                                                                                <span className="card-heading">{key}:- </span>
                                                                                <span>{lead.dynamicData[key]}</span>
                                                                            </p>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="dynamic-card-footer">
                                                            <div className="action-abtn">
                                                                <div className="call-icon-wrapper">
                                                                    <button onClick={() => navigate('/fullExcelLeads', { state: { viewdata: lead, TableTitle: "excelLeads", fromEdit: true } })} style={{ color: '#3454D1', backgroundColor: 'transparent', border: 'none', fontSize: '15px', cursor: 'pointer' }}><i className="ri-edit-box-fill"></i></button>
                                                                </div>
                                                                <div className="call-icon-wrapper">
                                                                    <button onClick={() => navigate('/fullExcelLeads', { state: { viewdata: lead, TableTitle: "excelLeads", fromEdit: false } })} style={{ color: 'red', backgroundColor: 'transparent', border: 'none', fontSize: '15px', cursor: 'pointer' }}><i className="ri-eye-line"></i></button>
                                                                </div>
                                                            </div>
                                                            <div className="action-btn-footer">
                                                                {phone && (
                                                                    <div className="call-icon-wrapper">
                                                                        <a href={`https://wa.me/${phone.startsWith('+91') ? phone.replace(/\D/g, '') : '91' + phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                                                            <button style={{ color: 'green', border: 'none', background: 'transparent', fontSize: '15px', cursor: 'pointer', position: 'relative', bottom: '2px' }}><i className="ri-whatsapp-line"></i></button>
                                                                        </a>
                                                                    </div>
                                                                )}
                                                                {phone && (
                                                                    <div className="call-icon-wrapper">
                                                                        <a href={`tel:${phone}`} style={{ cursor: 'pointer', textDecoration: 'none', fontSize: '15px', color: '#3454D1' }}><i className="ri-phone-fill" /></a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {totalRecords > 0 && (
                                                <Paginator 
                                                    first={lazyParams.first} 
                                                    rows={lazyParams.rows} 
                                                    totalRecords={totalRecords} 
                                                    rowsPerPageOptions={[10, 25, 50]}
                                                    onPageChange={handlePageChange} 
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="no-scrollbar" style={{ overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
                                            <DataTable 
                                                value={leads} 
                                                lazy
                                                first={lazyParams.first}
                                                rows={lazyParams.rows}
                                                totalRecords={totalRecords}
                                                onPage={handlePageChange}
                                                loading={loading}
                                                selection={selectedLeads} 
                                                onSelectionChange={(e) => setSelectedLeads(e.value)}
                                                dataKey="_id" 
                                                paginator 
                                                rowsPerPageOptions={[10, 25, 50]}
                                                emptyMessage="No Leads found."
                                            >
                                                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                                                <Column header="Actions" body={actionTemplate} style={{ minWidth: '120px' }}></Column>
                                                <Column header="Assigned To" body={assignedToTemplate} style={{ minWidth: '150px' }}></Column>
                                                
                                                {cols.map((col) => (
                                                    <Column key={col.field} field={col.field} header={col.header} style={{ minWidth: '150px' }} />
                                                ))}
                                            </DataTable>
                                        </div>
                                    )}
                                </TabPanel>
                            );
                        })}
                    </TabView>
                ) : (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#666', border: '1px dashed #ccc', borderRadius: '8px' }}>
                        <i className="ri-folder-open-line" style={{fontSize: '40px', color: '#ccc'}}></i>
                        <p>No Excel Leads found. Upload some leads to get started.</p>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <Dialog 
                header="Upload Excel Leads" 
                visible={uploadModalVisible} 
                style={{ width: '30vw', minWidth: '350px' }} 
                onHide={() => setUploadModalVisible(false)}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
                    <div className="p-field">
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>1. Choose Excel File</label>
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}} />
                    </div>

                    <div className="p-field">
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>2. List / Sheet Name (Optional)</label>
                        <InputText 
                            value={sheetNameInput} 
                            onChange={(e) => setSheetNameInput(e.target.value)} 
                            placeholder="e.g. Corporate Leads" 
                            style={{ width: '100%' }}
                        />
                        <small style={{ color: '#888', display: 'block', marginTop: '5px' }}>
                            * Leave blank to auto-detect sheet name from file.
                        </small>
                    </div>

                    <button 
                        onClick={handleUpload} 
                        disabled={!file || loading}
                        style={{ padding: '12px', background: '#3454D1', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px', fontSize: '16px' }}
                    >
                        {loading ? 'Uploading...' : 'Upload Now'}
                    </button>
                </div>
            </Dialog>

            {/* Assign Modal */}
            <Dialog 
                header="Assign Leads to Employee" 
                visible={assignModalVisible} 
                style={{ width: '30vw', minWidth: '350px' }} 
                onHide={() => {
                    setAssignModalVisible(false);
                    setSelectedEmployee(null);
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
                    <div className="p-field">
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Select Employee</label>
                        <Dropdown 
                            value={selectedEmployee} 
                            options={employees} 
                            onChange={(e) => setSelectedEmployee(e.value)} 
                            placeholder="Search and Select Employee" 
                            style={{ width: '100%' }}
                            filter
                            filterPlaceholder="Search employee..."
                        />
                    </div>
                    <button 
                        onClick={handleAssign} 
                        disabled={!selectedEmployee || loading}
                        style={{ padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px', fontSize: '16px' }}
                    >
                        {loading ? 'Assigning...' : 'Assign Now'}
                    </button>
                </div>
            </Dialog>

            <RangeSelectionModal 
                visible={rangeModalVisible} 
                onHide={() => setRangeModalVisible(false)} 
                onSelect={handleRangeSelect} 
            />

        </Dashboard>
    );
}
