import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import Dashboard from "../Components/Dashboard";

const AdminAllRequests = () => {
  const API = import.meta.env.VITE_API_URL;
  const adminId = sessionStorage.getItem("AdminId");

  const [requests, setRequests] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  // Pagination
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 1
  });

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // Modals
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Toast reference
  const toast = useRef(null);

  // 🔥 LOAD DATA (SERVER SIDE)
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API}/digicoders/crm/api/v1/request/admin/all-requests/${adminId}`,
        {
          params: {
            page: lazyParams.page,
            limit: lazyParams.rows,
            search,
            status
          }
        }
      );

      setRequests(res.data.data || []);
      setTotalRecords(res.data.total || 0);

    } catch (err) {
      console.log(err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load requests',
        life: 3000
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [lazyParams, search, status]);

  // 🔄 Pagination Change
  const onPage = (event) => {
    setLazyParams({
      ...lazyParams,
      first: event.first,
      rows: event.rows,
      page: event.page + 1
    });
  };

  // ✅ Accept
  const handleAccept = async (id) => {
    setActionLoading(true);
    try {
      await axios.post(
        `${API}/digicoders/crm/api/v1/request/tag-request/accept`,
        { requestId: id }
      );
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Request accepted successfully',
        life: 3000
      });
      await loadData();
    } catch (err) {
      console.log(err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err.response?.data?.message || 'Failed to accept request',
        life: 3000
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Reject
  const openReject = (id) => {
    setSelectedRequestId(id);
    setShowRejectModal(true);
  };

  const submitReject = async () => {
    if (!rejectionReason.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please enter rejection reason',
        life: 3000
      });
      return;
    }

    setRejectLoading(true);
    try {
      await axios.post(
        `${API}/digicoders/crm/api/v1/request/tag-request/reject`,
        {
          requestId: selectedRequestId,
          rejectionReason
        }
      );

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Request rejected successfully',
        life: 3000
      });

      setShowRejectModal(false);
      setRejectionReason("");
      await loadData();
    } catch (err) {
      console.log(err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err.response?.data?.message || 'Failed to reject request',
        life: 3000
      });
    } finally {
      setRejectLoading(false);
    }
  };

  // 👁 View Leads
  const handleView = async (row) => {
    setLeadsLoading(true);
    setShowLeadsModal(true);
    try {
      setSelectedLeads(row.leads || []);
    } catch (err) {
      console.log(err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load leads',
        life: 3000
      });
    } finally {
      setLeadsLoading(false);
    }
  };

  // 🎨 UI Helpers
  const statusBody = (row) => {
    const severity =
      row.status === "accepted"
        ? "success"
        : row.status === "rejected"
        ? "danger"
        : "warning";

    return <Tag value={row.status} severity={severity} />;
  };

  const tagsBody = (row) => (
    <div className="flex flex-wrap gap-1">
      {row.tags.map((t) => (
        <Tag key={t._id} value={t.tagName} />
      ))}
    </div>
  );

  const leadsCountBody = (row) => {
    const count = row.leads?.length || 0;
    return (
      <span className="font-semibold">
        {count} {count === 1 ? "Lead" : "Leads"}
      </span>
    );
  };

  const assignmentStatusBody = (row) => {
    if (!row.leads || row.leads.length === 0) return <Tag value="No Leads" severity="info" />;
    const assignedNames = new Set();
    row.leads.forEach(lead => {
      if (lead.leadAssignedTo && lead.leadAssignedTo.length > 0) {
        lead.leadAssignedTo.forEach(emp => {
          assignedNames.add(emp.empName);
        });
      }
    });

    if (assignedNames.size === 0) {
      return <Tag value="Unassigned" severity="success" />;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {Array.from(assignedNames).map((name, i) => (
          <Tag key={i} value={`Assigned: ${name}`} severity="warning" />
        ))}
      </div>
    );
  };

  const actionBody = (row) => (
    <div className="flex gap-2">
      <Button 
        icon="pi pi-eye" 
        onClick={() => handleView(row)}
        disabled={actionLoading}
      />

      {row.status === "pending" && (
        <>
          <Button
            icon="pi pi-check"
            className="p-button-success"
            onClick={() => handleAccept(row._id)}
            loading={actionLoading}
            disabled={actionLoading}
          />
          <Button
            icon="pi pi-times"
            className="p-button-danger"
            onClick={() => openReject(row._id)}
            disabled={actionLoading}
          />
        </>
      )}
    </div>
  );

  return (
    <Dashboard>
      <Toast ref={toast} />
      <div className="p-4">
        <h2 className="text-2xl mb-4">All Tag Requests</h2>

        {/* 🔍 FILTERS */}
        <div className="flex gap-3 mb-3">
          <InputText
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />

          <Dropdown
            value={status}
            options={[
              { label: "All", value: "" },
              { label: "Pending", value: "pending" },
              { label: "Accepted", value: "accepted" },
              { label: "Rejected", value: "rejected" }
            ]}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="Select Status"
            disabled={loading}
          />
        </div>

        {/* 📊 TABLE */}
        <DataTable
          value={requests}
          lazy
          paginator
          first={lazyParams.first}
          rows={lazyParams.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          loadingIcon={<ProgressSpinner />}
        >
          <Column field="employee.empName" header="Employee" />
          <Column header="Tags" body={tagsBody} />
          <Column header="Number of Leads" body={leadsCountBody} />
          <Column header="Current Assignment" body={assignmentStatusBody} />
          <Column header="Status" body={statusBody} />
          <Column header="Actions" body={actionBody} />
        </DataTable>
      </div>

      {/* 👁 VIEW LEADS */}
      <Dialog
        header="Leads"
        visible={showLeadsModal}
        style={{ width: "600px" }}
        onHide={() => {
          setShowLeadsModal(false);
          setSelectedLeads([]);
        }}
      >
        {leadsLoading ? (
          <div className="flex justify-center align-items-center p-4">
            <ProgressSpinner />
          </div>
        ) : (
          <DataTable value={selectedLeads}>
            <Column field="name" header="Name" />
            <Column field="phone" header="Phone" />
          </DataTable>
        )}
      </Dialog>

      {/* ❌ REJECT */}
      <Dialog
        header="Reject Request"
        visible={showRejectModal}
        style={{ width: "400px" }}
        onHide={() => {
          if (!rejectLoading) {
            setShowRejectModal(false);
            setRejectionReason("");
          }
        }}
        closable={!rejectLoading}
      >
        <textarea
          className="p-inputtext w-full"
          rows={4}
          placeholder="Enter reason"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          disabled={rejectLoading}
        />

        <div className="flex justify-end mt-3 gap-2">
          <Button 
            label="Cancel" 
            onClick={() => {
              setShowRejectModal(false);
              setRejectionReason("");
            }}
            disabled={rejectLoading}
          />
          <Button 
            label="Reject" 
            onClick={submitReject}
            loading={rejectLoading}
            disabled={rejectLoading}
          />
        </div>
      </Dialog>
    </Dashboard>
  );
};

export default AdminAllRequests;