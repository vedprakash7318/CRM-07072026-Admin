import React, { useEffect, useRef, useState } from 'react';
import Dashboard from '../Components/Dashboard';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployee, fetchPriority, fetchSources } from '../Features/LeadSlice';
import axios from 'axios';
import { Toast } from 'primereact/toast';
import './CSS/Lead.css';
import DynamicTable from '../Components/DynmicTables';
import DynamicCard from '../Components/DynamicCard';
import ModalForm from '../Components/LeadForm';

function AssignedLeads() {
  // Toast reference
  const toast = useRef(null);

  // Navigation and Redux
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedMyTags, setSelectedMyTags] = useState([]);

  // API data
  const APi_Url = import.meta.env.VITE_API_URL;
  const AdminId = sessionStorage.getItem('AdminId');
  const [employeeFilter, setEmployeeFilter] = useState(null);
  const [tagsFilter, setTagsFilter] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);

  // State management
  const [leads, setLeads] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [buttonTitle, setButtonTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(500);
  const [totalRecords, setTotalRecords] = useState(0);
  const [tableTitle] = useState('Assigned Leads');

  // Redux state selectors
  const employeeData = useSelector((state) =>
    state.leads.Employee?.filter(item => item?.blocked === false) || []
  );
  const tagData = useSelector((state) => state.leads.tag);

  // Derived data
  const filteredLead = leads.filter(item => {
    if (item.deleted) return false;
    if (!item.leadAssignedTo) return false;

    if (Array.isArray(item.leadAssignedTo)) {
      // Must have at least one valid employee object with an _id or empName
      return item.leadAssignedTo.some(emp => emp && typeof emp === 'object' && emp._id);
    }

    return typeof item.leadAssignedTo === 'object' && item.leadAssignedTo._id;
  }) || [];

  // Dropdown options
  const employeeOptions = Array.isArray(employeeData)
    ? employeeData.map(employee => ({
      label: employee.empName,
      value: employee._id
    }))
    : [];

  // Handle tags filter change from the DynamicTable component
  const handleTagsChange = (tags) => {
    setSelectedMyTags(tags);
    setTagsFilter(tags);
    // Reset pagination when filter changes
    setFirst(0);
    // Fetch leads with the new tags filter
    fetchAssignedLeads(1, rows, employeeFilter, tags, searchQuery);
  };

  // Initial data fetch
  useEffect(() => {
    const tokenId = sessionStorage.getItem('Token');
    if (!tokenId) {
      navigate('/');
      return;
    }

    // Fetch data from Redux
    dispatch(fetchPriority());
    dispatch(fetchSources());
    dispatch(fetchEmployee());

    // Fetch assigned leads
    fetchAssignedLeads();
  }, []);

  // Updated fetchAssignedLeads to include pagination and filtering
  const fetchAssignedLeads = async (page = 1, limit = 5, employeeId = employeeFilter, tags = tagsFilter, query = searchQuery) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/lead/getAssignedLeads/${AdminId}`, {
        params: {
          page,
          limit,
          leadAssignedTo: employeeId !== null ? employeeId : undefined,
          tags: tags && tags.length > 0 ? tags.join(',') : undefined,
          searchQuery: query || undefined
        },
      });

      if (response.data?.leads) {
        setLeads(response.data.leads);
        setTotalRecords(response.data.totalLeads || response.data.leads.length);
      } else {
        setLeads([]);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error("Error fetching assigned leads:", error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch assigned lead data.',
        life: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Employee filter handler
  
  const handleGlobalSearch = (query) => {
    setSearchQuery(query);
    if (searchTimeout) clearTimeout(searchTimeout);
    const newTimeout = setTimeout(() => {
      setFirst(0);
      fetchAssignedLeads(1, rows, employeeFilter, tagsFilter, query);
    }, 500);
    setSearchTimeout(newTimeout);
  };

  const handleEmployeeFilter = (employeeId) => {
    setEmployeeFilter(employeeId);
    fetchAssignedLeads(1, rows, employeeId, tagsFilter, searchQuery);
  };

  // Updated onPageChange handler
  const onPageChange = (event) => {
    const currentPage = Math.floor(event.first / event.rows) + 1;
    setFirst(event.first);
    setRows(event.rows);
    fetchAssignedLeads(currentPage, event.rows, employeeFilter, tagsFilter, searchQuery); // Include both filters
  };

  // Modal handlers
  const handleAdd = () => {
    setTitle('Add New Lead');
    setButtonTitle('Add Lead');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Refresh leads after closing modal
    fetchAssignedLeads();
  };

  // Clear all filters function
  const clearAllFilters = () => {
    setEmployeeFilter(null);
    setTagsFilter([]);
    setSelectedMyTags([]);
    setFirst(0);
    fetchAssignedLeads(1, rows);
  };

  return (
    <div>
      <Toast ref={toast} />
      <Dashboard active={'assigned'}>
        <div className="content">
          <div className="lead-header">
            <div className="lead-Add-btn">
              <span></span>
              <button onClick={handleAdd}>Add Lead</button>
              {(employeeFilter || tagsFilter.length > 0) && (
                // <button 
                //   onClick={clearAllFilters}
                //   style={{
                //     backgroundColor: '#6c757d',
                //     color: 'white'
                //   }}
                // >
                //   Clear All Filters
                // </button>
                <></>
              )}
            </div>
          </div>

          {isLoading && <div className="loading"></div>}

          {/* Table Section */}
          <div className="lead-table-container">
            <DynamicTable
              className='dynamicTable'
              lead={filteredLead}
              tableTitle={tableTitle}
              onUpdate={() => fetchAssignedLeads(Math.floor(first / rows) + 1, rows, employeeFilter, tagsFilter)} // Refresh current page with filters
              onPageChange={onPageChange}
            onGlobalSearch={handleGlobalSearch}
              first={first}
              rows={rows}
              totalRecords={totalRecords}
              loading={isLoading}
              onEmployeeFilter={handleEmployeeFilter}
              employeeOptions={employeeOptions}
              onTagsChange={handleTagsChange}
              tagOptions={tagData || []}
              selectedTags={selectedMyTags}
            />
          </div>

          {/* Card Section */}
          <div className="lead-card-container">
            <DynamicCard
              className='dynamicTable'
              lead={filteredLead}
              tableTitle={tableTitle}
              onUpdate={() => fetchAssignedLeads(Math.floor(first / rows) + 1, rows, employeeFilter, tagsFilter)} // Refresh current page with filters
              onPageChange={onPageChange}
            onGlobalSearch={handleGlobalSearch}
              first={first}
              rows={rows}
              totalRecords={totalRecords}
              loading={isLoading}
              onEmployeeFilter={handleEmployeeFilter}
              employeeOptions={employeeOptions}
              onTagsChange={handleTagsChange}
              tagOptions={tagData || []}
              selectedTags={selectedMyTags}
            />
          </div>

          {/* Lead Form Modal */}
          {isModalOpen && (
            <ModalForm
              isOpen={isModalOpen}
              onClose={closeModal}
              title={title}
              buttonTitle={buttonTitle}
              leadData={filteredLead}
              onLeadAdded={fetchAssignedLeads}
            />
          )}
        </div>
      </Dashboard>
    </div>
  );
}

export default AssignedLeads;