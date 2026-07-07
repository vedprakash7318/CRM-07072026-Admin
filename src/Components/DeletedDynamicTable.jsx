import React, { useState, useEffect, useRef } from 'react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import Modal from './LeadForm';
import { useNavigate } from 'react-router-dom';
import './CSS/DynamicTable.css'
import AssignTaskModal from './AssignTaskModal';
import { Toast } from 'primereact/toast';
import Swal from 'sweetalert2'; // Import SweetAlert2

import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployee } from '../Features/LeadSlice';

export default function DeletedDynamicTable({ lead, tableTitle }) {
    const APi_Url=import.meta.env.VITE_API_URL
    const dispatch = useDispatch();
    const rawEmployees = useSelector((state) => state.leads.Employee);
    const employeeData = React.useMemo(() => {
        return (rawEmployees || []).filter((item) => item?.blocked === false);
    }, [rawEmployees]);
       useEffect(() => {  
            dispatch(fetchEmployee());
        }, [dispatch]);
    const toast = useRef(null);    
    const [leadData, setLeadData] = useState([]);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        phone: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        priority: { value: null, matchMode: FilterMatchMode.EQUALS },
        sources: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    });
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(5);
    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };
    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
    };
    const renderHeader = () => {
        return (
            <div className="flex justify-content-between gap-3 align-items-center p-2">
                <h5>{tableTitle}</h5>
                <div>
                    <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Keyword Search" style={{ width: "100%", maxWidth: "200px", marginRight: "10px" }} />
                    
                </div>
            </div>
        );
    };
    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex justify-content-center">
                <button onClick={() => handleRestore(rowData)} style={{  border: "none", height:"50px", width:"150px", backgroundColor: "#EDF1FF", color: "#3454D1", fontWeight: "bold" }}>
                   Restore
                </button>
            </div>
        );
    };
    const handleRestore = async (rowData) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, restore it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axios.put(`${APi_Url}/digicoder/crm/api/v1/lead/restore/${rowData._id}`);
                    
                    if (response.status === 200) {
                        
                        const updatedLeads = leadData.filter((item) => item._id !== rowData._id);
                        setLeadData(updatedLeads);
                        
                        
                        toast.current.show({severity: 'success',summary: 'Success',detail: 'Lead Restored successfully!',life: 3000});
                        window.location.reload();
                    }
                } catch (error) {
                    console.error("Error Restoring lead:", error);
                    
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'There was an error Restoring the lead.', life: 3000 });
                }
            }
        });
    };
    const header = renderHeader();
    return (
        <div className="card">
            <Toast ref={toast} />
            <DataTable
                value={lead}
                rows={rows}
                first={first}
                paginator
                dataKey="._id"
                filters={filters}
                filterDisplay="row"
                globalFilterFields={['name', 'phone', 'priority', 'sources', 'leadAssignedTo']}
                header={header}
                emptyMessage="No customers found."
                onPage={onPageChange}
                paginatorTemplate=" PrevPageLink PageLinks NextPageLink "
                removableSort
                style={{ borderRadius: "10px" }}
            >
                <Column
                    header="SR No"
                    body={(rowData, { rowIndex }) => (
                        <div className="flex align-items-center gap-3">
                          
                            {first + rowIndex + 1}  {/* Adjusting index for pagination */}
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
                                           return rowData.priority?.priorityText || "NA";
                                       }}
                                       sortable
                                       style={{ width: '10%', textAlign: "center" }}
                                   />
               
                                   <Column
                                       header="Sources"
                                       body={(rowData) => {
                                           if (!rowData.sources) return "NA";
                                           return rowData.sources?.leadSourcesText || "NA";
                                       }}
                                       sortable
                                       style={{ width: '15%' }}
                                   />
                <Column
                    header="Assigned TO"
                    body={(rowData) => rowData.leadAssignedTo?.empName || "NA"}
                    sortable
                    style={{ width: '20%' }}
                />
                <Column header="ACTION" body={actionBodyTemplate} style={{ width: '15%' }} />
            </DataTable>
        </div>
    );
}
