import React, { useState, useEffect, useRef } from 'react';
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

export default function DeletedDynamicCard({ lead, tableTitle }) {
    const APi_Url=import.meta.env.VITE_API_URL
    const toast = useRef(null);
    const dispatch = useDispatch();
    const rawEmployees = useSelector((state) => state.leads.Employee);
    const employeeData = React.useMemo(() => {
        return (rawEmployees || []).filter((item) => item?.blocked === false);
    }, [rawEmployees]);
    // Fetching employees
    useEffect(() => {  
               dispatch(fetchEmployee());
           }, [dispatch]);
   
    const [leadData, setLeadData] = useState([]);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        phone: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        priority: { value: null, matchMode: FilterMatchMode.EQUALS },
        source: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    });

    const [globalFilterValue, setGlobalFilterValue] = useState('');
 
    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const filteredLeads = lead?.filter((rowData) => {
        const match = filters.global.value ? rowData.name.toLowerCase().includes(filters.global.value.toLowerCase()) ||
            rowData?.phone.toLowerCase().includes(filters.global.value.toLowerCase()) ||
            rowData?.priority.toLowerCase().includes(filters.global.value.toLowerCase()) ||
            rowData?.source.toLowerCase().includes(filters.global.value.toLowerCase())
            : true;
        return match;
    });




    const handleRestore = async (rowData) => {
        // Use SweetAlert2 for confirmation
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
                    const response = await axios.put(`${APi_Url}/digicoder/crm/api/v1/lead/restore/${rowData._id}`);
                    
                    if (response.status === 200) {
                        // Filter out the deleted lead from the leadData state
                        const updatedLeads = leadData.filter((item) => item._id !== rowData._id);
                        setLeadData(updatedLeads);
                        
                        // Show success toast notification
                        toast.current.show({severity: 'success',summary: 'Success',detail: 'Lead deleted successfully!',life: 3000});
                        window.location.reload();
                    }
                } catch (error) {
                    console.error("Error deleting lead:", error);
                    // alert("There was an error deleting the lead.");
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'There was an error deleting the lead.', life: 3000 });
                }
            }
        });
    };




    const renderHeader = () => {
        return (
            <div className="flex justify-content-between gap-3 align-items-center p-2">
                <h5>{tableTitle}</h5>
                <div style={{ display: "flex" }}>
                    <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Keyword Search" style={{ width: "100%", maxWidth: "200px", marginRight: "10px" }} />
                  
                </div>
            </div>
        );
    };

    return (
        <div className="card">
            <Toast ref={toast} />  {/* Toast component */}

            {/* Header */}
            {renderHeader()}

            {/* Card Layout for Leads */}
            <div className="card-container">
                {Array.isArray(filteredLeads) && filteredLeads.length > 0 ? (
                    filteredLeads.map((rowData, index) => (
                        <div className="lead-card" key={rowData.id}>
                            <div className="lead-card-body">
                                <p><strong>Name:</strong> {rowData.name}</p>
                                <p><strong>Phone:</strong> {rowData.phone}</p>
                                <p><strong>Priority:</strong> {rowData.priority.priorityText}</p>
                                <p><strong>Source:</strong> {rowData.sources.leadSourcesText}</p>
                                <p><strong>Assigned To:</strong> {rowData.leadAssignedTo?.empName}</p>
                            </div>
                            <div className="lead-card-actions">
                               
                                <button onClick={() => handleRestore(rowData)} className="action-button view">Restore</button>
                                
                            </div>
                        </div>
                    ))
                ) : (
                    <div>No leads found</div>
                )}
            </div>
        </div>
    );
}
