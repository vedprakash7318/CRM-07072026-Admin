import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Modal from 'react-bootstrap/Modal';
import Dashboard from '../../Components/Dashboard';
import Skeleton from '@mui/material/Skeleton';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { fetchSources } from '../../Features/LeadSlice';
import axios from 'axios';

function Sources() {
  const [show, setShow] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // New state for edit modal
  const [SourcesText, setSourcesText] = useState('');
  const [editSourcesText, setEditSourcesText] = useState(''); // State for edit form
  const [selectedSourceId, setSelectedSourceId] = useState(null); // Store selected source ID for edit
  const [loading, setLoading] = useState(false);     // For full page loader
  const [btnLoading, setBtnLoading] = useState(false); // For Save button loader
  const [editBtnLoading, setEditBtnLoading] = useState(false); // For Edit button loader

  const APi_Url = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sourcesData = useSelector((state) => state.leads.leadSources);

  const handleClose = () => {
    setShow(false);
    setSourcesText('');
  };

  const handleShow = () => setShow(true);
  
  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditSourcesText('');
    setSelectedSourceId(null);
  };
  
  // Handle edit modal show
  const handleEditModalShow = (rowData) => {
    setSelectedSourceId(rowData._id);
    setEditSourcesText(rowData.leadSourcesText);
    setShowEditModal(true);
  };

  useEffect(() => {
    const tokenId = sessionStorage.getItem('Token');
    if (!tokenId) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const loadSources = async () => {
      setLoading(true);
      await dispatch(fetchSources());
      setLoading(false);
    };
    loadSources();
  }, [dispatch]);

  const srNoTemplate = (rowData, { rowIndex }) => <span>{rowIndex + 1}</span>;

  const handleSaveSource = async () => {
    if (SourcesText.trim() === '') {
      toast.error('Source text cannot be empty');
      return;
    }

    try {
      setBtnLoading(true);
      const AdminId = sessionStorage.getItem('AdminId');
      const userType = 'Admin';
      const apiUrl = `${APi_Url}/digicoder/crm/api/v1/leadSources/add/${AdminId}`;
      await axios.post(apiUrl, { SourcesText, userType });
      toast.success('Source added successfully');
      setSourcesText('');
      setShow(false);
      await dispatch(fetchSources());
    } catch (error) {
      toast.error('Error saving source');
    } finally {
      setBtnLoading(false);
    }
  };

  // New function to handle update
  const handleUpdateSource = async () => {
    if (editSourcesText.trim() === '') {
      toast.error('Source text cannot be empty');
      return;
    }

    if (!selectedSourceId) {
      toast.error("No source selected");
      return;
    }

    try {
      setEditBtnLoading(true);
      const AdminId = sessionStorage.getItem('AdminId');
      const apiUrl = `${APi_Url}/digicoder/crm/api/v1/leadSources/update/${AdminId}`;
      
      await axios.put(apiUrl, { 
        SourcesText: editSourcesText,
        leadSourcesId: selectedSourceId
      });

      toast.success('Source updated successfully');
      handleEditModalClose();
      await dispatch(fetchSources());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating source');
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
          const apiUrl = `${APi_Url}/digicoder/crm/api/v1/leadSources/delete/${rowData._id}`;
          await axios.delete(apiUrl);
          toast.success('Source deleted successfully');
          await dispatch(fetchSources());
        } catch (error) {
          toast.error('Error deleting source');
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
      <Dashboard active={'source'}>
        <div className="content-wrapper">
          <div className="content">
            <div className="card">
              <div className="flex justify-content-between p-4">
                <h1>Sources</h1>
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
              ) : (
                Array.isArray(sourcesData) && sourcesData.length > 0 ? (
                  <DataTable value={sourcesData} stripedRows bordered>
                    <Column body={srNoTemplate} header="Sr. No." sortable />
                    <Column field="leadSourcesText" header="Source" sortable />
                    <Column field="usageCount" header="Usage Count" sortable />
                    <Column header="Action" body={actionBodyTemplate} />
                  </DataTable>
                ) : (
                  <div style={{ padding: "1rem" }}>No source data available</div>
                )
              )}

              {/* Add Modal */}
              <Modal
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Add New Source</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div style={{ display: "flex", justifyContent: "space-around" }}>
                    <input
                      type="text"
                      value={SourcesText}
                      onChange={(e) => setSourcesText(e.target.value)}
                      placeholder="Enter Source"
                      style={{ outline: "none", padding: "8px", width: "100%" }}
                    />
                    <button
                      onClick={handleSaveSource}
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
                  <Modal.Title>Edit Source</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div style={{ display: "flex", justifyContent: "space-around" }}>
                    <input
                      type="text"
                      value={editSourcesText}
                      onChange={(e) => setEditSourcesText(e.target.value)}
                      placeholder="Edit Source"
                      style={{ outline: "none", padding: "8px", width: "100%" }}
                    />
                    <button
                      onClick={handleUpdateSource}
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

      {/* Loaders CSS */}
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

export default Sources;