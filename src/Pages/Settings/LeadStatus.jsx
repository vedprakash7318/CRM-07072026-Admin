import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Modal from 'react-bootstrap/Modal';
import Dashboard from '../../Components/Dashboard';
import { fetchLeadStatus } from '../../Features/LeadSlice';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

function LeadStatus() {
  const [show, setShow] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // New state for edit modal
  const [statusText, setStatusText] = useState('');
  const [editStatusText, setEditStatusText] = useState(''); // State for edit form
  const [selectedStatusId, setSelectedStatusId] = useState(null); // Store selected status ID for edit
  const [loading, setLoading] = useState(false);     
  const [btnLoading, setBtnLoading] = useState(false);
  const [editBtnLoading, setEditBtnLoading] = useState(false); // For Edit button loader

  const APi_Url = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const LeadStatusData = useSelector((state) => state.leads.LeadStatus);

  const handleClose = () => {
    setShow(false);
    setStatusText('');
  };
  
  const handleShow = () => setShow(true);
  
  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditStatusText('');
    setSelectedStatusId(null);
  };
  
  // Handle edit modal show
  const handleEditModalShow = (rowData) => {
    setSelectedStatusId(rowData._id);
    setEditStatusText(rowData.leadStatusText);
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
        await dispatch(fetchLeadStatus());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const srNoTemplate = (rowData, { rowIndex }) => <span>{rowIndex + 1}</span>;

  const handleSaveStatus = async () => {
    if (!statusText.trim()) {
      toast.error("Status text can't be empty");
      return;
    }

    try {
      setBtnLoading(true);
      const AdminId = sessionStorage.getItem('AdminId');
      const userType = "Admin";
      const apiUrl = `${APi_Url}/digicoder/crm/api/v1/leadstatus/add/${AdminId}`;

      await axios.post(apiUrl, { statusText, userType });

      toast.success('Lead status saved successfully');
      setStatusText('');
      setShow(false);
      await dispatch(fetchLeadStatus());
    } catch (error) {
      toast.error('Error saving lead status');
      console.error("Error details: ", error);
    } finally {
      setBtnLoading(false);
    }
  };

  // New function to handle update
  const handleUpdateStatus = async () => {
    if (!editStatusText.trim()) {
      toast.error("Status text can't be empty");
      return;
    }

    if (!selectedStatusId) {
      toast.error("No status selected");
      return;
    }

    try {
      setEditBtnLoading(true);
      const AdminId = sessionStorage.getItem('AdminId');
      const apiUrl = `${APi_Url}/digicoder/crm/api/v1/leadstatus/update/${AdminId}`;
      
      await axios.put(apiUrl, { 
        statusText: editStatusText,
        leadStatusId: selectedStatusId
      });

      toast.success('Lead status updated successfully');
      handleEditModalClose();
      await dispatch(fetchLeadStatus());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating lead status');
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
          const apiUrl = `${APi_Url}/digicoder/crm/api/v1/leadstatus/delete/${rowData._id}`;
          await axios.delete(apiUrl);
          toast.success('Lead status deleted successfully');
          await dispatch(fetchLeadStatus());
        } catch (error) {
          console.error(error);
          toast.error('Error deleting lead status');
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
      <Dashboard active={'status'}>
        <div className="content-wrapper">
          <div className="content">
            <div className="card">
              <div className="flex justify-content-between p-4">
                <h1>Lead Status</h1>
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
                <div className="loader-wrapper">
                  <div className="custom-loader"></div>
                </div>
              ) : Array.isArray(LeadStatusData) && LeadStatusData.length > 0 ? (
                <DataTable value={LeadStatusData} stripedRows bordered>
                  <Column body={srNoTemplate} header="Sr. No." sortable />
                  <Column field="leadStatusText" header="Status" sortable />
                  <Column header="Action" body={actionBodyTemplate} />
                </DataTable>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>No lead status data available</div>
              )}

              {/* Modal for Add New Lead Status */}
              <Modal
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Add New Lead Status</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div style={{ display: "flex", justifyContent: "space-around" }}>
                    <input
                      type="text"
                      placeholder="Enter status"
                      value={statusText}
                      onChange={(e) => setStatusText(e.target.value)}
                      style={{ outline: "none", padding: "8px", width: "100%" }}
                    />
                    <button
                      onClick={handleSaveStatus}
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

              {/* Modal for Edit Lead Status */}
              <Modal
                show={showEditModal}
                onHide={handleEditModalClose}
                backdrop="static"
                keyboard={false}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Edit Lead Status</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div style={{ display: "flex", justifyContent: "space-around" }}>
                    <input
                      type="text"
                      placeholder="Edit status"
                      value={editStatusText}
                      onChange={(e) => setEditStatusText(e.target.value)}
                      style={{ outline: "none", padding: "8px", width: "100%" }}
                    />
                    <button
                      onClick={handleUpdateStatus}
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

export default LeadStatus;