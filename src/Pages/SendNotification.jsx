import React, { useEffect, useState } from "react";
import axios from "axios";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import Dashboard from "../Components/Dashboard";

const SendNotification = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const adminId = sessionStorage.getItem("AdminId"); 
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeStatus, setEmployeeStatus] = useState({});

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const res = await axios.get(
        `${API_URL}/digicoder/crm/api/v1/employee/getall/${adminId}`
      );
      
      const empList = res.data.employees || [];
      setEmployees(empList);
      
      const statusMap = {};
      empList.forEach(emp => {
        statusMap[emp._id] = (emp.fcmTokens && emp.fcmTokens.length > 0) ? "✅ Ready" : "⚠️ No Token";
      });
      setEmployeeStatus(statusMap);
      
      console.log("📋 Employees loaded:", empList.length);
      
    } catch (err) {
      console.error("❌ Failed to load employees:", err);
      toast.error("Failed to load employees");
    } finally {
      setFetchingEmployees(false);
    }
  };

  useEffect(() => {
    if (adminId) {
      fetchEmployees();
    }
  }, [adminId]);

  const handleSend = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }
    
    if (!title.trim()) {
      toast.error("Please enter notification title");
      return;
    }
    
    if (!message.trim()) {
      toast.error("Please enter notification message");
      return;
    }

    try {
      setLoading(true);
      console.log("📤 Sending notification to:", selectedEmployee.empName);

      const response = await axios.post(
        `${API_URL}/digicoder/crm/api/v1/notification/send`,
        {
          employeeId: selectedEmployee._id,
          title,
          message,
        }
      );

      if (response.data.success) {
        toast.success("✅ Notification sent successfully!");
        console.log("✅ Message ID:", response.data.messageId);

        setTitle("");
        setMessage("");
        setSelectedEmployee(null);
      }
      
    } catch (err) {
      console.error("❌ Send error:", err);
      const errorMsg = err.response?.data?.message || err.message;
      toast.error("Failed: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const employeeTemplate = (option) => {
    if (!option) return null;
    const status = employeeStatus[option._id] || "⚠️ Unknown";
    return (
      <div className="flex justify-between items-center">
        <span>{option.empName}</span>
        <span className="text-xs ml-2">{status}</span>
      </div>
    );
  };

  return (
    <Dashboard>
      <div className="p-4 max-w-2xl mx-auto">
        <h2 className="mb-4 text-2xl font-bold">📢 Send Notification</h2>

        {/* Employee Dropdown */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Select Employee</label>
          <Dropdown
            value={selectedEmployee}
            options={employees}
            onChange={(e) => setSelectedEmployee(e.value)}
            optionLabel="empName"
            itemTemplate={employeeTemplate}
            valueTemplate={employeeTemplate}
            placeholder={fetchingEmployees ? "Loading employees..." : "Select Employee"}
            className="w-full"
            filter
            disabled={fetchingEmployees}
          />
          {selectedEmployee && employeeStatus[selectedEmployee._id] === "⚠️ No Token" && (
            <p className="text-yellow-600 text-sm mt-2">
              ⚠️ This employee hasn't logged in yet or notifications are disabled
            </p>
          )}
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Notification Title</label>
          <InputText
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title (e.g., Task Update)"
            className="w-full"
          />
        </div>

        {/* Message */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Message</label>
          <InputTextarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message"
            rows={4}
            className="w-full"
          />
        </div>

        {/* Send Button */}
        <Button
          label={loading ? "Sending..." : "Send Notification"}
          icon="pi pi-send"
          loading={loading}
          onClick={handleSend}
          disabled={!selectedEmployee || loading}
          className="w-full"
        />

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Note:</strong> Employees must have logged in and enabled notifications to receive messages.
          </p>
        </div>
      </div>
    </Dashboard>
  );
};

export default SendNotification;
