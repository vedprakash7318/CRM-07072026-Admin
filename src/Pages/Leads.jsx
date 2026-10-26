import React, { useEffect, useRef, useState } from 'react';
import Dashboard from '../Components/Dashboard';
import { Dropdown } from 'primereact/dropdown';
import * as XLSX from 'xlsx';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployee, fetchPriority, fetchSources } from '../Features/LeadSlice';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Toast } from 'primereact/toast';
import './CSS/Lead.css';
import DynamicTable from '../Components/DynmicTables';
import DynamicCard from '../Components/DynamicCard';
import DeletedDynamicTable from '../Components/DeletedDynamicTable';
import DeletedDynamicCard from '../Components/DeletedDynamicCard';
import ModalForm from '../Components/LeadForm';

function Leads() {
  const toast = useRef(null);
  const dispatch = useDispatch();
  const [selectedMyTags, setSelectedMyTags] = useState([]);
  const APi_Url = import.meta.env.VITE_API_URL;
  const AdminId = sessionStorage.getItem('AdminId');
  const [employeeFilter, setEmployeeFilter] = useState(null);
  const [tagsFilter, setTagsFilter] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [leadData, setLeadData] = useState([]);
  const [leads, setLeads] = useState([]);
  const [Deletedleads, setDeletedLeads] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [buttonTitle, setButtonTitle] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(100);
  const [totalRecords, setTotalRecords] = useState(0);

  // Form state
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  // Redux state selectors (keeping these for other data)
  const priorityData = useSelector((state) => state.leads.Priority);
  const sourcesData = useSelector((state) => state.leads.leadSources);
  
  const rawEmployeeData = useSelector((state) => state.leads.Employee);
  const employeeData = React.useMemo(() => {
    return rawEmployeeData?.filter(item => item?.blocked === false) || [];
  }, [rawEmployeeData]);

  const tagData = useSelector((state) => state.leads.tag);

  // Reference for tag dropdown
  const tagDropdownRef = useRef(null);

  const fetchDeletedLeads = async () => {
    try {
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/lead/getDeletedall/${AdminId}`);
      setDeletedLeads(response.data.leads)
    } catch (error) {
      // console.error("Error fetching deleted leads:", error);
    }
  };


  // Derived data
  const filteredLead = leads.filter(item => !item.deleted) || [];
  const deletedLead = Deletedleads;
  const tableTitle = 'Leads';

  // Dropdown options
  const priorityOptions = Array.isArray(priorityData)
    ? priorityData.map(priority => ({
      label: priority.priorityText,
      value: priority._id
    }))
    : [];

  const sourcesOptions = Array.isArray(sourcesData)
    ? sourcesData.map(sources => ({
      label: sources.leadSourcesText,
      value: sources._id
    }))
    : [];

  const employeeOptions = Array.isArray(employeeData)
    ? employeeData.map(employee => ({
      label: employee.empName,
      value: employee._id
    }))
    : [];

  // Filtered tags based on search
  const filteredTags = Array.isArray(tagData)
    ? (tagSearchQuery.trim() === ''
      ? tagData
      : tagData.filter(tag =>
        tag.tagName.toLowerCase().includes(tagSearchQuery.toLowerCase())
      )
    )
    : [];

  // Handle tags filter change from the DynamicTable component
  const handleTagsChange = (tags) => {
    setSelectedMyTags(tags);
    setTagsFilter(tags);
    // Reset pagination when filter changes
    setFirst(0);
    // Fetch leads with the new tags filter
    const isFilterActive = employeeFilter || searchQuery || (tags && tags.length > 0);
    const limit = isFilterActive ? 10000 : 100;
    fetchLeads(1, limit, employeeFilter, tags, searchQuery);
  };

  // Initial data fetch
  useEffect(() => {
    // Fetch data
    dispatch(fetchPriority());
    dispatch(fetchSources());
    dispatch(fetchEmployee());
    fetchLeads();
    fetchDeletedLeads()
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
        setIsTagDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Updated fetchLeads to include tags filtering
  const fetchLeads = async (page = 1, limit = 10, employeeId = employeeFilter, tags = tagsFilter, query = searchQuery) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/lead/getall/${AdminId}`, {
        params: {
          page,
          limit,
          leadAssignedTo: employeeId !== null ? employeeId : undefined,
          tags: tags && tags.length > 0 ? tags.join(',') : undefined,
          searchQuery: query || undefined
        },
      });

      if (response.data?.success) {
        setLeads(response.data.leads);
        setTotalRecords(response.data.totalLeads);

      } else {
        setLeads([]);
        setTotalRecords(0);
      }
    } catch (error) {
      // console.error("Error fetching leads:", error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch lead data.',
        life: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRange = async (from, to) => {
    try {
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/lead/getall/${AdminId}`, {
        params: {
          page: 1,
          limit: to,
          leadAssignedTo: employeeFilter !== null ? employeeFilter : undefined,
          tags: tagsFilter && tagsFilter.length > 0 ? tagsFilter.join(',') : undefined,
          searchQuery: searchQuery || undefined
        },
      });

      if (response.data?.success) {
        return response.data.leads.slice(from - 1, to);
      }
      return [];
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch range.',
        life: 3000,
      });
      return [];
    }
  };

  // Employee filter handler
  
  const handleGlobalSearch = (query) => {
    setSearchQuery(query);
    if (searchTimeout) clearTimeout(searchTimeout);
    const newTimeout = setTimeout(() => {
      setFirst(0);
      const isFilterActive = employeeFilter || tagsFilter.length > 0 || query;
      const limit = isFilterActive ? 10000 : 100;
      fetchLeads(1, limit, employeeFilter, tagsFilter, query);
    }, 500);
    setSearchTimeout(newTimeout);
  };

  const handleEmployeeFilter = (employeeId) => {
    setEmployeeFilter(employeeId);
    setFirst(0);
    const isFilterActive = employeeId || tagsFilter.length > 0 || searchQuery;
    const limit = isFilterActive ? 10000 : 100;
    fetchLeads(1, limit, employeeId, tagsFilter, searchQuery);
  };

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
    const isFilterActive = employeeFilter || searchQuery || (tagsFilter && tagsFilter.length > 0);
    if (!isFilterActive) {
      const currentPage = Math.floor(event.first / event.rows) + 1;
      fetchLeads(currentPage, event.rows, employeeFilter, tagsFilter, searchQuery);
    }
  };

  // File upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Missing File',
        detail: 'No file selected. Please choose a file to upload.',
        life: 3000,
      });
      return;
    }

    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const binaryStr = evt.target.result;
        const wb = XLSX.read(binaryStr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length > 0) {
          setLeadData(data);
        } else {
          toast.current?.show({
            severity: 'warn',
            summary: 'No Data',
            detail: 'No data found in the uploaded Excel file.',
            life: 3000,
          });
        }
      } catch (error) {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to process Excel file.',
          life: 3000,
        });
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Modal handlers
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleAdd = () => {
    setTitle('Add New Lead');
    setButtonTitle('Add Lead');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Refresh leads after closing modal
    fetchLeads();
  };

  // Bulk upload handler
  const handleBulkUpload = async () => {
    if (!selectedPriority || !selectedSource) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation Warning',
        detail: 'Please select both Source and Priority.',
        life: 3000,
      });
      return;
    }

    if (leadData.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'No Data',
        detail: 'Please upload an Excel file with lead data.',
        life: 3000,
      });
      return;
    }

    setIsUploading(true);

    // Process data
    const processedLeadData = leadData.map(lead => ({
      ...lead,
      priority: selectedPriority,
      sources: selectedSource,
      leadAssignedTo: selectedEmployee,
      tags: selectedTagId
    }));

    try {
      const response = await axios.post(
        `${APi_Url}/digicoder/crm/api/v1/lead/addmany/${AdminId}`,
        {
          leadsArray: processedLeadData,
          userType: 'Admin',
        }
      );

      if (response.data.success) {
        const addedCount = response.data.addedCount || 0;
        const failedCount = response.data.failedCount || 0;
        const duplicatesList = response.data.duplicates || [];

        let summaryHtml = `<div style="text-align: left; max-height: 300px; overflow-y: auto;">
          <p style="margin: 5px 0;"><b>Successfully Added:</b> <span style="color: #2e7d32;">${addedCount} leads</span></p>
          <p style="margin: 5px 0;"><b>Skipped (Duplicates):</b> <span style="color: #c62828;">${failedCount} leads</span></p>`;

        if (duplicatesList.length > 0) {
          summaryHtml += `<h5 style="margin-top: 15px; border-bottom: 2px solid #ddd; padding-bottom: 5px; font-weight: bold;">Skipped Leads:</h5>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 6px; border: 1px solid #ddd; text-align: left;">Name</th>
                <th style="padding: 6px; border: 1px solid #ddd; text-align: left;">Phone</th>
                <th style="padding: 6px; border: 1px solid #ddd; text-align: left;">Reason</th>
              </tr>
            </thead>
            <tbody>`;
          
          duplicatesList.forEach(dup => {
            summaryHtml += `<tr>
              <td style="padding: 6px; border: 1px solid #ddd; text-overflow: ellipsis; overflow: hidden; max-width: 150px; white-space: nowrap;">${dup.name}</td>
              <td style="padding: 6px; border: 1px solid #ddd;">${dup.phone}</td>
              <td style="padding: 6px; border: 1px solid #ddd; color: #d32f2f;">${dup.reason}</td>
            </tr>`;
          });
          summaryHtml += `</tbody></table>`;
        }
        summaryHtml += `</div>`;

        Swal.fire({
          title: 'Bulk Upload Status',
          html: summaryHtml,
          icon: failedCount > 0 ? 'warning' : 'success',
          confirmButtonText: 'Close',
          width: '550px'
        });

        // Reset states
        setLeadData([]);
        setSelectedPriority(null);
        setSelectedSource(null);
        setSelectedEmployee(null);
        setSelectedTags([]);
        setSelectedTagId([]);
        setTagSearchQuery('');
        setIsTagDropdownOpen(false);

        await fetchLeads();
        handleClose();
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: response.data.message || 'Something went wrong.',
          life: 3000,
        });
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'There was an error uploading the leads. Please try again.',
        life: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Download sample file
  const handleDownload = () => {
    const fileUrl = "/sample_leads.xlsx";
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "sample_leads.xlsx";
    link.click();
  };

  // Dropdown handlers
  const handlePriorityChange = (e) => {
    setSelectedPriority(e.value);
  };

  const handleSourceChange = (e) => {
    setSelectedSource(e.value);
  };

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.value);
  };

  // Tag selection handlers
  const toggleTagDropdown = () => {
    setIsTagDropdownOpen(!isTagDropdownOpen);
  };

  const handleTagSearchChange = (e) => {
    setTagSearchQuery(e.target.value);
  };

  const toggleTagSelection = (myTag) => {
    const tagIncluded = selectedTags.includes(myTag.tagName);
    const idIncluded = selectedTagId.includes(myTag._id);

    if (tagIncluded) {
      setSelectedTags(selectedTags.filter(tag => tag !== myTag.tagName));
    } else {
      setSelectedTags([...selectedTags, myTag.tagName]);
    }

    if (idIncluded) {
      setSelectedTagId(selectedTagId.filter(id => id !== myTag._id));
    } else {
      setSelectedTagId([...selectedTagId, myTag._id]);
    }
  };

  const removeTag = (tagToRemove, event) => {
    if (event) event.stopPropagation();

    // Find tag ID to remove
    const tagToRemoveObj = tagData?.find(tag => tag.tagName === tagToRemove);
    const tagId = tagToRemoveObj?._id;

    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
    if (tagId) {
      setSelectedTagId(selectedTagId.filter(id => id !== tagId));
    }
  };

  // Helper functions
  const isTagSelected = (tagName) => {
    return selectedTags.includes(tagName);
  };

  const truncateTag = (tag, maxLength = 10) => {
    return tag.length > maxLength ? `${tag.substring(0, maxLength)}...` : tag;
  };

  const getDisplayTags = () => {
    const MAX_VISIBLE_TAGS = 2;
    if (selectedTags.length <= MAX_VISIBLE_TAGS) {
      return selectedTags;
    }
    return [...selectedTags.slice(0, MAX_VISIBLE_TAGS)];
  };

  return (
    <div>
      <Toast ref={toast} />
      <Dashboard active={'leads'}>
        <div className="content">
          <div className="lead-header">
            <div className="lead-Add-btn">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="import-excel"
              />
              <button onClick={handleShow}>Import Leads</button>
              <button onClick={handleAdd}>Add Lead</button>
            </div>
          </div>

          {isProcessingFile && <div className="loading">Processing file...</div>}
          {isLoading && <div className="loading"></div>}

          {/* Table Section */}
          <div className="lead-table-container">
            <DynamicTable
              className='dynamicTable'
              lead={filteredLead}
              tableTitle={tableTitle}
              onUpdate={() => fetchLeads(Math.floor(first / rows) + 1, rows, employeeFilter, tagsFilter)} // Refresh current page with filters
              onPageChange={onPageChange}
              first={first}
              rows={rows}
              totalRecords={totalRecords}
              loading={isLoading}
              onEmployeeFilter={handleEmployeeFilter}
              employeeOptions={employeeOptions}
              onTagsChange={handleTagsChange}
              tagOptions={tagData || []}
              selectedTags={selectedMyTags}
              onGlobalSearch={handleGlobalSearch}
              fetchRange={fetchRange}
              lazy={!(employeeFilter || searchQuery || (tagsFilter && tagsFilter.length > 0))}
            />
          </div>
          <br /><br />
          <div className="lead-table-container">
            <DeletedDynamicTable
              lead={deletedLead}
              tableTitle={"Deleted Leads"}
              onUpdate={fetchLeads}
            />
          </div>

          {/* Card Section */}
          <div className="lead-card-container">
            <DynamicCard
              className='dynamicTable'
              lead={filteredLead}
              tableTitle={tableTitle}
              onUpdate={() => fetchLeads(Math.floor(first / rows) + 1, rows, employeeFilter, tagsFilter)} // Refresh current page with filters
              onPageChange={onPageChange}
              first={first}
              rows={rows}
              totalRecords={totalRecords}
              loading={isLoading}
              onEmployeeFilter={handleEmployeeFilter}
              employeeOptions={employeeOptions}
              onTagsChange={handleTagsChange}
              tagOptions={tagData || []}
              selectedTags={selectedMyTags}
              onGlobalSearch={handleGlobalSearch}
              fetchRange={fetchRange}
              lazy={!(employeeFilter || searchQuery || (tagsFilter && tagsFilter.length > 0))}
            />
          </div>
          <br /><br />
          <div className="lead-card-container">
            {/* <DeletedDynamicCard 
              lead={deletedLead} 
              tableTitle={"Deleted Leads"} 
              onUpdate={fetchLeads}
            /> */}
          </div>
          <br />

          {/* Lead Form Modal */}
          {isModalOpen && (
            <ModalForm
              isOpen={isModalOpen}
              onClose={closeModal}
              title={title}
              buttonTitle={buttonTitle}
              leadData={filteredLead}
              onLeadAdded={fetchLeads}
            />
          )}
        </div>

        {/* Modal for Import and Download */}
        <Modal
          show={show}
          onHide={handleClose}
          style={{ zIndex: 999 }}
        >
          <Modal.Header closeButton>
            <Modal.Title>Import/Download Leads</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ display: "flex", justifyContent: "space-around", gap: "10px" }}>
              <button
                style={{
                  padding: '10px',
                  border: "none",
                  backgroundColor: "#3454D1",
                  color: "white",
                  borderRadius: "5px",
                  width: "50%"
                }}
                onClick={() => document.getElementById('import-excel').click()}
                disabled={isUploading}
              >
                Import Excel File
              </button>
              <button
                style={{
                  padding: '10px',
                  border: "none",
                  backgroundColor: "#FD1E20",
                  color: "white",
                  borderRadius: "5px",
                  width: "50%"
                }}
                onClick={handleDownload}
                disabled={isUploading}
              >
                Download Sample File
              </button><br />
            </div><br />
            <div className='dropdown-option'>
              <Dropdown
                id="priority"
                name="priority"
                value={selectedPriority}
                options={priorityOptions}
                onChange={handlePriorityChange}
                optionLabel="label"
                optionValue="value"
                placeholder="Select priority"
                className="p-dropdown p-component"
                required
                disabled={isUploading}
              />

              <Dropdown
                id="sources"
                name="sources"
                value={selectedSource}
                options={sourcesOptions}
                onChange={handleSourceChange}
                optionLabel="label"
                optionValue="value"
                placeholder="Select source"
                className="p-dropdown p-component"
                required
                disabled={isUploading}
              />
            </div><br />
            <div style={{ display: "flex", gap: "10px" }}>
              <Dropdown
                id="employee"
                name="employee"
                value={selectedEmployee}
                options={employeeOptions}
                onChange={handleEmployeeChange}
                optionLabel="label"
                placeholder="Select Employee"
                className="p-dropdown p-component"
                style={{ width: "50%" }}
                disabled={isUploading}
              />


              {/* Simple Tag selection dropdown */}
              <div
                ref={tagDropdownRef}
                style={{
                  width: '50%',
                  position: 'relative',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }}
              >
                <div
                  onClick={toggleTagDropdown}
                  style={{
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    padding: '0.5rem 0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    height: '50px',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    flexWrap: 'nowrap',
                    gap: '4px',
                    maxWidth: '90%',
                    overflow: 'hidden',
                    alignItems: 'center'
                  }}>
                    {selectedTags.length === 0 ? (
                      <span style={{ color: '#6c757d' }}>Select tags</span>
                    ) : (
                      <>
                        {getDisplayTags().map((tag, index) => (
                          <div
                            key={index}
                            style={{
                              backgroundColor: '#e9ecef',
                              borderRadius: '3px',
                              padding: '0.2rem 0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '0.875rem',
                              whiteSpace: 'nowrap',
                              maxWidth: '80px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {truncateTag(tag)}
                            <span
                              onClick={(e) => removeTag(tag, e)}
                              style={{
                                marginLeft: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              ×
                            </span>
                          </div>
                        ))}
                        {selectedTags.length > 2 && (
                          <div style={{
                            backgroundColor: '#e9ecef',
                            borderRadius: '3px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap'
                          }}>
                            +{selectedTags.length - 2} more
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <span style={{ color: '#6c757d' }}>▼</span>
                </div>

                {isTagDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    backgroundColor: 'white',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    marginTop: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 1000
                  }}>
                    <div style={{ padding: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Search tags"
                        value={tagSearchQuery}
                        onChange={handleTagSearchChange}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #ced4da',
                          borderRadius: '4px'
                        }}
                      />
                    </div>

                    {selectedTags.length > 0 && (
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        borderBottom: '1px solid #e9ecef',
                        fontSize: '0.875rem',
                        color: '#6c757d'
                      }}>
                        {selectedTags.length} item{selectedTags.length !== 1 ? 's' : ''} selected
                      </div>
                    )}

                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      padding: '0.5rem 0'
                    }}>
                      {filteredTags.length > 0 ? filteredTags.map((tag) => (
                        <div
                          key={tag._id}
                          onClick={() => toggleTagSelection(tag)}
                          style={{
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            backgroundColor: isTagSelected(tag.tagName) ? '#e9ecef' : 'transparent',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isTagSelected(tag.tagName)}
                            readOnly
                            style={{ marginRight: '8px' }}
                          />
                          {tag.tagName}
                        </div>
                      )) : (
                        <div style={{ padding: '0.5rem 1rem', color: '#6c757d' }}>
                          No tags found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div><br />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button
                onClick={handleBulkUpload}
                className='saveBulk'
                disabled={isUploading || leadData.length === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: leadData.length === 0 ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: leadData.length === 0 ? 'not-allowed' : 'pointer',
                  width: '200px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                {isUploading ? (
                  <>
                    <div style={{
                      width: "20px",
                      height: "20px",
                      border: "3px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "50%",
                      borderTop: "3px solid #fff",
                      animation: "spin 1s linear infinite"
                    }}></div>
                    <span>Uploading...</span>
                  </>
                ) : 'Upload Leads'}
              </button>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} disabled={isUploading}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* CSS for spinner animation */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Dashboard>
    </div>
  );
}

export default Leads;