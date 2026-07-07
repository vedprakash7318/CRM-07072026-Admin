import React, { useState, useEffect, useRef } from 'react';
import './CSS/EmployeeCardView.css';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Paginator } from 'primereact/paginator';
import Swal from 'sweetalert2';

function EmployeeCardView() {
    const APi_Url = import.meta.env.VITE_API_URL;
    const [searchValue, setSearchValue] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lazyState, setLazyState] = useState({
        first: 0,
        rows: 6,
        page: 1,
        totalRecords: 0
    });
    
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

    // Load initial data and when pagination/search changes
    useEffect(() => {
        loadEmployees();
    }, [lazyState.page, lazyState.rows, searchValue]);

    const onPageChange = (event) => {
        setLazyState({
            ...lazyState,
            first: event.first,
            rows: event.rows,
            page: Math.floor(event.first / event.rows) + 1
        });
    };

    const handleSearchChange = (e) => {
        setSearchValue(e.target.value);
        // Reset to first page when search changes
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
                // Reload the current page of employees
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

    const openAddEmployeeModal = () => {
        setIsEditing(false);
        setNewEmployee({
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
                detail: 'Please fill in all required fields before adding an employee.',
                life: 3000
            });
            return;
        }

        setLoading(true);
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
                loadEmployees(); // Reload the employees list
            }
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Failed to add employee!',
                life: 3000
            });
            console.error("Error details: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (employee) => {
        setIsEditing(true);
        setSelectedEmployee(employee);
        setNewEmployee({...employee});
        setShowEmployeeModal(true);
    };

    const handleUpdateEmployee = async () => {
        if (!newEmployee._id) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Employee ID is missing!',
                life: 3000
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.put(
                `${APi_Url}/digicoder/crm/api/v1/employee/update/${newEmployee._id}`,
                newEmployee,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (response.status === 200) {
                toast.current.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Employee updated successfully!',
                    life: 3000
                });
                closeEmployeeModal();
                loadEmployees(); // Reload the current page
            }
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || error.message || 'Failed to update employee!',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ position: "sticky", top: "0", backgroundColor: "white", padding: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <InputText
                        value={searchValue}
                        onChange={handleSearchChange}
                        placeholder="Search"
                        style={{ width: "200px" }}
                    />
                    <Button label="Add Employee" icon="pi pi-plus" onClick={openAddEmployeeModal} />
                </div>
            </div>

            <div className="content">
                {loading ? (
                    <div className="loading-indicator">
                        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                        <p>Loading employees...</p>
                    </div>
                ) : employees.length === 0 ? (
                    <div className="empty-message">
                        <p>No employees found. Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <div className="employee-cards-container">
                        {employees.map((employee, index) => (
                            <div key={employee._id || index} className="employee-card">
                                <div className="employee-card-header">
                                    <h5>{employee.empName}</h5>
                                </div>
                                <div className="employee-card-body">
                                    <p><strong>Phone:</strong> {employee.empPhoneNumber}</p>
                                    <p><strong>Email:</strong> {employee.empEmail}</p>
                                    <p><strong>Designation:</strong> {employee.empDesignation || 'N/A'}</p>
                                </div>
                                <div className="employee-card-actions">
                                    <button onClick={() => handleEdit(employee)} style={{ border: "none", borderRadius: "5px", color: "white", fontWeight: "bold", backgroundColor: "#4CAF50" }}>
                                        Edit
                                    </button>
                                    <button onClick={() => handleBlock(employee)} style={{ border: "none", borderRadius: "5px", color: "white", fontWeight: "bold", backgroundColor: "red" }}>
                                        Delete
                                    </button>
                                    <button onClick={() => handleView(employee)} style={{ border: "none", borderRadius: "5px", color: "white", fontWeight: "bold", backgroundColor: "#3454D1" }}>
                                        View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Pagination Controls */}
                <div className="card-pagination">
                    <Paginator
                        first={lazyState.first}
                        rows={lazyState.rows}
                        totalRecords={lazyState.totalRecords}
                        onPageChange={onPageChange}
                        template="PrevPageLink PageLinks NextPageLink"
                    />
                </div>
            </div>

            {/* Employee Modal */}
            <Dialog 
                header={isEditing ? "Edit Employee" : "Add New Employee"} 
                visible={showEmployeeModal} 
                onHide={closeEmployeeModal}
                
            >
                <div className="p-fluid">
                    <div className="p-field">
                        <label htmlFor="name">Name *</label>
                        <InputText
                            id="name"
                            value={newEmployee.empName}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empName: e.target.value })}
                            required
                        />
                    </div>
           
                    <div className="p-field">
                        <label htmlFor="email">Email *</label>
                        <InputText
                            id="email"
                            value={newEmployee.empEmail}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empEmail: e.target.value })}
                            required
                        />
                    </div>
                    <div className="p-field">
                        <label htmlFor="phone">Phone *</label>
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
                            type="password"
                            value={newEmployee.empPassword}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empPassword: e.target.value })}
                            required={!isEditing}
                        />
                    </div>
                    <div className="p-field">
                        <label htmlFor="DOB">Date of Birth</label>
                        <InputText
                            id="DOB"
                            type="date"
                            value={newEmployee.empDOB}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empDOB: e.target.value })}
                        />
                    </div>
                    <div className="p-field">
                        <label htmlFor="designation">Designation</label>
                        <InputText
                            id="designation"
                            value={newEmployee.empDesignation}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empDesignation: e.target.value })}
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
                        />
                    </div>
                    <div className="p-field">
                        <label htmlFor="City">City</label>
                        <InputText
                            id="City"
                            value={newEmployee.empCity}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empCity: e.target.value })}
                        />
                    </div>
                    <div className="p-field">
                        <label htmlFor="Country">Country</label>
                        <InputText
                            id="Country"
                            value={newEmployee.empCountry}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empCountry: e.target.value })}
                        />
                    </div>
                    <div className="p-field">
                        <label htmlFor="ZipCode">ZipCode</label>
                        <InputText
                            id="ZipCode"
                            value={newEmployee.empZipCode}
                            onChange={(e) => setNewEmployee({ ...newEmployee, empZipCode: e.target.value })}
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
                        onClick={isEditing ? handleUpdateEmployee : handleAddEmployee}
                        className="p-button-primary"
                        loading={loading}
                    />
                </div>
            </Dialog>

            {/* PrimeReact Toast Component */}
            <Toast ref={toast} position="top-right" />
        </div>
    );
}

export default EmployeeCardView;