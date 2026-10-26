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

function Enquiries() {
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
  const [rows, setRows] = useState(100);
  const [totalRecords, setTotalRecords] = useState(0);
  const [tableTitle] = useState('Public Enquiries');
  const [adminSlug, setAdminSlug] = useState('');

  // Redux state selectors
  const rawEmployeeData = useSelector((state) => state.leads.Employee);
  const employeeData = React.useMemo(() =>
    rawEmployeeData?.filter(item => item?.blocked === false) || [],
    [rawEmployeeData]);
  const tagData = useSelector((state) => state.leads.tag);

  // Derived data
  const filteredLead = leads.filter(item => {
    if (item.deleted) return false;
    return true; // Enquiries can be unassigned, so don't filter out based on leadAssignedTo
  }) || [];

  // Dropdown options
  const employeeOptions = Array.isArray(employeeData)
    ? employeeData.map(employee => ({
      label: employee.empName,
      value: employee._id
    }))
    : [];

  const handleTagsChange = (tags) => {
    setSelectedMyTags(tags);
    setTagsFilter(tags);
    setFirst(0);
    const isFilterActive = employeeFilter || searchQuery || (tags && tags.length > 0);
    const limit = isFilterActive ? 10000 : 100;
    fetchEnquiries(1, limit, employeeFilter, tags, searchQuery);
  };

  // Initial data fetch
  useEffect(() => {
    const tokenId = sessionStorage.getItem('Token');
    if (!tokenId) {
      navigate('/');
      return;
    }

    // Attempt to get admin details for the public form link
    fetchAdminDetails();

    // Fetch data from Redux
    dispatch(fetchPriority());
    dispatch(fetchSources());
    dispatch(fetchEmployee());

    // Fetch leads
    fetchEnquiries();
  }, []);

  const fetchAdminDetails = async () => {
    try {
      // Depending on the backend, admin slug might be in a profile endpoint.
      // Assuming a generic endpoint or relying on localStorage/sessionStorage.
      const slug = sessionStorage.getItem('AdminSlug');
      if (slug) {
        setAdminSlug(slug);
      } else {
        const res = await axios.get(`${APi_Url}/digicoder/crm/api/v1/admin/getone/${AdminId}`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('Token')}`
          }
        });
        if (res.data?.admin?.adminSlug) {
          setAdminSlug(res.data.admin.adminSlug);
          sessionStorage.setItem('AdminSlug', res.data.admin.adminSlug);
        }
      }
    } catch (err) {
      console.log('Could not fetch admin details for slug');
    }
  };

  // Fetch public enquiries
  const fetchEnquiries = async (page = 1, limit = 5, employeeId = employeeFilter, tags = tagsFilter, query = searchQuery) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/lead/admin-public-enquiries/${AdminId}`, {
        params: {
          page,
          limit,
          leadAssignedTo: employeeId !== null ? employeeId : undefined,
          tags: tags && tags.length > 0 ? tags.join(',') : undefined,
          searchQuery: query || undefined
        },
      });
      console.log(response);

      if (response.data?.leads) {
        setLeads(response.data.leads);
        setTotalRecords(response.data.count || response.data.leads.length);
      } else {
        setLeads([]);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch public enquiries data.',
        life: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Employee filter handler

  const handleEmployeeFilter = (employeeId) => {
    setEmployeeFilter(employeeId);
    setFirst(0);
    const isFilterActive = employeeId || tagsFilter.length > 0 || searchQuery;
    const limit = isFilterActive ? 10000 : 100;
    fetchEnquiries(1, limit, employeeId, tagsFilter, searchQuery);
  };

  const handleGlobalSearch = (query) => {
    setSearchQuery(query);
    if (searchTimeout) clearTimeout(searchTimeout);
    const newTimeout = setTimeout(() => {
      setFirst(0);
      const isFilterActive = employeeFilter || tagsFilter.length > 0 || query;
      const limit = isFilterActive ? 10000 : 100;
      fetchEnquiries(1, limit, employeeFilter, tagsFilter, query);
    }, 500);
    setSearchTimeout(newTimeout);
  };

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
    const isFilterActive = employeeFilter || searchQuery || (tagsFilter && tagsFilter.length > 0);
    if (!isFilterActive) {
      const currentPage = Math.floor(event.first / event.rows) + 1;
      fetchEnquiries(currentPage, event.rows, employeeFilter, tagsFilter, searchQuery);
    }
  };

  // Modal handlers
  const handleAdd = () => {
    setTitle('Add New Enquiry');
    setButtonTitle('Add Enquiry');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    fetchEnquiries();
  };

  const copyPublicLink = () => {
    if (!adminSlug) {
      toast.current?.show({ severity: 'warn', summary: 'Wait', detail: 'Admin slug not found yet.', life: 3000 });
      return;
    }
    const baseUrl = import.meta.env.VITE_PUBLIC_FORM_URL;
    const link = `${baseUrl}/${adminSlug}`;
    navigator.clipboard.writeText(link);
    toast.current?.show({ severity: 'success', summary: 'Copied', detail: 'Public Enquiry Form link copied to clipboard!', life: 3000 });
  };

  return (
    <div>
      <Toast ref={toast} />
      <Dashboard active={'enquiries'}>
        <div className="content">
          <div className="lead-header">
            <div className="lead-Add-btn" style={{ gap: '10px' }}>
              <span></span>
              <button onClick={handleAdd}>Add Enquiry</button>
              <button
                onClick={copyPublicLink}
                style={{ backgroundColor: '#10b981', color: 'white' }}>
                <i className="ri-file-copy-line" style={{ marginRight: '5px' }}></i>
                Copy Form Link
              </button>
            </div>
          </div>

          {isLoading && <div className="loading"></div>}

          {/* Table Section */}
          <div className="lead-table-container">
            <DynamicTable
              className='dynamicTable'
              lead={filteredLead}
              tableTitle={tableTitle}
              onUpdate={() => fetchEnquiries(Math.floor(first / rows) + 1, rows, employeeFilter, tagsFilter)}
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
              lazy={!(employeeFilter || searchQuery || (tagsFilter && tagsFilter.length > 0))}
            />
          </div>

          {/* Card Section */}
          <div className="lead-card-container">
            <DynamicCard
              className='dynamicTable'
              lead={filteredLead}
              tableTitle={tableTitle}
              onUpdate={() => fetchEnquiries(Math.floor(first / rows) + 1, rows, employeeFilter, tagsFilter)}
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
              lazy={!(employeeFilter || searchQuery || (tagsFilter && tagsFilter.length > 0))}
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
              onLeadAdded={fetchEnquiries}
            />
          )}
        </div>
      </Dashboard>
    </div>
  );
}

export default Enquiries;
