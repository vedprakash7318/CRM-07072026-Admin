import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Modal from 'react-bootstrap/Modal';
import Dashboard from '../../Components/Dashboard';
import { fetchPriority } from '../../Features/LeadSlice';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

function Priority() {
  const [show, setShow] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // New state for edit modal
  const [priorityText, setPriorityText] = useState('');
  const [editPriorityText, setEditPriorityText] = useState(''); // State for edit form
  const [selectedPriorityId, setSelectedPriorityId] = useState(null); // Store selected priority ID for edit
  const [loading, setLoading] = useState(false);      // For table/page loading
  const [btnLoading, setBtnLoading] = useState(false); // For Save button loading
  const [editBtnLoading, setEditBtnLoading] = useState(false); // For Edit button loading

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const priorityData = useSelector((state) => state.leads.Priority);
  const APi_Url = import.meta.env.VITE_API_URL;

  const handleClose = () => {
    setShow(false);
    setPriorityText('');
  };
  
  const handleShow = () => setShow(true);
  
  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditPriorityText('');
    setSelectedPriorityId(null);
  };
  
  // Handle edit modal show
  const handleEditModalShow = (rowData) => {
    setSelectedPriorityId(rowData._id);
    setEditPriorityText(rowData.priorityText);
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
        await dispatch(fetchPriority());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const srNoTemplate = (rowData, { rowIndex }) => <span>{rowIndex + 1}</span>;

  const handleSavePriority = async () => {
    if (!priorityText.trim()) {
      toast.error("Priority text can't be empty");
      return;
    }

    try {
      setBtnLoading(true);
      const AdminId = sessionStorage.getItem('AdminId');
      const userType = "Admin";
      const apiUrl = `${APi_Url}/digicoder/crm/api/v1/priority/add/${AdminId}`;

      await axios.post(apiUrl, { priorityText, userType });

      toast.success('Priority saved successfully');
      setPriorityText('');
      setShow(false);
      await dispatch(fetchPriority());
    } catch (error) {
      toast.error('Error saving priority');
      console.error("Error details: ", error);
    } finally {
      setBtnLoading(false);
    }
  };

  // New function to handle update
  const handleUpdatePriority = async () => {
    if (!editPriorityText.trim()) {
      toast.error("Priority text can't be empty");
      return;
    }

    if (!selectedPriorityId) {
      toast.error("No priority selected");
      return;
    }

    try {
      setEditBtnLoading(true);
      const apiUrl = `${APi_Url}/digicoder/crm/api/v1/priority/update/${selectedPriorityId}`;

      await axios.put(apiUrl, { priorityText: editPriorityText });

      toast.success('Priority updated successfully');
      handleEditModalClose();
      await dispatch(fetchPriority());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating priority');
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
          const apiUrl = `${APi_Url}/digicoder/crm/api/v1/priority/delete/${rowData._id}`;
          await axios.delete(apiUrl);
          toast.success('Data deleted successfully');
          await dispatch(fetchPriority());
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
      <Dashboard active={'priority'}>
        <div className="content-wrapper">
          <div className="content">
            <div className="card">
              <div className="flex justify-content-between p-4">
                <h1>Priority</h1>
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
              ) : Array.isArray(priorityData) && priorityData.length > 0 ? (
                <DataTable value={priorityData} stripedRows bordered>
                  <Column body={srNoTemplate} header="Sr. No." sortable />
                  <Column field="priorityText" header="Priority" sortable />
                  <Column header="Action" body={actionBodyTemplate} />
                </DataTable>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>No priority data available</div>
              )}

              {/* Add Modal */}
              <Modal
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Add New Priority</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div style={{ display: "flex", justifyContent: "space-around" }}>
                    <input
                      type="text"
                      placeholder="Enter priority"
                      value={priorityText}
                      onChange={(e) => setPriorityText(e.target.value)}
                      style={{ outline: "none", padding: "8px", width: "100%" }}
                    />
                    <button
                      onClick={handleSavePriority}
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
                  <Modal.Title>Edit Priority</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div style={{ display: "flex", justifyContent: "space-around" }}>
                    <input
                      type="text"
                      placeholder="Edit priority"
                      value={editPriorityText}
                      onChange={(e) => setEditPriorityText(e.target.value)}
                      style={{ outline: "none", padding: "8px", width: "100%" }}
                    />
                    <button
                      onClick={handleUpdatePriority}
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

export default Priority;