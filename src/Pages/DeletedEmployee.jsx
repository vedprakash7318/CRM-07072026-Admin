import React, { useState, useEffect, useRef } from 'react';
import './CSS/Empolyees.css';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

function DeletedEmployee() {
    const APi_Url = import.meta.env.VITE_API_URL;
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(20);
    const [data, setData] = useState([]);
    const toast = useRef(null);
    const navigate = useNavigate();

    const fetchBlockedEmployees = async () => {
        try {
            const AdminId = sessionStorage.getItem("AdminId");
            const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/employee/employees/blocked/${AdminId}`);
            setData(response.data.employees || []);
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to fetch blocked employees',
                life: 3000
            });
        }
    };

    useEffect(() => {
        fetchBlockedEmployees();
    }, []);

    const filters = {
        global: { value: globalFilterValue, matchMode: FilterMatchMode.CONTAINS },
        empName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        empPhoneNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    };

    const onGlobalFilterChange = (e) => {
        setGlobalFilterValue(e.target.value);
    };

    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    const handleUnBlock = async (rowData) => {
        const result = await Swal.fire({
            title: `Are you sure you want to unblock ${rowData.empName}?`,
            text: "This action will restore access.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, unblock it!',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            const AdminId = sessionStorage.getItem("AdminId");
            const unblockEmployee = rowData._id;

            const response = await axios.put(
                `${APi_Url}/digicoder/crm/api/v1/employee/unblock/${AdminId}`,
                { empId: unblockEmployee }
            );

            if (response.status === 200) {
                toast.current.show({
                    severity: 'success',
                    summary: 'Unblocked',
                    detail: `${rowData.empName} has been unblocked successfully.`,
                    life: 3000
                });
                fetchBlockedEmployees();
            }
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to unblock the employee.',
                life: 3000
            });
        }
    };

    const handleView = (rowData) => {
        localStorage.setItem("Employee", JSON.stringify(rowData));
        navigate('employeefullpage');
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex justify-content-around gap-3">
            <button
                onClick={() => handleUnBlock(rowData)}
                style={{
                    borderRadius: "50%",
                    border: "none",
                    height: "40px",
                    width: "40px",
                    backgroundColor: "#EDF1FF",
                    color: "red"
                }}
            >
                <i className="ri-lock-unlock-line"></i>
            </button>
            <button
                onClick={() => handleView(rowData)}
                style={{
                    borderRadius: "50%",
                    border: "none",
                    height: "40px",
                    width: "40px",
                    backgroundColor: "#EDF1FF",
                    color: "#3454D1",
                    fontWeight: "bold"
                }}
            >
                <i className="ri-eye-line"></i>
            </button>
        </div>
    );

    const renderHeader = () => (
        <div className="flex justify-content-between gap-3 align-items-center p-2">
            <h5>Blocked Employees</h5>
            <InputText
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                placeholder="Search"
                style={{ width: "100%", maxWidth: "200px" }}
            />
        </div>
    );

    const serialNumberTemplate = (rowData, { rowIndex }) => {
        return rowIndex + 1 + first;
    };

    return (
        <>
            <div className='large-view'>
                <div className="content">
                    <DataTable
                        value={data}
                        rows={rows}
                        first={first}
                        paginator
                        filters={filters}
                        filterDisplay="row"
                        globalFilter={globalFilterValue}
                        globalFilterFields={['empName', 'empPhoneNumber', 'empEmail']}
                        header={renderHeader()}
                        emptyMessage="No blocked employees found."
                        onPage={onPageChange}
                        paginatorTemplate="PrevPageLink PageLinks NextPageLink"
                        removableSort
                        style={{ borderRadius: "10px" }}
                    >
                        <Column header="SR No" body={serialNumberTemplate} style={{ width: '10%' }} />
                        <Column field="empName" header="Name" sortable style={{ width: '20%' }} />
                        <Column field="empPhoneNumber" header="Phone" sortable style={{ width: '15%' }} />
                        <Column field="empEmail" header="Email" sortable style={{ width: '20%' }} />
                        <Column field="createdAt" header="Date Of Joining" sortable style={{ width: '20%' }} />
                        <Column header="Actions" body={actionBodyTemplate} style={{ width: '15%' }} />
                    </DataTable>
                </div>
            </div>

            <Toast ref={toast} position="top-right" />
        </>
    );
}

export default DeletedEmployee;
