import React, { useState, useEffect, useRef } from 'react';
import Dashboard from '../Components/Dashboard';
import './CSS/Empolyees.css';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import EmployeeCardView from './EmployeeCardView';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import Swal from 'sweetalert2';
import DeletedEmployee from './DeletedEmployee';

function Employee() {
    const APi_Url = import.meta.env.VITE_API_URL;
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    const [showTargetModal, setShowTargetModal] = useState(false);
    const [selectedEmpForTarget, setSelectedEmpForTarget] = useState(null);
    const [targetValue, setTargetValue] = useState(80);

    const openTargetModal = (employee) => {
        setSelectedEmpForTarget(employee);
        setTargetValue(employee?.target || 80);
        setShowTargetModal(true);
    };

    const closeTargetModal = () => {
        setShowTargetModal(false);
        setSelectedEmpForTarget(null);
    };

    const handleUpdateTarget = async () => {
        if (!targetValue || targetValue <= 0) {
            toast.current.show({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Target must be greater than 0',
                life: 3000
            });
            return;
        }

        try {
            setLoading(true);

            await axios.put(
                `${APi_Url}/digicoder/crm/api/v1/employee/update/${selectedEmpForTarget._id}`,
                { target: targetValue }
            );

            toast.current.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Target updated successfully!',
                life: 3000
            });

            closeTargetModal();
            loadEmployees();

        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Failed to update target',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };


    const [lazyState, setLazyState] = useState({
        first: 0,
        rows: 20,
        page: 1,
        totalRecords: 0
    });
    const [employees, setEmployees] = useState([]);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        empName: "",
        empPhoneNumber: "",
        empEmail: "",
        empPassword: "",
        empGender: "",
        empDOB: "",
        empDesignation: "",
        empCity: "",
        empState: "",
        empZipCode: "",
        empCountry: "",
        userType: 'Admin'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const toast = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Format date with timezone
    const formatDateWithTimezone = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Load employees with pagination and search
    const loadEmployees = async () => {
        setLoading(true);
        try {
            const AdminId = sessionStorage.getItem("AdminId");
            const response = await axios.get(
                `${APi_Url}/digicoder/crm/api/v1/employee/getall/${AdminId}`, {
                params: {
                    page: lazyState.page,
                    rows: lazyState.rows,
                    search: searchValue,
                    blocked: false
                }
            });

            if (response.data.success) {
                setEmployees(response.data.employees);
                setLazyState(prev => ({
                    ...prev,
                    totalRecords: response.data.pagination.totalRecords
                }));
            } else {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: response.data.message,
                    life: 3000
                });
            }
        } catch (error) {
            console.error("Error loading employees:", error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load employees',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    // Initial load and when pagination/search changes
    useEffect(() => {
        loadEmployees();
    }, [lazyState.page, lazyState.rows, searchValue]);

    const handleAddWithLoader = async () => {
        setLoading(true);
        try {
            await handleAddEmployee();
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateWithLoader = async () => {
        setLoading(true);
        try {
            await handleUpdateEmployee();
        } finally {
            setLoading(false);
        }
    };

    const onPageChange = (event) => {
        setLazyState({
            ...lazyState,
            first: event.first,
            rows: event.rows,
            page: event.page + 1
        });
    };

    const handleSearchChange = (e) => {
        // Reset to first page when search changes
        setSearchValue(e.target.value);
        setLazyState({
            ...lazyState,
            first: 0,
            page: 1
        });
    };

    const handleView = (rowData) => {
        localStorage.setItem("Employee", JSON.stringify(rowData));
        navigate('employeefullpage');
    };

    const handleBlock = async (rowData) => {
        const result = await Swal.fire({
            title: `Are you sure you want to block ${rowData.empName}?`,
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, block it!',
            cancelButtonText: 'No, cancel!',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            const AdminId = sessionStorage.getItem("AdminId");
            const blockEmployee = rowData._id;

            const response = await axios.put(
                `${APi_Url}/digicoder/crm/api/v1/employee/block/${AdminId}`,
                { empId: blockEmployee }
            );

            if (response.status === 200) {
                toast.current.show({
                    severity: 'success',
                    summary: 'Blocked',
                    detail: `${rowData.empName} has been blocked successfully.`,
                    life: 3000
                });
                // Reload employees after blocking
                loadEmployees();
            }
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to block the employee.',
                life: 3000
            });
        }
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex justify-content-around gap-3">

                {/* 🎯 NEW TARGET BUTTON */}
                <button
                    onClick={() => openTargetModal(rowData)}
                    style={{
                        borderRadius: "50%",
                        border: "none",
                        height: "40px",
                        width: "40px",
                        backgroundColor: "#E8FFF3",
                        color: "green"
                    }}
                >
                    🎯
                </button>

                <button onClick={() => handleBlock(rowData)} style={{ borderRadius: "50%", border: "none", height: "40px", width: "40px", backgroundColor: "#EDF1FF", color: "red" }}>
                    <i className="ri-lock-line"></i>
                </button>

                <button onClick={() => handleView(rowData)} style={{ borderRadius: "50%", border: "none", height: "40px", width: "40px", backgroundColor: "#EDF1FF", color: "#3454D1" }} title="View Profile">
                    <i className="ri-eye-line"></i>
                </button>
                
                <button 
                    onClick={() => navigate(`/employee/date-report/${rowData._id}`)} 
                    style={{ borderRadius: "50%", border: "none", height: "40px", width: "40px", backgroundColor: "#FFF4E5", color: "#FF9800" }}
                    title="View Date Report"
                >
                    <i className="ri-bar-chart-2-line"></i>
                </button>
            </div>
        );
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between gap-3 align-items-center p-2">
                <h5>Employee List</h5>
                <div>
                    <InputText
                        value={searchValue}
                        onChange={handleSearchChange}
                        placeholder="Search"
                        style={{ width: "100%", maxWidth: "200px", marginRight: "10px" }}
                    />
                    <Button label="Add Employee" icon="pi pi-plus" onClick={openAddEmployeeModal} />
                </div>
            </div>
        );
    };

    const openAddEmployeeModal = () => {
        setIsEditing(false);
        setNewEmployee({ empName: '', empPhoneNumber: '', empEmail: '', empPassword: '', userType: 'Admin' });
        setShowEmployeeModal(true);
    };

    const closeEmployeeModal = () => {
        setShowEmployeeModal(false);
        setSelectedEmployee(null);
    };

    const handleAddEmployee = async () => {
        if (!newEmployee.empName || !newEmployee.empPhoneNumber || !newEmployee.empEmail) {
            toast.current.show({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please fill in all fields before adding an employee.',
                life: 3000
            });
            return;
        }

        try {
            const AdminId = sessionStorage.getItem('AdminId');
            const apiUrl = `${APi_Url}/digicoder/crm/api/v1/employee/add/${AdminId}`;
            const response = await axios.post(apiUrl, newEmployee);

            if (response.status === 200 || response.status === 201) {
                toast.current.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Employee added successfully!',
                    life: 3000
                });
                setShowEmployeeModal(false);
                loadEmployees(); // Reload the employee list
            }
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Failed to add employee!',
                life: 3000
            });
            console.error("Error details: ", error);
        }
    };

    const handleEdit = (employee) => {
        setIsEditing(true);
        setSelectedEmployee(employee);
        setNewEmployee(employee);
        setShowEmployeeModal(true);
    };

    const handleUpdateEmployee = async () => {
        const EmployeeId = newEmployee._id;
        try {
            const response = await axios.put(
                `${APi_Url}/digicoder/crm/api/v1/employee/update/${EmployeeId}`,
                newEmployee,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            toast.current.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Employee updated successfully!',
                life: 3000,
            });
            closeEmployeeModal();
            loadEmployees(); // Reload the employee list
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || error.message || 'Failed to update employee!',
                life: 3000,
            });
        }
    };

    const header = renderHeader();

    const serialNumberTemplate = (rowData, { rowIndex }) => {
        return lazyState.first + rowIndex + 1;
    };

    return (
        <>
            <Dashboard active={'employee'}>
                <div className='large-view'>
                    <div className="content">
                        <DataTable
                            value={employees}
                            lazy
                            paginator
                            first={lazyState.first}
                            rows={lazyState.rows}
                            totalRecords={lazyState.totalRecords}
                            onPage={onPageChange}
                            loading={loading}
                            header={header}
                            emptyMessage="No employees found."
                            paginatorTemplate="PrevPageLink PageLinks NextPageLink"
                            style={{ borderRadius: "10px" }}
                        >
                            <Column header="SR No" body={serialNumberTemplate} style={{ width: '10%' }} />
                            <Column field="empName" header="Name" style={{ width: '20%' }} />
                            <Column field="empPhoneNumber" header="Phone" style={{ width: '20%' }} />
                            <Column field="empEmail" header="Email" style={{ width: '20%' }} />
                            <Column field="target" header="Target" style={{ width: '10%' }} />
                            <Column
                                header="Date Of Joining"
                                body={(rowData) => formatDateWithTimezone(rowData.createdAt)}
                                style={{ width: '20%' }}
                            />
                            <Column header="ACTION" body={actionBodyTemplate} style={{ width: '10%' }} />
                        </DataTable>
                    </div>
                    <DeletedEmployee />
                </div>
                <div className='card-view-employee'>
                    <EmployeeCardView />
                </div>
            </Dashboard>


            <Dialog
                header="Set Employee Target"
                visible={showTargetModal}
                onHide={closeTargetModal}
                style={{ width: '30vw' }}
            >
                <div className="p-fluid">

                    <div className="p-field mb-3">
                        <label>Employee Name</label>
                        <InputText
                            value={selectedEmpForTarget?.empName || ""}
                            disabled
                        />
                    </div>

                    <div className="p-field">
                        <label>Target</label>
                        <InputText
                            type="number"
                            value={targetValue}
                            onChange={(e) => setTargetValue(e.target.value)}
                            placeholder="Enter target"
                        />
                    </div>

                </div>

                <div className="p-d-flex p-jc-end mt-4">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        onClick={closeTargetModal}
                        className="p-button-text mr-3"
                    />

                    <Button
                        label="Save"
                        icon="pi pi-check"
                        onClick={handleUpdateTarget}
                        loading={loading}
                    />
                </div>
            </Dialog>

            {/* Employee Modal */}
            <Dialog
                header={isEditing ? "Edit Employee" : "Add New Employee"}
                visible={showEmployeeModal}
                onHide={closeEmployeeModal}
                style={{ width: '50vw' }}
            >
                <div className="p-fluid">
                    <div className="p-field">
                        <label htmlFor="name">Name</label>
                        <InputText
                            id="name"
                            value={newEmployee.empName}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="p-field">
                        <label htmlFor="email">Email</label>
                        <InputText
                            id="email"
                            value={newEmployee.empEmail}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empEmail: e.target.value })}
                            required
                        />
                    </div>

                    <div className="p-field">
                        <label htmlFor="phone">Phone</label>
                        <InputText
                            id="phone"
                            value={newEmployee.empPhoneNumber}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empPhoneNumber: e.target.value })}
                            required
                        />
                    </div>

                    <div className="p-field">
                        <label htmlFor="password">Password</label>
                        <InputText
                            id="password"
                            value={newEmployee.empPassword}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empPassword: e.target.value })}
                            required
                        />
                    </div>

                    <div className="p-field">
                        <label htmlFor="DOB">Date of Birth</label>
                        <InputText
                            id="DOB"
                            type="date"
                            value={newEmployee.empDOB}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empDOB: e.target.value })}
                            required
                        />
                    </div>

                    <div className="p-field">
                        <label htmlFor="designation">Designation</label>
                        <InputText
                            id="designation"
                            value={newEmployee.empDesignation}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empDesignation: e.target.value })}
                            required
                        />
                    </div>

                    <div className="p-field">
                        <label htmlFor="gender">Gender</label>
                        <Dropdown
                            id="gender"
                            value={newEmployee.empGender}
                            options={[
                                { label: 'Select', value: '' },
                                { label: 'Male', value: 'Male' },
                                { label: 'Female', value: 'Female' }
                            ]}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empGender: e.value })}
                            placeholder="Select Gender"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div className="p-field">
                        <label htmlFor="State">State</label>
                        <InputText
                            id="State"
                            value={newEmployee.empState}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empState: e.target.value })}
                            required
                        />
                    </div>

                    <div className="p-field">
                        <label htmlFor="City">City</label>
                        <InputText
                            id="City"
                            value={newEmployee.empCity}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empCity: e.target.value })}
                            required
                        />
                    </div>

                    <div className="p-field">
                        <label htmlFor="Country">Country</label>
                        <InputText
                            id="Country"
                            value={newEmployee.empCountry}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empCountry: e.target.value })}
                            required
                        />
                    </div>

                    <div className="p-field">
                        <label htmlFor="ZipCode">ZipCode</label>
                        <InputText
                            id="ZipCode"
                            value={newEmployee.empZipCode}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empZipCode: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="p-d-flex p-jc-end mt-5">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        onClick={closeEmployeeModal}
                        className="p-button-text mr-4"
                    />
                    <Button
                        label={isEditing ? "Update" : "Add"}
                        icon={isEditing ? "pi pi-check" : "pi pi-plus"}
                        onClick={isEditing ? handleUpdateWithLoader : handleAddWithLoader}
                        className="p-button-primary"
                        loading={loading}
                    />
                </div>
            </Dialog>

            <Toast ref={toast} position="top-right" />
        </>
    );
}

export default Employee;