import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Modal from 'react-bootstrap/Modal';
import Dashboard from '../../Components/Dashboard';
import Swal from 'sweetalert2';
import axios from 'axios';

function TagParent() {
  const APi_Url = import.meta.env.VITE_API_URL;

  const [tagParents, setTagParents] = useState([]);
  const [newTagParent, setNewTagParent] = useState('');
  const [show, setShow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const [editId, setEditId] = useState(null); // 🔥 edit state

  // ================= FETCH =================
  const fetchTagParents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${APi_Url}/digicoder/crm/api/v1/tag-parent/all`);
      setTagParents(res.data.data || []);
    } catch {
      toast.error("Error fetching tag parents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTagParents();
  }, []);

  // ================= SAVE / UPDATE =================
  const handleSave = async () => {
    if (!newTagParent.trim()) {
      toast.error("Name required");
      return;
    }

    try {
      setBtnLoading(true);

      const addedBy = sessionStorage.getItem("AdminId");
      const addedByType = "Admin";

      if (editId) {
        // 🔥 UPDATE
        await axios.put(
          `${APi_Url}/digicoder/crm/api/v1/tag-parent/update/${editId}`,
          { tagParentName: newTagParent }
        );
        toast.success("Updated successfully");
      } else {
        // 🔥 CREATE
        await axios.post(
          `${APi_Url}/digicoder/crm/api/v1/tag-parent/create`,
          { tagParentName: newTagParent, addedBy, addedByType }
        );
        toast.success("Created successfully");
      }

      setShow(false);
      setNewTagParent('');
      setEditId(null);
      fetchTagParents();

    } catch {
      toast.error("Operation failed");
    } finally {
      setBtnLoading(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = (row) => {
    Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await axios.delete(`${APi_Url}/digicoder/crm/api/v1/tag-parent/delete/${row._id}`);
          toast.success("Deleted");
          fetchTagParents();
        } catch {
          toast.error("Delete failed");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // ================= EDIT =================
  const handleEdit = (row) => {
    setNewTagParent(row.tagParentName);
    setEditId(row._id);
    setShow(true);
  };

  // ================= SEARCH =================
  const filtered = tagParents.filter(item =>
    item.tagParentName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const serial = (row, props) => props.rowIndex + 1;

  const actionTemplate = (row) => (
    <div style={{ display: "flex", gap: "10px" }}>
      
      {/* EDIT */}
      <button
        style={{
          color: "green",
          border: "none",
          background: "transparent",
          cursor: "pointer"
        }}
        onClick={() => handleEdit(row)}
      >
        <i className="ri-edit-2-fill"></i>
      </button>

      {/* DELETE */}
      <button
        style={{
          color: "red",
          border: "none",
          background: "transparent",
          cursor: "pointer"
        }}
        onClick={() => handleDelete(row)}
      >
        <i className="ri-delete-bin-5-fill"></i>
      </button>

    </div>
  );

  return (
    <Dashboard active={'tagParent'}>
      <div className="content-wrapper">
        <div className="card">

          <div className="flex justify-content-between p-4">
            <h2>Tag Parent</h2>
            <button
              onClick={() => {
                setShow(true);
                setEditId(null);
                setNewTagParent('');
              }}
              style={{
                background: "#3454D1",
                color: "#fff",
                border: "none",
                padding: "8px 20px",
                borderRadius: "8px"
              }}
            >
              Add New
            </button>
          </div>

          <div className="p-4">
            <input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "8px", width: "50%", border: "1px solid #ccc" }}
            />
          </div>

          {loading ? (
            <div className="loader-wrapper">
              <div className="custom-loader"></div>
            </div>
          ) : (
            <DataTable value={filtered} stripedRows>
              <Column header="Sr." body={serial} />
              <Column field="tagParentName" header="Name" />
              <Column header="Action" body={actionTemplate} />
            </DataTable>
          )}

          {/* MODAL */}
          <Modal show={show} onHide={() => setShow(false)}>
            <Modal.Header closeButton>
              <Modal.Title>
                {editId ? "Edit Tag Parent" : "Add Tag Parent"}
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <div style={{ display: "flex" }}>
                <input
                  value={newTagParent}
                  onChange={(e) => setNewTagParent(e.target.value)}
                  placeholder="Enter name"
                  style={{ flex: 1, padding: "8px" }}
                />

                <button
                  onClick={handleSave}
                  disabled={btnLoading}
                  style={{
                    marginLeft: "10px",
                    padding: "8px 20px",
                    background: "#3454D1",
                    color: "#fff",
                    border: "none"
                  }}
                >
                  {btnLoading ? "..." : editId ? "Update" : "Save"}
                </button>
              </div>
            </Modal.Body>
          </Modal>

        </div>
      </div>

      <ToastContainer />

      <style>{`
        .loader-wrapper {
          display:flex;
          justify-content:center;
          padding:40px;
        }
        .custom-loader {
          width:50px;
          height:50px;
          border:5px solid #eee;
          border-top:5px solid #3454D1;
          border-radius:50%;
          animation:spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform:rotate(360deg); }
        }
      `}</style>
    </Dashboard>
  );
}

export default TagParent;