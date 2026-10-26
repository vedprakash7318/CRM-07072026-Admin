import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Modal from 'react-bootstrap/Modal';
import Dashboard from '../../Components/Dashboard';
import Skeleton from '@mui/material/Skeleton';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { fetchServices } from '../../Features/LeadSlice';

function Services() {
  const [show, setShow] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // New state for edit modal
  const [servicesText, setservicesText] = useState('');
  const [editServicesText, setEditServicesText] = useState(''); // State for edit form
  const [selectedServiceId, setSelectedServiceId] = useState(null); // Store selected service ID for edit
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editBtnLoading, setEditBtnLoading] = useState(false); // Loading state for edit button

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const ServicesData = useSelector((state) => state.leads.Services);
  const APi_Url = import.meta.env.VITE_API_URL;

  const handleClose = () => {
    setShow(false);
    setservicesText('');
  };
  
  const handleShow = () => setShow(true);
  
  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditServicesText('');
    setSelectedServiceId(null);
  };
  
  // Handle edit modal show
  const handleEditModalShow = (rowData) => {
    setSelectedServiceId(rowData._id);
    setEditServicesText(rowData.servicesText);
    setShowEditModal(true);
  };

  useEffect(() => {
    const tokenId = sessionStorage.getItem('Token');
    if (!tokenId) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await dispatch(fetchServices());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const srNoTemplate = (rowData, { rowIndex }) => <span>{rowIndex + 1}</span>;

  const handleSaveServices = async () => {
    if (!servicesText.trim()) {
      toast.error("Services text can't be empty");
      return;
    }

    try {
      setBtnLoading(true);
      const AdminId = sessionStorage.getItem('AdminId');
      const userType = "Admin";
      const apiUrl = `${APi_Url}/digicoder/crm/api/v1/service/add/${AdminId}`;

      await axios.post(apiUrl, { servicesText, userType });

      toast.success('Services saved successfully');
      setservicesText('');
      setShow(false);
      await dispatch(fetchServices());
    } catch (error) {
      toast.error('Error saving Services');
      console.error("Error details: ", error);
    } finally {
      setBtnLoading(false);
    }
  };

  // New function to handle update
  const handleUpdateServices = async () => {
    if (!editServicesText.trim()) {
      toast.error("Services text can't be empty");
      return;
    }

    if (!selectedServiceId) {
      toast.error("No service selected");
      return;
    }

    try {
      setEditBtnLoading(true);
      const apiUrl = `${APi_Url}/digicoder/crm/api/v1/service/update/${selectedServiceId}`;

      await axios.put(apiUrl, { servicesText: editServicesText });

      toast.success('Services updated successfully');
      handleEditModalClose();
      await dispatch(fetchServices());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating Services');
      console.error("Error details: ", error);
    } finally {
      setEditBtnLoading(false);
    }
  };

  const handleDelete = (rowData) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          const apiUrl = `${APi_Url}/digicoder/crm/api/v1/service/delete/${rowData._id}`;
          await axios.delete(apiUrl);
          toast.success('Data deleted successfully');
          await dispatch(fetchServices());
        } catch (error) {
          console.error("Error deleting data", error);
          toast.error('Error deleting data');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const actionBodyTemplate = (rowData) => (
    <div style={{ display: "flex", gap: "10px" }}>
      <button
        style={{
          color: "green",
          backgroundColor: "transparent",
          border: "none",
          fontSize: "20px",
          cursor: "pointer"
        }}
        onClick={() => handleEditModalShow(rowData)}
      >
        <i className="ri-edit-box-fill"></i>
      </button>
      <button
        style={{
          color: "red",
          backgroundColor: "transparent",
          border: "none",
          fontSize: "20px",
          cursor: "pointer"
        }}
        onClick={() => handleDelete(rowData)}
      >
        <i className="ri-delete-bin-5-fill"></i>
      </button>
    </div>
  );

  return (
    <div>
      <Dashboard active={'Services'}>
        <div className="content-wrapper">
          <div className="content">
            <div className="card">
              <div className="flex justify-content-between p-4">
                <h1>Services</h1>
                <button
                  style={{
                    border: "none",
                    backgroundColor: "#3454D1",
                    color: "white",
                    fontSize: "18px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    padding: "0px 20px"
                  }}
                  onClick={handleShow}
                >
                  Add New
                </button>
              </div>

              {loading ? (
                <div style={{ padding: "20px" }}>
                   <Skeleton variant="rectangular" height={50} style={{ marginBottom: "10px", borderRadius: "8px" }} />
                   <Skeleton variant="rectangular" height={50} style={{ marginBottom: "10px", borderRadius: "8px" }} />
                   <Skeleton variant="rectangular" height={50} style={{ marginBottom: "10px", borderRadius: "8px" }} />
                   <Skeleton variant="rectangular" height={50} style={{ marginBottom: "10px", borderRadius: "8px" }} />
                   <Skeleton variant="rectangular" height={50} style={{ borderRadius: "8px" }} />
                </div>
              ) : (Array.isArray(ServicesData) && ServicesData.length > 0 ? (
                <DataTable value={ServicesData} stripedRows bordered>
                  <Column body={srNoTemplate} header="Sr. No." sortable />
                  <Column field="servicesText" header="Services" sortable />
                  <Column field="usageCount" header="Usage Count" sortable />
                  <Column header="Action" body={actionBodyTemplate} />
                </DataTable>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>No Services data available</div>
              ))}

              {/* Add Modal */}
              <Modal
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Add New Services</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div style={{ display: "flex", justifyContent: "space-around" }}>
                    <input
                      type="text"
                      placeholder="Enter Services"
                      value={servicesText}
                      onChange={(e) => setservicesText(e.target.value)}
                      style={{ outline: "none", padding: "8px", width: "100%" }}
                    />
                    <button
                      onClick={handleSaveServices}
                      disabled={btnLoading}
                      style={{
                        marginLeft: "10px",
                        padding: "10px 26px",
                        border: "none",
                        backgroundColor: "#3454D1",
                        color: "white",
                        fontSize: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: btnLoading ? "not-allowed" : "pointer",
                        opacity: btnLoading ? 0.7 : 1
                      }}
                    >
                      {btnLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </Modal.Body>
              </Modal>

              {/* Edit Modal */}
              <Modal
                show={showEditModal}
                onHide={handleEditModalClose}
                backdrop="static"
                keyboard={false}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Edit Services</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div style={{ display: "flex", justifyContent: "space-around" }}>
                    <input
                      type="text"
                      placeholder="Edit Services"
                      value={editServicesText}
                      onChange={(e) => setEditServicesText(e.target.value)}
                      style={{ outline: "none", padding: "8px", width: "100%" }}
                    />
                    <button
                      onClick={handleUpdateServices}
                      disabled={editBtnLoading}
                      style={{
                        marginLeft: "10px",
                        padding: "10px 26px",
                        border: "none",
                        backgroundColor: "#28a745",
                        color: "white",
                        fontSize: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: editBtnLoading ? "not-allowed" : "pointer",
                        opacity: editBtnLoading ? 0.7 : 1
                      }}
                    >
                      {editBtnLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        "Update"
                      )}
                    </button>
                  </div>
                </Modal.Body>
              </Modal>
            </div>
          </div>
        </div>
      </Dashboard>

      {/* Loader Styles */}
      <style>{`
        .loader-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px 0;
        }

        .custom-loader {
          width: 60px;
          height: 60px;
          border: 6px solid #f3f3f3;
          border-top: 6px solid #3454D1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .spinner-border {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          vertical-align: text-bottom;
          border: 0.15em solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spinner-border .75s linear infinite;
        }

        @keyframes spinner-border {
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default Services;