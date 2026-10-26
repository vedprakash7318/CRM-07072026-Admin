import React, { useEffect, useState, useRef } from 'react';
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
import Skeleton from '@mui/material/Skeleton';
import * as XLSX from 'xlsx';

function Tag() {
  const APi_Url = import.meta.env.VITE_API_URL;

  const [newTag, setNewTag] = useState('');
  const [show, setShow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentFilter, setSelectedParentFilter] = useState('');
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

  const isFirstRender = useRef(true);
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

  // 📥 Fetch tags with pagination, search, and parent filter
  const loadTags = async (
    page = currentPage,
    limit = rowsPerPage,
    search = searchQuery,
    parentId = selectedParentFilter
  ) => {
    try {
      setLoading(true);
      const AdminId = sessionStorage.getItem('AdminId');
      
      const params = {
        page: page,
        limit: limit,
        search: search
      };

      if (parentId) {
        params.parentId = parentId;
      }

      const response = await axios.get(
        `${APi_Url}/digicoder/crm/api/v1/tags/get-tag-serverside/${AdminId}`,
        { params }
      );

      if (response.data.success) {
        setTags(response.data.tags || []);
        setTotalRecords(response.data.pagination?.total || 0);
        setCurrentPage(response.data.pagination?.page || page);
        setRowsPerPage(response.data.pagination?.limit || limit);
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
    loadTags(1, rowsPerPage, '', '');
  }, []);

  // Handle page change
  const onPageChange = (event) => {
    const newPage = event.page + 1; // PrimeReact Paginator uses 0-based index
    const newRows = event.rows;
    
    setCurrentPage(newPage);
    setRowsPerPage(newRows);
    loadTags(newPage, newRows, searchQuery, selectedParentFilter);
  };

  // Handle search with debounce
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const debounceTimer = setTimeout(() => {
      setCurrentPage(1);
      loadTags(1, rowsPerPage, searchQuery, selectedParentFilter);
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Handle Tag Parent filter change
  const handleParentFilterChange = (e) => {
    const parentId = e.target.value;
    setSelectedParentFilter(parentId);
    setCurrentPage(1);
    loadTags(1, rowsPerPage, searchQuery, parentId);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedParentFilter('');
    setCurrentPage(1);
    loadTags(1, rowsPerPage, '', '');
  };

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
          loadTags(currentPage, rowsPerPage, searchQuery, selectedParentFilter);
          fetchTagParents();
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
          loadTags(currentPage, rowsPerPage, searchQuery, selectedParentFilter);
          fetchTagParents();
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
          loadTags(currentPage, rowsPerPage, searchQuery, selectedParentFilter);
          fetchTagParents();

        } catch (error) {
          toast.error(error.response?.data?.message || 'Delete failed');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Export functions
  const handleExportExcel = async () => {
    try {
      setBtnLoading(true);
      const AdminId = sessionStorage.getItem('AdminId');
      
      const params = {
        page: 1,
        limit: totalRecords > 0 ? totalRecords : 1000,
        search: searchQuery
      };

      if (selectedParentFilter) {
        params.parentId = selectedParentFilter;
      }

      const response = await axios.get(
        `${APi_Url}/digicoder/crm/api/v1/tags/get-tag-serverside/${AdminId}`,
        { params }
      );
      
      if (response.data.success) {
        const dataToExport = response.data.tags.map((tag, index) => ({
          "Sr No.": index + 1,
          "Tag Name": tag.tagName,
          "Usage Count": tag.leadCount || 0,
          "Tag Parent": tag.parentId?.tagParentName || "-"
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tags");
        XLSX.writeFile(workbook, "Tags.xlsx");
        toast.success("Excel Exported Successfully");
      }
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel");
    } finally {
      setBtnLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setBtnLoading(true);
      const AdminId = sessionStorage.getItem('AdminId');
      
      const params = {
        page: 1,
        limit: totalRecords > 0 ? totalRecords : 1000,
        search: searchQuery
      };

      if (selectedParentFilter) {
        params.parentId = selectedParentFilter;
      }

      const response = await axios.get(
        `${APi_Url}/digicoder/crm/api/v1/tags/get-tag-serverside/${AdminId}`,
        { params }
      );
      
      if (response.data.success) {
        const dataToExport = response.data.tags.map((tag, index) => ({
          "Sr No.": index + 1,
          "Tag Name": tag.tagName,
          "Usage Count": tag.leadCount || 0,
          "Tag Parent": tag.parentId?.tagParentName || "-"
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "Tags.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Exported Successfully");
      }
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Failed to export CSV");
    } finally {
      setBtnLoading(false);
    }
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
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={handleExportExcel}
                    disabled={btnLoading}
                    style={{
                      border: "none",
                      backgroundColor: "#28a745",
                      color: "white",
                      fontSize: "16px",
                      borderRadius: "10px",
                      padding: "10px 20px",
                      cursor: btnLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <i className="ri-file-excel-2-line" style={{ marginRight: "5px" }}></i> Excel
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={btnLoading}
                    style={{
                      border: "none",
                      backgroundColor: "#17a2b8",
                      color: "white",
                      fontSize: "16px",
                      borderRadius: "10px",
                      padding: "10px 20px",
                      cursor: btnLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <i className="ri-file-list-3-line" style={{ marginRight: "5px" }}></i> CSV
                  </button>
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
                      fontSize: "16px",
                      borderRadius: "10px",
                      padding: "10px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    Add New
                  </button>
                </div>
              </div>

              {/* Search & Tag Parent Filter Section */}
              <div className="p-4 border-bottom" style={{ backgroundColor: "#f8fafc" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "15px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "15px", flex: 1 }}>
                    
                    {/* Search Input */}
                    <div style={{ position: "relative", minWidth: "260px", maxWidth: "360px", flex: "1 1 260px" }}>
                      <i 
                        className="ri-search-line" 
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                          fontSize: "16px"
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search tags by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "9px 12px 9px 36px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "14px",
                          outline: "none",
                          backgroundColor: "#ffffff"
                        }}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#94a3b8",
                            fontSize: "16px"
                          }}
                          title="Clear search"
                        >
                          <i className="ri-close-circle-fill"></i>
                        </button>
                      )}
                    </div>

                    {/* Tag Parent Filter Dropdown */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "220px", flex: "0 1 auto" }}>
                      <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569", margin: 0, display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                        <i className="ri-filter-3-line" style={{ color: "#3454D1" }}></i> Tag Parent:
                      </label>
                      <select
                        value={selectedParentFilter}
                        onChange={handleParentFilterChange}
                        style={{
                          padding: "9px 12px",
                          borderRadius: "6px",
                          border: selectedParentFilter ? "1px solid #3454D1" : "1px solid #cbd5e1",
                          fontSize: "14px",
                          backgroundColor: "#ffffff",
                          cursor: "pointer",
                          outline: "none",
                          fontWeight: selectedParentFilter ? "600" : "normal",
                          color: selectedParentFilter ? "#3454D1" : "#334155"
                        }}
                      >
                        <option value="">All Tag Parents</option>
                        {tagParents.map((parent) => (
                          <option key={parent._id} value={parent._id}>
                            {parent.tagParentName}
                          </option>
                        ))}
                        <option value="unassigned">Unassigned (No Parent)</option>
                      </select>
                    </div>

                    {/* Reset Filters Button */}
                    {(searchQuery || selectedParentFilter) && (
                      <button
                        onClick={handleClearFilters}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "8px 14px",
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "13px",
                          color: "#64748b",
                          cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                        }}
                        title="Reset all filters"
                      >
                        <i className="ri-refresh-line"></i> Reset Filters
                      </button>
                    )}
                  </div>

                  {/* Results Count & Filter Pills */}
                  <div style={{ fontSize: "14px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>
                      Total: <strong style={{ color: "#0f172a" }}>{totalRecords}</strong> tags
                    </span>
                    {selectedParentFilter && (
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 10px",
                        backgroundColor: "#EEF2FF",
                        color: "#3730A3",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        border: "1px solid #C7D2FE"
                      }}>
                        Parent: {tagParents.find(p => p._id === selectedParentFilter)?.tagParentName || (selectedParentFilter === "unassigned" ? "Unassigned" : "Selected")}
                        <i
                          className="ri-close-line"
                          style={{ cursor: "pointer", marginLeft: "2px" }}
                          onClick={() => {
                            setSelectedParentFilter('');
                            setCurrentPage(1);
                            loadTags(1, rowsPerPage, searchQuery, '');
                          }}
                          title="Remove parent filter"
                        />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ padding: "20px" }}>
                   <Skeleton variant="rectangular" height={50} style={{ marginBottom: "10px", borderRadius: "8px" }} />
                   <Skeleton variant="rectangular" height={50} style={{ marginBottom: "10px", borderRadius: "8px" }} />
                   <Skeleton variant="rectangular" height={50} style={{ marginBottom: "10px", borderRadius: "8px" }} />
                   <Skeleton variant="rectangular" height={50} style={{ marginBottom: "10px", borderRadius: "8px" }} />
                   <Skeleton variant="rectangular" height={50} style={{ borderRadius: "8px" }} />
                </div>
              ) : (
                <>
                  <DataTable value={tags} stripedRows bordered>
                    <Column header="Sr." body={serialNumberTemplate} />
                    <Column field="tagName" header="Tag Name" sortable />
                    <Column field="leadCount" header="Usage Count" sortable />
                    <Column 
                      field="parentId.tagParentName" 
                      header="Tag Parent" 
                      sortable 
                      body={(rowData) => {
                        const parentName = rowData.parentId?.tagParentName;
                        return parentName ? (
                          <span style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            backgroundColor: "#EFF6FF",
                            color: "#1D4ED8",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "500"
                          }}>
                            {parentName}
                          </span>
                        ) : (
                          <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>-</span>
                        );
                      }}
                    />
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
                      {searchQuery || selectedParentFilter ? 'No tags found matching your filter criteria' : 'No tags available'}
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