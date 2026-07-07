import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import Dashboard from "../Components/Dashboard";

const LeadRequests = () => {
  const API = import.meta.env.VITE_API_URL;
  const adminId = sessionStorage.getItem("AdminId");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const toast = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API}/digicoder/crm/api/v1/lead-request/admin/${adminId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("Token")}` } }
      );
      if (res.data.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      console.log(err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load lead transfer requests',
        life: 3000
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (adminId) {
      loadData();
    }
  }, [adminId]);

  const handleAccept = async (id) => {
    setActionLoading(true);
    try {
      await axios.put(
        `${API}/digicoder/crm/api/v1/lead-request/accept/${id}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("Token")}` } }
      );
      toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Request accepted. Lead transferred.', life: 3000 });
      loadData();
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Failed to accept request', life: 3000 });
    }
    setActionLoading(false);
  };

  const confirmReject = (id) => {
    setSelectedRequestId(id);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Reason is required', life: 3000 });
      return;
    }
    setActionLoading(true);
    try {
      await axios.put(
        `${API}/digicoder/crm/api/v1/lead-request/reject/${selectedRequestId}`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${localStorage.getItem("Token")}` } }
      );
      toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Request rejected.', life: 3000 });
      setShowRejectModal(false);
      loadData();
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Failed to reject', life: 3000 });
    }
    setActionLoading(false);
  };

  const statusTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.status.toUpperCase()}
        severity={rowData.status === "pending" ? "warning" : rowData.status === "accepted" ? "success" : "danger"}
      />
    );
  };

  const actionTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-check"
          className="p-button-rounded p-button-success p-button-sm mr-2"
          onClick={() => handleAccept(rowData._id)}
          disabled={actionLoading}
          tooltip="Accept Request"
        />
        <Button
          icon="pi pi-times"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmReject(rowData._id)}
          disabled={actionLoading}
          tooltip="Reject Request"
        />
      </div>
    );
  };

  const leadNameTemplate = (rowData) => {
    return rowData.leadId?.name || "N/A";
  };

  const leadPhoneTemplate = (rowData) => {
    return rowData.leadId?.phone || "N/A";
  };

  const requestedByTemplate = (rowData) => {
    return rowData.requestedBy?.empName || "N/A";
  };
  
  const currentOwnerTemplate = (rowData) => {
    return rowData.currentOwner?.empName || "N/A";
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-content-between align-items-center">
        <h5 className="m-0">Lead Transfer Requests</h5>
      </div>
    );
  };

  return (
    <Dashboard>
      <div className="card">
        <Toast ref={toast} />

        <DataTable
          value={requests}
          loading={loading}
          dataKey="_id"
          header={renderHeader()}
          emptyMessage="No pending requests found."
          paginator
          rows={10}
        >
          <Column header="Requested By" body={requestedByTemplate} />
          <Column header="Current Owner" body={currentOwnerTemplate} />
          <Column header="Lead Name" body={leadNameTemplate} />
          <Column header="Lead Phone" body={leadPhoneTemplate} />
          <Column header="Status" body={statusTemplate} />
          <Column header="Action" body={actionTemplate} style={{ width: '150px' }} />
        </DataTable>

        {/* Reject Dialog */}
        <Dialog
          visible={showRejectModal}
          onHide={() => setShowRejectModal(false)}
          header="Reject Transfer Request"
          footer={
            <div>
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowRejectModal(false)} className="p-button-text" />
              <Button label="Submit" icon="pi pi-check" onClick={handleReject} loading={actionLoading} autoFocus />
            </div>
          }
        >
          <div className="flex flex-column gap-2 mt-3">
            <label htmlFor="reason" className="font-bold">Rejection Reason</label>
            <InputText
              id="reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection"
              style={{ width: '100%' }}
            />
          </div>
        </Dialog>
      </div>
    </Dashboard>
  );
};

export default LeadRequests;
