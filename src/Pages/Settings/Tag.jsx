import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import Modal from 'react-bootstrap/Modal';
import Dashboard from '../../Components/Dashboard';
import Swal from 'sweetalert2';
import axios from 'axios';

function Tag() {
  const APi_Url = import.meta.env.VITE_API_URL;

  const [newTag, setNewTag] = useState('');
  const [show, setShow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [tagParents, setTagParents] = useState([]);
  const [selectedTagParent, setSelectedTagParent] = useState("");
  const [editingTag, setEditingTag] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [tags, setTags] = useState([]);

  const navigate = useNavigate();

  // 🔐 Auth check
  useEffect(() => {
    const tokenId = sessionStorage.getItem('Token');
    if (!tokenId) navigate('/');
  }, [navigate]);

  // 📥 Fetch tag parents
  const fetchTagParents = async () => {
    try {
      const res = await axios.get(`${APi_Url}/digicoder/crm/api/v1/tag-parent/all`);
      if (res.data.success) {
        setTagParents(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching tag parents:", error);
      toast.error("Failed to load tag parents");
    }
  };

  useEffect(() => {
    fetchTagParents();
  }, []);

  // 📥 Fetch tags with pagination and search
  const loadTags = async (page = currentPage, limit = rowsPerPage, search = searchQuery) => {
    try {
      setLoading(true);
      const AdminId = sessionStorage.getItem('AdminId');
      
      const response = await axios.get(
        `${APi_Url}/digicoder/crm/api/v1/tags/get-tag-serverside/${AdminId}`,
        {
          params: {
            page: page,
            limit: limit,
            search: search
          }
        }
      );

      
      if (response.data.success) {
        setTags(response.data.tags);
        setTotalRecords(response.data.pagination.total);
        setCurrentPage(response.data.pagination.page);
        setRowsPerPage(response.data.pagination.limit);
      }
    } catch (error) {
      console.error("Error loading tags:", error);
      toast.error("Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTags(1, rowsPerPage, '');
  }, []);

  // Handle page change
  const onPageChange = (event) => {
    const newPage = event.page + 1; // PrimeReact Paginator uses 0-based index
    const newRows = event.rows;
    
    setCurrentPage(newPage);
    setRowsPerPage(newRows);
    loadTags(newPage, newRows, searchQuery);
  };

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (currentPage === 1) {
        loadTags(1, rowsPerPage, searchQuery);
      } else {
        setCurrentPage(1);
        loadTags(1, rowsPerPage, searchQuery);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // ❌ Close modal
  const handleClose = () => {
    setShow(false);
    setNewTag('');
    setSelectedTagParent('');
    setEditingTag(null);
    setIsEditMode(false);
  };

  const handleShow = () => setShow(true);

  // ✏️ Handle Edit - Open modal with selected tag data
  const handleEdit = (rowData) => {
    setEditingTag(rowData);
    setNewTag(rowData.tagName);
    setSelectedTagParent(rowData.parentId?._id || rowData.parentId || "");
    setIsEditMode(true);
    setShow(true);
  };

  // ✅ Save Tag (Create or Update)
  const handleSaveTag = async () => {
    if (!newTag.trim() || !selectedTagParent) {
      toast.error("All fields are required");
      return;
    }

    try {
      setBtnLoading(true);

      const AdminId = sessionStorage.getItem('AdminId');
      const userType = "Admin";

      if (isEditMode && editingTag) {
        // 🔄 UPDATE EXISTING TAG
        const res = await axios.put(
          `${APi_Url}/digicoder/crm/api/v1/tags/update/${editingTag._id}`,
          {
            tagName: newTag.trim(),
            parentId: selectedTagParent
          }
        );

        if (res.data.success) {
          toast.success("Tag updated successfully");
          handleClose();
          // Refresh current page
          loadTags(currentPage, rowsPerPage, searchQuery);
        } else {
          toast.error(res.data.message || "Error updating tag");
        }
      } else {
        // ➕ CREATE NEW TAG
        const res = await axios.post(
          `${APi_Url}/digicoder/crm/api/v1/tags/add/${AdminId}`,
          {
            tagName: newTag.trim(),
            parentId: selectedTagParent,
            userType
          }
        );

        if (res.data.success) {
          toast.success("Tag added successfully");
          handleClose();
          // Refresh current page
          loadTags(currentPage, rowsPerPage, searchQuery);
        } else {
          toast.error(res.data.message || "Error adding tag");
        }
      }

    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving tag");
      console.log(error);
    } finally {
      setBtnLoading(false);
    }
  };

  // 🗑 Delete Tag
  const handleDelete = (rowData) => {
    if (!rowData._id) {
      toast.error('Invalid tag data');
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);

          await axios.delete(
            `${APi_Url}/digicoder/crm/api/v1/tags/delete/${rowData._id}`
          );

          toast.success('Tag deleted successfully');
          
          // Refresh current page
          loadTags(currentPage, rowsPerPage, searchQuery);

        } catch (error) {
          toast.error(error.response?.data?.message || 'Delete failed');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 🔢 Serial number (updated to work with pagination)
  const serialNumberTemplate = (rowData, props) => {
    return (currentPage - 1) * rowsPerPage + props.rowIndex + 1;
  };

  // ⚙️ Action column with Edit and Delete buttons
  const actionBodyTemplate = (rowData) => (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        style={{
          color: "#3454D1",
          background: "transparent",
          border: "none",
          fontSize: "20px",
          cursor: "pointer"
        }}
        onClick={() => handleEdit(rowData)}
        title="Edit Tag"
      >
        <i className="ri-edit-2-fill"></i>
      </button>
      <button
        style={{
          color: "red",
          background: "transparent",
          border: "none",
          fontSize: "20px",
          cursor: "pointer"
        }}
        onClick={() => handleDelete(rowData)}
        title="Delete Tag"
      >
        <i className="ri-delete-bin-5-fill"></i>
      </button>
    </div>
  );

  return (
    <div>
      <Dashboard active={'tag'}>
        <div className="content-wrapper">
          <div className="content">
            <div className="card">

              {/* Header */}
              <div className="flex justify-content-between p-4">
                <h1>Tags</h1>
                <button
                  onClick={() => {
                    handleShow();
                    setIsEditMode(false);
                    setNewTag('');
                    setSelectedTagParent('');
                    setEditingTag(null);
                  }}
                  style={{
                    border: "none",
                    backgroundColor: "#3454D1",
                    color: "white",
                    fontSize: "18px",
                    borderRadius: "10px",
                    padding: "0 20px",
                    cursor: "pointer"
                  }}
                >
                  Add New
                </button>
              </div>

              {/* Search */}
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search tags by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: "8px",
                    width: "50%",
                    border: "1px solid #ccc",
                    borderRadius: "4px"
                  }}
                />
                {searchQuery && (
                  <span style={{ marginLeft: "10px", fontSize: "14px", color: "#666" }}>
                    Found {totalRecords} result(s)
                  </span>
                )}
              </div>

              {/* Table */}
              {loading ? (
                <div className="loader-wrapper">
                  <div className="custom-loader"></div>
                </div>
              ) : (
                <>
                  <DataTable value={tags} stripedRows bordered>
                    <Column header="Sr." body={serialNumberTemplate} />
                    <Column field="tagName" header="Tag Name" sortable />
                    <Column field="parentId.tagParentName" header="Tag Parent" sortable />
                    <Column header="Action" body={actionBodyTemplate} />
                  </DataTable>
                  
                  {/* Paginator */}
                  {totalRecords > 0 && (
                    <div className="p-4">
                      <Paginator
                        first={(currentPage - 1) * rowsPerPage}
                        rows={rowsPerPage}
                        totalRecords={totalRecords}
                        onPageChange={onPageChange}
                        // rowsPerPageOptions={[5, 10, 25, 50]}
                      />
                      <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
                        Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalRecords)} of {totalRecords} entries
                      </div>
                    </div>
                  )}
                  
                  {/* No data message */}
                  {!loading && tags.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                      {searchQuery ? 'No tags found matching your search' : 'No tags available'}
                    </div>
                  )}
                </>
              )}

              {/* Modal - Add/Edit */}
              <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                  <Modal.Title>{isEditMode ? "Edit Tag" : "Add New Tag"}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>

                    {/* Parent Dropdown */}
                    <select
                      value={selectedTagParent}
                      onChange={(e) => setSelectedTagParent(e.target.value)}
                      style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="">Select Tag Parent</option>
                      {tagParents.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.tagParentName}
                        </option>
                      ))}
                    </select>

                    {/* Input + Button */}
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        type="text"
                        placeholder="Enter tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                      />

                      <button
                        onClick={handleSaveTag}
                        disabled={btnLoading}
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#3454D1",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: btnLoading ? "not-allowed" : "pointer",
                          opacity: btnLoading ? 0.7 : 1
                        }}
                      >
                        {btnLoading ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update" : "Save")}
                      </button>
                    </div>

                  </div>
                </Modal.Body>
              </Modal>

            </div>
          </div>
        </div>
      </Dashboard>

      <ToastContainer />

      {/* Loader CSS */}
      <style>{`
        .loader-wrapper {
          display: flex;
          justify-content: center;
          padding: 40px;
        }
        .custom-loader {
          width: 50px;
          height: 50px;
          border: 5px solid #eee;
          border-top: 5px solid #3454D1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Tag;