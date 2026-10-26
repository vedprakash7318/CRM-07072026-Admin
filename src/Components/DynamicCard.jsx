import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';
import Modal from './LeadForm';
import { useNavigate } from 'react-router-dom';
import './CSS/DynamicCard.css'
import './CSS/DynamicTable.css'
import AssignTaskModal from './AssignTaskModal';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployee } from '../Features/LeadSlice';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function DynamicCard({
    lead,
    tableTitle,
    onPageChange,
    first,
    rows,
    totalRecords,
    loading,
    onEmployeeFilter,
    employeeOptions,
    onTagsChange,
    tagOptions,
    selectedTags,
    onUpdate,
    onAssignSuccess,
    lazy = true
}) {
    const APi_Url = import.meta.env.VITE_API_URL
    const [showModal, setShowModal] = useState(false);
    const toast = useRef(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const rawEmployees = useSelector((state) => state.leads.Employee);
    const employeeData = React.useMemo(() => {
        return (rawEmployees || []).filter((item) => item?.blocked === false);
    }, [rawEmployees]);
    // Fetching employees
    useEffect(() => {
        dispatch(fetchEmployee());
    }, [dispatch]);


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [buttonTitle, setButtonTitle] = useState('');
    const [leadData, setLeadData] = useState([]);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        phone: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        priority: { value: null, matchMode: FilterMatchMode.EQUALS },
        source: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    });

    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);

    const handleShow = () => {
        if (selectedRows.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Please select at least one row before assigning.', life: 3000 });
        } else {
            setShowModal(true);
        }
    };

    const handleClose = () => setShowModal(false);


    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);

        if (onGlobalSearch) {
            onGlobalSearch(value);
        }
    };


    const filteredLeads = useMemo(() => {
        return lead.filter((rowData) => {
            const searchValue = filters.global.value?.toLowerCase();

            if (!searchValue) return true; // No global filter? Return all.

            return (
                rowData.name?.toLowerCase().includes(searchValue) ||
                rowData.phone?.toLowerCase().includes(searchValue) ||
                rowData.priority?.priorityText?.toLowerCase().includes(searchValue) ||
                rowData.sources?.leadSourcesText?.toLowerCase().includes(searchValue) ||
                rowData.leadAssignedTo?.empName?.toLowerCase().includes(searchValue) ||
                (Array.isArray(rowData.tags) &&
                    rowData.tags.some(tag => String(tag).toLowerCase().includes(searchValue)))
            );
        });
    }, [lead, filters.global.value]);

    const openModal = (isEdit) => {
        setEditMode(isEdit);
        setTitle(isEdit ? "Update Lead" : "Add New Lead");
        setButtonTitle(isEdit ? "Update Lead" : "Add Lead");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        if (onUpdate) onUpdate();
    };

    const handleEdit = (rowData) => {
        const viewdata = rowData;
        navigate('/fullLeads', { state: { viewdata, tableTitle } });
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
                        if (onUpdate) onUpdate();
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
            setSelectedRows([...selectedRows, rowData]);
        } else {
            setSelectedRows(selectedRows.filter(item => item !== rowData));
        }
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between gap-3 align-items-center p-2">
                <h5>{tableTitle}</h5>
                <div style={{ display: "flex" }}>
                    {/* <InputText 
                        value={globalFilterValue} 
                        onChange={onGlobalFilterChange} 
                        placeholder="Keyword Search" 
                        style={{ width: "100%", maxWidth: "200px", marginRight: "10px" }} 
                    /> */}
                    <button onClick={handleShow} className='assignLeadBtn'>Assign Leads</button>
                </div>
            </div>
        );
    };

    const renderPagination = () => {
        if (!totalRecords || totalRecords <= rows) return null;

        const totalPages = Math.ceil(totalRecords / rows);
        const currentPage = Math.floor(first / rows) + 1;

        return (
            <div className="pagination-container">
                <button
                    onClick={() => onPageChange({ first: Math.max(0, first - rows), rows })}
                    disabled={currentPage === 1}
                >
                    <i className="ri-arrow-left-line"></i>
                </button>

                <div className="page-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let startPage = Math.max(1, currentPage - 2);
                        let endPage = startPage + 4;

                        if (endPage > totalPages) {
                            endPage = totalPages;
                            startPage = Math.max(1, endPage - 4);
                        }

                        const pageNum = startPage + i;
                        const pageFirstIndex = (pageNum - 1) * rows;

                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange({ first: pageFirstIndex, rows })}
                                className={`page-number-btn ${currentPage === pageNum ? 'active-page' : ''}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => onPageChange({ first: first + rows, rows })}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <i className="ri-arrow-right-line"></i>
                </button>
            </div>
        );
    };

    const clearSelection = () => {
        setSelectedRows([]);
        setSelectAll(false);
    };

    return (
        <div className="dynamic-card-container">
            <Toast ref={toast} />

            {/* Header */}
            {renderHeader()}

            {/* Loading indicator */}
            {loading && <div className="loading">Loading...</div>}

            {/* Card Layout for Leads */}
            <div className="card-container">
                {Array.isArray(filteredLeads) && filteredLeads.length > 0 ? (
                    (lazy ? filteredLeads : filteredLeads.slice(first, first + rows)).map((rowData, index) => (
                        <div className="lead-card" key={rowData._id} style={{ position: 'relative', overflow: 'hidden' }}>
                            {tableTitle === 'Missed Leads' && rowData.nextFollowupDate && (
                                <div style={{
                                    backgroundColor: "#ffeaea",
                                    color: "#e74c3c",
                                    padding: "8px 10px",
                                    textAlign: "center",
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    borderBottom: "1px solid #ffc9c9",
                                    marginBottom: "10px"
                                }}>
                                    <i className="pi pi-calendar-times" style={{ marginRight: '5px' }}></i>
                                    Missed Date: {new Date(rowData.nextFollowupDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </div>
                            )}
                            <div className="lead-card-header">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.includes(rowData)}
                                    onChange={(e) => handleCheckboxChange(e, rowData)}
                                />
                                <span>{first + index + 1}</span>
                            </div>
                            <div className="lead-card-body">
                                <p><strong>Name:</strong> {rowData.name}</p>
                                <p><strong>Phone:</strong> {rowData.phone}</p>
                                {tableTitle !== 'Public Enquiries' && (
                                    <>
                                        <p><strong>Priority:</strong> {rowData.priority?.priorityText || "NA"}</p>
                                        <p><strong>Source:</strong> {rowData?.sources?.leadSourcesText || "NA"}</p>
                                    </>
                                )}
                                {tableTitle === 'Public Enquiries' && (
                                    <p><strong>Date:</strong> {rowData?.createdAt ? new Date(rowData.createdAt).toLocaleDateString("en-IN") : "NA"}</p>
                                )}
                                {tableTitle === 'Public Enquiries' && (
                                    <>
                                        <p><strong>Accepted By:</strong> {(() => {
                                            if (!rowData?.acceptedBy) return "NA";
                                            if (typeof rowData.acceptedBy === 'object') return rowData.acceptedBy.empName || "NA";
                                            const emp = rawEmployees?.find(e => e._id === rowData.acceptedBy);
                                            return emp ? emp.empName : "NA";
                                        })()}</p>
                                        <p><strong>Targeted Emp:</strong> {(() => {
                                            if (!rowData?.targetedEmployee) return "NA";
                                            if (typeof rowData.targetedEmployee === 'object') return rowData.targetedEmployee.empName || "NA";
                                            const emp = rawEmployees?.find(e => e._id === rowData.targetedEmployee);
                                            return emp ? emp.empName : "NA";
                                        })()}</p>
                                    </>
                                )}
                            </div>
                            <div className="lead-card-actions">
                                <button onClick={() => handleEdit(rowData)} className="action-button edit">Edit</button>
                                <button onClick={() => handleDelete(rowData)} className="action-button delete">Delete</button>
                                <button onClick={() => handleView(rowData)} className="action-button view">View</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div>No leads found</div>
                )}
            </div>

            {/* Pagination */}
            {renderPagination()}

            {/* Modals */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={title} buttonTitle={buttonTitle} leadData={leadData} />
            <AssignTaskModal show={showModal} handleClose={handleClose} employees={employeeData} selectedData={selectedRows} onUpdate={onUpdate} clearSelection={clearSelection} onAssignSuccess={onAssignSuccess} />
        </div>
    );
}