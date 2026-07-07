import React, { useState, useEffect, useRef } from 'react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import Modal from './LeadForm';
import { useNavigate } from 'react-router-dom';
import './CSS/DynamicTable.css';
import AssignTaskModal from './AssignTaskModal';
import { Toast } from 'primereact/toast';
import Swal from 'sweetalert2';

import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployee, fetchTags } from '../Features/LeadSlice';

export default function DynamicTable({ lead, tableTitle, onUpdate, onAssignSuccess }) {
    
    const APi_Url = import.meta.env.VITE_API_URL;
    const [showModal, setShowModal] = useState(false);
    const dispatch = useDispatch();
    const tagData = useSelector((state) => state.leads.tag);
    const rawEmployees = useSelector((state) => state.leads.Employee);
    const employeeData = React.useMemo(() => {
        return (rawEmployees || []).filter((item) => item?.blocked === false);
    }, [rawEmployees]);
    const [loading, setLoading] = useState(true);
    const [unassignModal, setUnassignModal] = useState(false);

    useEffect(() => {
        dispatch(fetchTags());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchEmployee());
    }, [dispatch]);

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
    
    // Initialize globalFilterValue from localStorage or empty string
    const getInitialGlobalFilterValue = () => {
        return localStorage.getItem('leadGlobalFilterValue') || '';
    };
    
    const [globalFilterValue, setGlobalFilterValue] = useState(getInitialGlobalFilterValue());
    
    // Initialize selectedTagValues from localStorage or empty array
    const getInitialSelectedTagValues = () => {
        const savedTags = localStorage.getItem('leadSelectedTags');
        return savedTags ? JSON.parse(savedTags) : [];
    };
    
    const [selectedTagValues, setSelectedTagValues] = useState(getInitialSelectedTagValues());

    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(5);
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

    // Save filters to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('leadTableFilters', JSON.stringify(filters));
    }, [filters]);

    // Save globalFilterValue to localStorage
    useEffect(() => {
        localStorage.setItem('leadGlobalFilterValue', globalFilterValue);
    }, [globalFilterValue]);

    // Save selectedTagValues to localStorage
    useEffect(() => {
        localStorage.setItem('leadSelectedTags', JSON.stringify(selectedTagValues));
    }, [selectedTagValues]);

    // Transform tag data into options for MultiSelect
    const tagsOptions = tagData.map((tag) => ({ 
        label: tag.tagName, // Use label for display
        value: tag.tagName  // Use value for selection
    }));

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
        // Reset selectAll when filter changes
        setSelectAll(false);
    };

    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    // Clear all filters function
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
        
        // Clear localStorage items
        localStorage.removeItem('leadTableFilters');
        localStorage.removeItem('leadGlobalFilterValue');
        localStorage.removeItem('leadSelectedTags');
        
        // Reset selection
        setSelectAll(false);
        setSelectedRows([]);
        
        toast.current.show({
            severity: 'info',
            summary: 'Filters Cleared',
            detail: 'All filters have been reset',
            life: 3000
        });
    };

    // Handle unassigning selected leads
    const handleUnassignLeads = () => {
        if (selectedRows.length === 0) {
            toast.current.show({ 
                severity: 'warn', 
                summary: 'Warning', 
                detail: 'Please select at least one lead before unassigning.', 
                life: 3000 
            });
        } else {
            // Show confirmation before unassigning
            setUnassignModal(true);
        }
    };

    // Perform the unassign operation
    const confirmUnassignLeads = async () => {
        try {
            // Get the IDs of the selected leads
            const leadIds = selectedRows.map(lead => lead._id);
            
            // Call API to unassign these leads
            const response = await axios.put(`${APi_Url}/digicoder/crm/api/v1/lead/unassign`, {
                leadIds: leadIds
            });
            
            if (response.status === 200) {
                toast.current.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Successfully unassigned ${selectedRows.length} leads`,
                    life: 3000
                });
                
                // Reset selection
                setSelectedRows([]);
                setSelectAll(false);
                
                // Refresh the lead data
                if (onUpdate) onUpdate();
                else if (onAssignSuccess) onAssignSuccess();
            }
        } catch (error) {
            console.error("Error unassigning leads:", error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to unassign leads. Please try again.',
                life: 3000
            });
        } finally {
            setUnassignModal(false);
        }
    };

    // Filter leads based on selected tags, global filter
    const getFilteredLeads = () => {
        // First filter by global search if it exists
        let filteredByGlobal = lead;
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
                        // Handle both string tags and object tags
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

        // Then filter by selected tags if any
        let filteredByTags = filteredByGlobal;
        if (selectedTagValues.length > 0) {
            filteredByTags = filteredByGlobal.filter(item => {
                // Check if item has tags and it's an array
                if (!item.tags || !Array.isArray(item.tags)) return false;
                
                // Check if ALL selected tags match the item's tags (instead of ANY)
                return selectedTagValues.every(selectedTag => {
                    return item.tags.some(tag => {
                        // Handle both string tags and object tags
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
    };

    // Get filtered data
    const filteredLeads = getFilteredLeads();

    // Update selected rows when select all changes or filtered leads change
    useEffect(() => {
        if (selectAll) {
            setSelectedRows([...filteredLeads]);
        } else {
            // If user unchecks "select all", clear all selections
            setSelectedRows([]);
        }
    }, [selectAll, filters.global.value, selectedTagValues]);

    // Handle the "Select All" checkbox change
    const handleSelectAllChange = (e) => {
        const checked = e.target.checked;
        setSelectAll(checked);
    };

    // Open range selection modal
    const openRangeModal = () => {
        setRangeModalOpen(true);
    };

    // Close range selection modal
    const closeRangeModal = () => {
        setRangeModalOpen(false);
    };

    // Handle range selection
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

        // Clear previous selections
        setSelectedRows([]);
        setSelectAll(false);

        // Select leads in the specified range (note: array is 0-indexed but user input is 1-indexed)
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

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between gap-3 align-items-center p-2">
                <div className="flex align-items-center">
                    <div style={{ marginLeft: '0' }}>
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAllChange}
                            id="selectAllCheckbox"
                        />
                        <label htmlFor="selectAllCheckbox" style={{ marginLeft: '5px' }}>Select All</label>

                        <button
                            onClick={openRangeModal}
                            style={{
                                marginLeft: '15px',
                                backgroundColor: '#EDF1FF',
                                color: '#3454D1',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer'
                            }}
                        >
                            Select Range
                        </button>
                    </div>
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
                            setSelectAll(false); // Reset selectAll when tag filter changes
                        }}
                        filter
                        placeholder="Filter by Tags"
                        style={{ width: "90%", maxWidth: "150px", marginRight: "10px" }}
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
                            padding: '8px 15px',
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
                <button onClick={() => handleEdit(rowData)} style={{ borderRadius: "50%", border: "none", height: "40px", width: "40px", backgroundColor: "#EDF1FF", color: "#3454D1" }}>
                    <i className="ri-edit-box-fill"></i>
                </button>
                <button onClick={() => handleDelete(rowData)} style={{ borderRadius: "50%", border: "none", height: "40px", width: "40px", backgroundColor: "#EDF1FF", color: "red" }}>
                    <i className="ri-delete-bin-5-fill"></i>
                </button>
                <button onClick={() => handleView(rowData)} style={{ borderRadius: "50%", border: "none", height: "40px", width: "40px", backgroundColor: "#EDF1FF", color: "#3454D1", fontWeight: "bold" }}>
                    <i className="ri-eye-line"></i>
                </button>
            </div>
        );
    };

    const handleShow = () => {
        if (selectedRows.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Please select at least one row before assigning.', life: 3000 });
        } else {
            setShowModal(true);
        }
    };

    const handleClose = () => setShowModal(false);
    const closeModal = () => {
        setIsModalOpen(false);
    };

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
                        toast.current.show({ severity: 'success', summary: 'Success', detail: 'Lead deleted successfully!', life: 3000 });
                        window.location.reload();
                    }
                } catch (error) {
                    console.error("Error deleting lead:", error);
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'There was an error deleting the lead.', life: 3000 });
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
            // Add the row to selected rows if not already there
            if (!selectedRows.some(row => row._id === rowData._id)) {
                setSelectedRows([...selectedRows, rowData]);
            }
        } else {
            // Remove the row from selected rows
            setSelectedRows(selectedRows.filter(row => row._id !== rowData._id));
            // Uncheck select all if it was checked
            if (selectAll) {
                setSelectAll(false);
            }
        }
    };

    const header = renderHeader();

    // Loading spinner component
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
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                    removableSort
                    style={{ borderRadius: "10px" }}
                    footer={
                        <div className="p-2">
                            <div className="selection-summary">
                                <strong>Selected: </strong>{selectedRows.length} of {filteredLeads.length} leads
                            </div>
                        </div>
                    }
                >
                    <Column
                        header="SR No"
                        body={(rowData, { rowIndex }) => (
                            <div className="flex align-items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.some(row => row._id === rowData._id)}
                                    onChange={(e) => handleCheckboxChange(e, rowData)}
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
                        body={(rowData) => {
                            if (!rowData.priority) return "NA";
                            return rowData?.priority?.priorityText || "NA";
                        }}
                        sortable
                        style={{ width: '10%', textAlign: "center" }}
                    />

                    <Column
                        header="Sources"
                        body={(rowData) => {
                            if (!rowData.sources) return "NA";
                            return rowData?.sources?.leadSourcesText || "NA";
                        }}
                        sortable
                        style={{ width: '10%' }}
                    />
                   
                    <Column
                        header="Assigned TO"
                        body={(rowData) => {
                            // If there's no leadAssignedTo or it's not an array
                            if (!rowData.leadAssignedTo) return "NA";

                            // If leadAssignedTo is an array of employee objects
                            if (Array.isArray(rowData.leadAssignedTo)) {
                                // Filter out any undefined or null values
                                const validNames = rowData.leadAssignedTo
                                    .map(emp => emp.empName)
                                    .filter(name => name);

                                // Show only first two names plus "..." if more exist
                                if (validNames.length <= 2) {
                                    return validNames.join(", ") || "NA";
                                } else {
                                    return `${validNames[0]}, ${validNames[1]}.....`;
                                }
                            }

                            // If it's a single employee object (current implementation)
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

            {/* Unassign Confirmation Modal */}
            {unassignModal && (
                <div className="unassign-confirmation-modal" style={{
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
                        <h3>Unassign Leads</h3>
                        <p>Are you sure you want to unassign {selectedRows.length} selected lead(s)?</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={() => setUnassignModal(false)}
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
                                onClick={confirmUnassignLeads}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    backgroundColor: '#FF5A5F',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Unassign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={title} buttonTitle={buttonTitle} leadData={leadData} />
            <AssignTaskModal show={showModal} handleClose={handleClose} employees={employeeData} selectedData={selectedRows} onUpdate={onUpdate} onAssignSuccess={onAssignSuccess} />
        </div>
    );
}