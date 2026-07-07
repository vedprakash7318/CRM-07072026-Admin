import React, { useEffect, useRef, useState } from 'react';
import Dashboard from '../Components/Dashboard';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployee, fetchPriority, fetchSources } from '../Features/LeadSlice';
import axios from 'axios';
import { Toast } from 'primereact/toast';
import './CSS/Lead.css';
import DynamicTable from '../Components/DynmicTables';
import DynamicCard from '../Components/DynamicCard';
import ModalForm from '../Components/LeadForm';

function UnassignedLeads() {
  // Toast reference
  const toast = useRef(null);

  // Navigation and Redux
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedMyTags, setSelectedMyTags] = useState([]);

  // API data
  const APi_Url = import.meta.env.VITE_API_URL;
  const AdminId = sessionStorage.getItem('AdminId');
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
  const [tableTitle] = useState('Unassigned Leads');

  // Redux state selectors
  const tagData = useSelector((state) => state.leads.tag);

  // Handle tags filter change from the DynamicTable component
  
  const handleGlobalSearch = (query) => {
    setSearchQuery(query);
    if (searchTimeout) clearTimeout(searchTimeout);
    const newTimeout = setTimeout(() => {
      setFirst(0);
      fetchUnassignedLeads(1, rows, employeeFilter, tagsFilter, query);
    }, 500);
    setSearchTimeout(newTimeout);
  };

  const handleTagsChange = (tags) => {
    setSelectedMyTags(tags);
    setTagsFilter(tags);
    // Reset pagination when filter changes
    setFirst(0);
    // Fetch leads with the new tags filter
    fetchUnassignedLeads(1, rows, tags, searchQuery);
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

    // Fetch unassigned leads
    fetchUnassignedLeads();
  }, []);

  // Updated fetchUnassignedLeads to include pagination and filtering
  const fetchUnassignedLeads = async (page = 1, limit = 5, tags = tagsFilter, query = searchQuery) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/lead/getUnassignedLeads/${AdminId}`, {
        params: {
          page,
          limit,
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
      console.error("Error fetching unassigned leads:", error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch unassigned lead data.',
        life: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Updated onPageChange handler
  const onPageChange = (event) => {
    const currentPage = Math.floor(event.first / event.rows) + 1;
    setFirst(event.first);
    setRows(event.rows);
    fetchUnassignedLeads(currentPage, event.rows, tagsFilter, searchQuery);
  };

  // Modal handlers
  const handleAdd = () => {
    setTitle('Add New Lead');
    setButtonTitle('Add Lead');
    setIsModalOpen(true);
  };

  // const handleAssignLeads = () => {
  //   setTitle('Assign Leads');
  //   setButtonTitle('Assign');
  //   setIsModalOpen(true);
  // };

  const closeModal = () => {
    setIsModalOpen(false);
    // Refresh leads after closing modal
    fetchUnassignedLeads();
  };

  // Clear all filters function
  const clearAllFilters = () => {
    setTagsFilter([]);
    setSelectedMyTags([]);
    setFirst(0);
    fetchUnassignedLeads(1, rows);
  };

  return (
    <div>
      <Toast ref={toast} />
      <Dashboard active={'unassigned'}>
        <div className="content">
          <div className="lead-header">
            <div className="lead-Add-btn">
              <span></span>
              <button onClick={handleAdd}>Add Lead</button>
            </div>
          </div>

          {isLoading && <div className="loading"></div>}

          {/* Table Section */}
          <div className="lead-table-container">
            <DynamicTable
              className='dynamicTable'
              lead={leads}
              tableTitle={tableTitle}
              onUpdate={() => fetchUnassignedLeads(Math.floor(first / rows) + 1, rows, tagsFilter)}
              onPageChange={onPageChange}
              first={first}
              rows={rows}
              totalRecords={totalRecords}
              loading={isLoading}
              onTagsChange={handleTagsChange}
              tagOptions={tagData || []}
              selectedTags={selectedMyTags}
              showAssignButton={true} // Option to show assign button in each row
              onAssignSuccess={fetchUnassignedLeads}
            onGlobalSearch={handleGlobalSearch}
            />
          </div>

          {/* Card Section */}
          <div className="lead-card-container">
            <DynamicCard
              className='dynamicTable'
              lead={leads}
              tableTitle={tableTitle}
              onUpdate={() => fetchUnassignedLeads(Math.floor(first / rows) + 1, rows, tagsFilter)}
              onPageChange={onPageChange}
              first={first}
              rows={rows}
              totalRecords={totalRecords}
              loading={isLoading}
              onTagsChange={handleTagsChange}
              tagOptions={tagData || []}
              selectedTags={selectedMyTags}
              showAssignButton={true} // Option to show assign button in each row
              onAssignSuccess={fetchUnassignedLeads}
            onGlobalSearch={handleGlobalSearch}
            />
          </div>

          {/* Lead Form Modal */}
          {isModalOpen && (
            <ModalForm
              isOpen={isModalOpen}
              onClose={closeModal}
              title={title}
              buttonTitle={buttonTitle}
              leadData={leads}
              onLeadAdded={fetchUnassignedLeads}
              isUnassignedView={true}
            />
          )}
        </div>
      </Dashboard>
    </div>
  );
}

export default UnassignedLeads;