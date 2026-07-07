import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import Modal from './LeadForm';
import { useNavigate } from 'react-router-dom';
import './CSS/DynamicTable.css';
import { Dropdown } from 'primereact/dropdown';
import AssignTaskModal from './AssignTaskModal';
import { Toast } from 'primereact/toast';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTags } from '../Features/LeadSlice';

export default function DynamicTable({
    lead,
    tableTitle,
    onPageChange,
    first,
    rows,
    totalRecords,
    onEmployeeFilter,
    onTagsChange,
    onUpdate,
    onAssignSuccess
}) {
    const APi_Url = import.meta.env.VITE_API_URL;
    const [showModal, setShowModal] = useState(false);
    const dispatch = useDispatch();
    const tagData = useSelector((state) => state.leads.tag);
    const rawEmployees = useSelector((state) => state.leads.Employee);
    const employeeData = React.useMemo(() => {
        return (rawEmployees || []).filter((item) => item?.blocked === false);
    }, [rawEmployees]);
    const [loading, setLoading] = useState(true);
    const [unassignModalOpen, setUnassignModalOpen] = useState(false);
    const [assignedEmployees, setAssignedEmployees] = useState([]);
    const [selectedEmployeesToRemove, setSelectedEmployeesToRemove] = useState([]);
    const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState(null);
    const [unassignLoading, setUnassignLoading] = useState(false); // New state for unassign loader
    
    useEffect(() => {
        dispatch(fetchTags());
    }, [dispatch]);
    
    const employeeOptions = employeeData.map(emp => ({
        label: emp.empName,
        value: emp._id
    }));

    useEffect(() => {
        if (lead) {
            const timer = setTimeout(() => {
                setLoading(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [lead]);

    const toast = useRef(null);

    // Initialize filters from localStorage or use defaults
    const getInitialFilters = () => {
        const savedFilters = localStorage.getItem('leadTableFilters');
        if (savedFilters) {
            return JSON.parse(savedFilters);
        }
        return {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
            phone: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
            priority: { value: null, matchMode: FilterMatchMode.EQUALS },
            sources: { value: null, matchMode: FilterMatchMode.STARTS_WITH }
        };
    };

    const [filters, setFilters] = useState(getInitialFilters());
    const [globalFilterValue, setGlobalFilterValue] = useState(localStorage.getItem('leadGlobalFilterValue') || '');
    const [selectedTagValues, setSelectedTagValues] = useState(getInitialSelectedTagValues());
    const [selectedRows, setSelectedRows] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [isEditMode, setEditMode] = useState(false);
    const [buttonTitle, setButtonTitle] = useState('');
    const [leadData, setLeadData] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [rangeModalOpen, setRangeModalOpen] = useState(false);
    const [rangeStart, setRangeStart] = useState();
    const [rangeEnd, setRangeEnd] = useState();
    const navigate = useNavigate();

    function getInitialSelectedTagValues() {
        const savedTags = localStorage.getItem('leadSelectedTags');
        return savedTags ? JSON.parse(savedTags) : [];
    }

    useEffect(() => {
        localStorage.setItem('leadTableFilters', JSON.stringify(filters));
    }, [filters]);

    useEffect(() => {
        localStorage.setItem('leadGlobalFilterValue', globalFilterValue);
    }, [globalFilterValue]);

    useEffect(() => {
        localStorage.setItem('leadSelectedTags', JSON.stringify(selectedTagValues));
    }, [selectedTagValues]);

    const tagsOptions = tagData.map((tag) => ({
        label: tag.tagName,
        value: tag.tagName
    }));

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
        setSelectAll(false);
    };
    
    useEffect(() => {
        if (onTagsChange) {
            const tagIds = selectedTagValues.map(tag => {
                const tagObject = tagData.find(t => t.tagName === tag);
                return tagObject ? tagObject._id : tag;
            });
            onTagsChange(tagIds);
        }
    }, [selectedTagValues, tagData]);

    const clearAllFilters = () => {
        setGlobalFilterValue('');
        setSelectedTagValues([]);
        setFilters({
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
            phone: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
            priority: { value: null, matchMode: FilterMatchMode.EQUALS },
            sources: { value: null, matchMode: FilterMatchMode.STARTS_WITH }
        });

        localStorage.removeItem('leadTableFilters');
        localStorage.removeItem('leadGlobalFilterValue');
        localStorage.removeItem('leadSelectedTags');

        setSelectAll(false);
        setSelectedRows([]);

        toast.current.show({
            severity: 'info',
            summary: 'Filters Cleared',
            detail: 'All filters have been reset',
            life: 3000
        });
    };

    const handleUnassignLeads = () => {
        if (selectedRows.length === 0) {
            toast.current.show({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select at least one lead before unassigning.',
                life: 3000
            });
            return;
        }

        const employeesMap = new Map();
        selectedRows.forEach(lead => {
            if (lead.leadAssignedTo && Array.isArray(lead.leadAssignedTo)) {
                lead.leadAssignedTo.forEach(emp => {
                    if (emp._id && !employeesMap.has(emp._id)) {
                        employeesMap.set(emp._id, emp);
                    }
                });
            }
        });

        const uniqueEmployees = Array.from(employeesMap.values());
        if (uniqueEmployees.length === 0) {
            toast.current.show({
                severity: 'info',
                summary: 'No Assignments',
                detail: 'Selected leads have no assigned employees.',
                life: 3000
            });
            return;
        }

        setAssignedEmployees(uniqueEmployees);
        setSelectedEmployeesToRemove([]);
        setUnassignModalOpen(true);
    };

    const confirmUnassignSelected = async () => {
        const leadIds = selectedRows.map(lead => lead._id);
        const employeeIdsToRemove = selectedEmployeesToRemove;
        
        setUnassignLoading(true); // Start loading
        
        try {
            const response = await axios.put(`${APi_Url}/digicoder/crm/api/v1/lead/unassign`, {
                leadIds,
                employeeIdsToRemove
            });
            
            if (response.status === 200) {
                toast.current.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Removed ${selectedEmployeesToRemove.length} employees from ${selectedRows.length} leads`,
                    life: 3000
                });

                setSelectedRows([]);
                setSelectAll(false);
                setUnassignModalOpen(false);
                if (onUpdate) onUpdate();
                else if (onAssignSuccess) onAssignSuccess();
            }
        } catch (error) {
            console.error("Error unassigning employees:", error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to remove employees. Please try again.',
                life: 3000
            });
        } finally {
            setUnassignLoading(false); // Stop loading regardless of outcome
        }
    };

    const filteredLeads = useMemo(() => {
        let filteredByGlobal = lead;
        if (selectedEmployeeFilter) {
            filteredByGlobal = filteredByGlobal.filter(item => {
                if (!item.leadAssignedTo) return false;
                if (Array.isArray(item.leadAssignedTo)) {
                    return item.leadAssignedTo.some(emp => emp._id === selectedEmployeeFilter);
                }
                return item.leadAssignedTo._id === selectedEmployeeFilter;
            });
        }

        if (filters.global.value) {
            const searchValue = filters.global.value?.toLowerCase();
            filteredByGlobal = lead.filter(item => {
                return (
                    (item.name && item.name.toLowerCase().includes(searchValue)) ||
                    (item.phone && item.phone.toLowerCase().includes(searchValue)) ||
                    (item.leadAssignedTo?.empName && item.leadAssignedTo.empName.toLowerCase().includes(searchValue)) ||
                    (item.priority?.priorityText && item.priority.priorityText.toLowerCase().includes(searchValue)) ||
                    (item.sources?.leadSourcesText && item.sources.leadSourcesText.toLowerCase().includes(searchValue)) ||
                    (item.tags && item.tags.some(tag => {
                        if (typeof tag === 'string') {
                            return tag.toLowerCase().includes(searchValue);
                        } else if (typeof tag === 'object' && tag !== null) {
                            return tag.tagName?.toLowerCase().includes(searchValue);
                        }
                        return false;
                    }))
                );
            });
        }

        let filteredByTags = filteredByGlobal;
        if (selectedTagValues.length > 0) {
            filteredByTags = filteredByGlobal.filter(item => {
                if (!item.tags || !Array.isArray(item.tags)) return false;
                return selectedTagValues.every(selectedTag => {
                    return item.tags.some(tag => {
                        if (typeof tag === 'string') {
                            return tag.toLowerCase() === selectedTag.toLowerCase();
                        } else if (typeof tag === 'object' && tag !== null) {
                            return tag.tagName?.toLowerCase() === selectedTag.toLowerCase();
                        }
                        return false;
                    });
                });
            });
        }

        return filteredByTags;
    }, [lead, selectedEmployeeFilter, filters.global.value, selectedTagValues]);

    const handleSelectAllChange = (e) => {
        const checked = e.target.checked;
        setSelectAll(checked);
        if (checked) {
            setSelectedRows([...filteredLeads]);
        } else {
            setSelectedRows([]);
        }
    };

    const openRangeModal = () => {
        setRangeModalOpen(true);
    };

    const closeRangeModal = () => {
        setRangeModalOpen(false);
    };

    const handleRangeSelection = () => {
        if (rangeStart < 1 || rangeEnd > filteredLeads.length || rangeStart > rangeEnd) {
            toast.current.show({
                severity: 'warn',
                summary: 'Invalid Range',
                detail: `Please enter a valid range between 1 and ${filteredLeads.length}`,
                life: 3000
            });
            return;
        }
        setSelectedRows([]);
        setSelectAll(false);

        const newSelectedRows = [];
        for (let i = rangeStart - 1; i < rangeEnd && i < filteredLeads.length; i++) {
            newSelectedRows.push(filteredLeads[i]);
        }

        setSelectedRows(newSelectedRows);
        closeRangeModal();

        toast.current.show({
            severity: 'success',
            summary: 'Range Selected',
            detail: `Selected ${newSelectedRows.length} leads from range ${rangeStart} to ${rangeEnd}`,
            life: 3000
        });
    };
    
    const handleRowClick = (e) => {
        const rowData = e.data;
        const isSelected = selectedRows.some(row => row._id === rowData._id);
        
        if (isSelected) {
            setSelectedRows(selectedRows.filter(row => row._id !== rowData._id));
            if (selectAll) {
                setSelectAll(false);
            }
        } else {
            setSelectedRows([...selectedRows, rowData]);
        }
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between gap-3 align-items-center p-2">
                <div className="flex align-items-center">
                    <Dropdown
                        value={selectedEmployeeFilter}
                        options={employeeOptions}
                        onChange={(e) => {
                            setSelectedEmployeeFilter(e.value);
                            onEmployeeFilter(e.value);
                        }}
                        optionLabel="label"
                        placeholder="Filter by Employee"
                        showClear
                    />
                </div>
                <div className="flex align-items-center">
                    <InputText
                        value={globalFilterValue}
                        onChange={onGlobalFilterChange}
                        placeholder="Keyword Search"
                        style={{ width: "100%", maxWidth: "200px", marginRight: "10px" }}
                    />
                    <MultiSelect
                        value={selectedTagValues}
                        options={tagsOptions}
                        optionLabel="label"
                        onChange={(e) => {
                            setSelectedTagValues(e.value);
                            setSelectAll(false);
                        }}
                        filter
                        placeholder="Filter by Tags"
                        style={{ width: "20%", maxWidth: "150px", marginRight: "10px" }}
                        display="chip"
                    />
                    <button
                        onClick={clearAllFilters}
                        style={{
                            backgroundColor: '#f8f9fa',
                            color: '#6c757d',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            padding: '10px 8px',
                            cursor: 'pointer',
                            marginRight: '10px'
                        }}
                    >
                        <i className="ri-filter-off-line" style={{ marginRight: '5px' }}></i>
                    </button>
                    <button onClick={handleShow} className='assignLeadBtn' style={{ marginRight: '10px' }}>
                        Assign Leads {selectedRows.length > 0 ? `(${selectedRows.length})` : ''}
                    </button>
                    <button
                        onClick={handleUnassignLeads}
                        style={{
                            backgroundColor: '#FF5A5F',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '12px 10px',
                            cursor: 'pointer'
                        }}
                    >
                        Unassign Leads {selectedRows.length > 0 ? `(${selectedRows.length})` : ''}
                    </button>
                </div>
            </div>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex justify-content-around gap-3">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(rowData);
                    }} 
                    style={{ borderRadius: "50%", border: "none", height: "40px", width: "40px", backgroundColor: "#EDF1FF", color: "#3454D1" }}
                >
                    <i className="ri-edit-box-fill"></i>
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(rowData);
                    }} 
                    style={{ borderRadius: "50%", border: "none", height: "40px", width: "40px", backgroundColor: "#EDF1FF", color: "red" }}
                >
                    <i className="ri-delete-bin-5-fill"></i>
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleView(rowData);
                    }} 
                    style={{ borderRadius: "50%", border: "none", height: "40px", width: "40px", backgroundColor: "#EDF1FF", color: "#3454D1", fontWeight: "bold" }}
                >
                    <i className="ri-eye-line"></i>
                </button>
            </div>
        );
    };

    const handleShow = () => {
        if (selectedRows.length === 0) {
            toast.current.show({ 
                severity: 'warn', 
                summary: 'Warning', 
                detail: 'Please select at least one row before assigning.', 
                life: 3000 
            });
        } else {
            setShowModal(true);
        }
    };

    const handleClose = () => setShowModal(false);
    const closeModal = () => setIsModalOpen(false);

    const handleEdit = (rowData) => {
        const viewdata = rowData;
        const fromEdit = "FromEdit";
        navigate('/fullLeads', { state: { tableTitle, fromEdit, viewdata } });
    };

    const handleDelete = async (rowData) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axios.put(`${APi_Url}/digicoder/crm/api/v1/lead/delete/${rowData._id}`);
                    if (response.status === 200) {
                        const updatedLeads = leadData.filter((item) => item._id !== rowData._id);
                        setLeadData(updatedLeads);
                        toast.current.show({ 
                            severity: 'success', 
                            summary: 'Success', 
                            detail: 'Lead deleted successfully!', 
                            life: 3000 
                        });
                        window.location.reload();
                    }
                } catch (error) {
                    console.error("Error deleting lead:", error);
                    toast.current.show({ 
                        severity: 'warn', 
                        summary: 'Warning', 
                        detail: 'There was an error deleting the lead.', 
                        life: 3000 
                    });
                }
            }
        });
    };

    const handleView = (rowData) => {
        const viewdata = rowData;
        navigate('/fullLeads', { state: { viewdata, tableTitle } });
    };

    const handleCheckboxChange = (e, rowData) => {
        const checked = e.target.checked;
        if (checked) {
            if (!selectedRows.some(row => row._id === rowData._id)) {
                setSelectedRows([...selectedRows, rowData]);
            }
        } else {
            setSelectedRows(selectedRows.filter(row => row._id !== rowData._id));
            if (selectAll) {
                setSelectAll(false);
            }
        }
    };

    const header = renderHeader();
    const selectedRowIds = useMemo(() => {
        const ids = new Set();
        for (const row of selectedRows) {
            ids.add(row._id);
        }
        return ids;
    }, [selectedRows]);
    const rowClassName = (data) => selectedRowIds.has(data._id) ? 'selected-row' : '';

    const Loader = () => (
        <div className="loader-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
            width: '100%'
        }}>
            <div className="spinner" style={{
                border: '4px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '50%',
                borderTop: '4px solid #3454D1',
                width: '50px',
                height: '50px',
                animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .selected-row {
                    background-color: #e6f7ff !important;
                }
                .p-datatable .p-datatable-tbody > tr {
                    cursor: pointer;
                }
            `}</style>
        </div>
    );

    return (
        <div className="card">
            <Toast ref={toast} />

            {loading ? (
                <Loader />
            ) : (
                <DataTable
                    value={filteredLeads}
                    rows={rows}
                    first={first}
                    paginator
                    dataKey="_id"
                    filters={filters}
                    filterDisplay="menu"
                    header={header}
                    emptyMessage="No leads found."
                    onPage={onPageChange}
                    totalRecords={totalRecords}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                    removableSort
                    lazy
                    style={{ borderRadius: "10px" }}
                    rowClassName={rowClassName}
                    selectionMode="single"
                    onRowClick={handleRowClick}
                    footer={
                        <div className="p-2">
                            <div className="selection-summary">
                                <strong>Selected: </strong>{selectedRows.length} of {filteredLeads.length} leads
                            </div>
                        </div>
                    }
                >
                    <Column
                        header={
                            <div className="flex align-items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAllChange}
                                    id="selectAllCheckbox"
                                />
                                <label htmlFor="selectAllCheckbox">SR No</label>
                            </div>
                        }
                        body={(rowData, { rowIndex }) => (
                            <div className="flex align-items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.some(row => row._id === rowData._id)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        handleCheckboxChange(e, rowData);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {rowIndex + 1}
                            </div>
                        )}
                        style={{ width: '10%' }}
                    />

                    <Column field="name" header="NAME" sortable style={{ width: '15%' }} />
                    <Column field="phone" header="PHONE" sortable style={{ width: '15%' }} />
                    <Column
                        header="PRIORITY"
                        body={(rowData) => rowData?.priority?.priorityText || "NA"}
                        sortable
                        style={{ width: '10%', textAlign: "center" }}
                    />

                    <Column
                        header="Sources"
                        body={(rowData) => rowData?.sources?.leadSourcesText || "NA"}
                        sortable
                        style={{ width: '10%' }}
                    />

                    <Column
                        header="Assigned TO"
                        body={(rowData) => {
                            if (!rowData.leadAssignedTo) return "NA";
                            if (Array.isArray(rowData.leadAssignedTo)) {
                                const validNames = rowData.leadAssignedTo
                                    .map(emp => emp.empName)
                                    .filter(name => name);
                                if (validNames.length <= 2) {
                                    return validNames.join(", ") || "NA";
                                }
                                return `${validNames[0]}, ${validNames[1]}.....`;
                            }
                            return rowData.leadAssignedTo.empName || "NA";
                        }}
                        style={{ width: '15%' }}
                    />
                    <Column header="ACTION" body={actionBodyTemplate} style={{ width: '15%' }} />
                </DataTable>
            )}

            {/* Range Selection Modal */}
            {rangeModalOpen && (
                <div className="range-selection-modal" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '400px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }}>
                        <h3>Select Leads by Range</h3>
                        <p>Total available leads: {filteredLeads.length}</p>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Start (From):</label>
                            <input
                                type="number"
                                value={rangeStart}
                                onChange={(e) => setRangeStart(parseInt(e.target.value) || 1)}
                                min="1"
                                max={filteredLeads.length}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>End (To):</label>
                            <input
                                type="number"
                                value={rangeEnd}
                                onChange={(e) => setRangeEnd(parseInt(e.target.value) || rangeStart)}
                                min={rangeStart}
                                max={filteredLeads.length}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={closeRangeModal}
                                style={{
                                    padding: '8px 16px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: '#f5f5f5',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRangeSelection}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    backgroundColor: '#3454D1',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Select
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unassign Employees Modal */}
            {unassignModalOpen && (
                <div className="unassign-modal" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '500px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }}>
                        <h3>Remove Employees from Leads</h3>
                        <p>Select employees to remove from {selectedRows.length} lead(s):</p>

                        <div style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            margin: '15px 0',
                            border: '1px solid #eee',
                            borderRadius: '4px'
                        }}>
                            {assignedEmployees.map(employee => (
                                <div key={employee._id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '10px',
                                    borderBottom: '1px solid #f0f0f0',
                                    backgroundColor: selectedEmployeesToRemove.includes(employee._id) ? '#f8f9fa' : 'white'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedEmployeesToRemove.includes(employee._id)}
                                        onChange={() => {
                                            setSelectedEmployeesToRemove(prev =>
                                                prev.includes(employee._id)
                                                    ? prev.filter(id => id !== employee._id)
                                                    : [...prev, employee._id]
                                            );
                                        }}
                                        style={{
                                            marginRight: '10px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{employee.empName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                            {employee.designation || 'No designation specified'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '15px'
                        }}>
                            <div>
                                {selectedEmployeesToRemove.length > 0 && (
                                    <span style={{ color: '#666' }}>
                                        {selectedEmployeesToRemove.length} employee(s) selected
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setUnassignModalOpen(false)}
                                    style={{
                                        padding: '8px 16px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>

                                {selectedEmployeesToRemove.length > 0 && (
                                    <button
                                        onClick={confirmUnassignSelected}
                                        disabled={unassignLoading}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            backgroundColor: '#FF5A5F',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            opacity: unassignLoading ? 0.7 : 1
                                        }}
                                    >
                                        {unassignLoading && (
                                            <span className="spinner" style={{
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderRadius: '50%',
                                                borderTop: '2px solid white',
                                                width: '16px',
                                                height: '16px',
                                                animation: 'spin 1s linear infinite'
                                            }}></span>
                                        )}
                                        Remove Selected
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={title} buttonTitle={buttonTitle} leadData={leadData} />
            <AssignTaskModal show={showModal} handleClose={handleClose} employees={employeeData} selectedData={selectedRows} onUpdate={onUpdate} onAssignSuccess={onAssignSuccess} />
        </div>
    );
}