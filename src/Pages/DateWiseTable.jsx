import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MultiSelect } from 'primereact/multiselect';
import axios from 'axios';
import { FaEye, FaTrash, FaSearch, FaTimes } from 'react-icons/fa';
import './CSS/DateWiseTable.css';
import Dashboard from "../Components/Dashboard";

const DateWiseTable = () => {
  const location = useLocation();
  const followups = location.state?.followups || [];
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch lead statuses
  useEffect(() => {
    const fetchLeadStatuses = async () => {
      try {
        const APi_Url = import.meta.env.VITE_API_URL;
        const AdminId = sessionStorage.getItem('AdminId');
        const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/leadstatus/getall/${AdminId}`);
        setLeadStatuses(response.data.leadStatus || []);
      } catch (error) {
        console.error('Error fetching lead status data:', error);
      } finally {
        setLoadingStatuses(false);
      }
    };

    fetchLeadStatuses();
  }, []);

  // Fetch tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const APi_Url = import.meta.env.VITE_API_URL;
        const AdminId = sessionStorage.getItem('AdminId');
        const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/tags/getall/${AdminId}`);
        setTags(response.data.tags || []);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTags();
  }, []);

  // Set loading data to false when followups are available
  useEffect(() => {
    if (followups.length > 0) {
      setLoadingData(false);
    }
  }, [followups]);

  // Get only the latest follow-up per unique lead
  const uniqueLeads = useMemo(() => {
    const leadMap = new Map();

    followups.forEach(item => {
      const leadId = item.leadId?._id;
      if (!leadId) return;

      const existing = leadMap.get(leadId);
      if (!existing || new Date(item.createdAt) > new Date(existing.createdAt)) {
        leadMap.set(leadId, {
          id: leadId,
          name: item.leadId?.name || '',
          phone: item.leadId?.phone || '',
          status: item.followupStatus?.leadStatusText || '',
          createdAt: item.createdAt,
          tags: item.leadId?.tags || []
        });
      }
    });

    return Array.from(leadMap.values());
  }, [followups]);

  // Filter leads based on search term, status, and tags
  const filteredLeads = useMemo(() => {
    return uniqueLeads.filter(lead => {
      // Search term filter (name, phone, status, tags)
      const matchesSearch = searchTerm ? (
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.tags.some(tag => {
          const tagName = typeof tag === 'string' ? tag : tag?.tagName || '';
          return tagName.toLowerCase().includes(searchTerm.toLowerCase());
        })
      ) : true;

      // Status filter
      const matchesStatus = !selectedStatus || lead.status === selectedStatus;
      
      // Tags filter
      let matchesTags = true;
      if (selectedTags.length > 0) {
        const leadTagNames = lead.tags.map(tag => 
          typeof tag === 'string' ? tag : tag?.tagName || ''
        );
        matchesTags = selectedTags.some(selectedTag => 
          leadTagNames.includes(selectedTag.name || selectedTag)
        );
      }

      return matchesSearch && matchesStatus && matchesTags;
    });
  }, [uniqueLeads, searchTerm, selectedStatus, selectedTags]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleView = (item) => {
    console.log("Viewing lead:", item);
  };

  const handleDelete = (id) => {
    console.log("Deleting lead ID:", id);
  };

  // Prepare tag options for MultiSelect
  const tagOptions = tags.map(tag => ({
    name: tag.tagName || tag.name || tag,
    value: tag._id || tag.id || tag
  }));

  if (loadingData) {
    return (
      <div className="dateWise-data-container">
        <div className="dateWise-loader-container">
          <div className="dateWise-loader"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <Dashboard>
      <div className="dateWise-data-container">
        {/* Search and Filters */}
        <div className="dateWise-filters-container">
          {/* Search Input */}
          <div className="dateWise-search-container">
            <div className="dateWise-search-input-wrapper">
              <FaSearch className="dateWise-search-icon" />
              <input
                type="text"
                placeholder="Search by name, phone, status, or tags..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="dateWise-search-input"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="dateWise-clear-search-btn"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="dateWise-filter-group">
            {loadingStatuses ? (
              <div className="dateWise-filter-loader">
                <div className="dateWise-small-loader"></div>
              </div>
            ) : (
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="dateWise-filter-select"
              >
                <option value="">All Statuses</option>
                {leadStatuses.map((status) => (
                  <option key={status._id || status.id} value={status.leadStatusText || status.name}>
                    {status.leadStatusText || status.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tags Filter */}
          <div className="dateWise-filter-group">
            {loadingTags ? (
              <div className="dateWise-filter-loader">
                <div className="dateWise-small-loader"></div>
              </div>
            ) : (
              <MultiSelect
                value={selectedTags}
                onChange={(e) => {
                  setSelectedTags(e.value);
                  setCurrentPage(1);
                }}
                panelStyle={{width:"50%"}}
                options={tagOptions}
                optionLabel="name"
                placeholder="Select tags..."
                className="dateWise-multiselect-tags"
              />
            )}
          </div>

          {/* Reset Filters Button */}
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedStatus("");
              setSelectedTags([]);
              setCurrentPage(1);
            }}
            className="dateWise-reset-filters-btn"
          >
            Reset All
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="dateWise-table-wrapper">
          <table className="dateWise-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Last Follow-up Status</th>
                <th>Tags</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.phone}</td>
                  <td>{item.status}</td>
                  <td>
                    {item.tags.length > 0 ? (
                      item.tags.map((tag, idx) => (
                        <span key={idx} className="dateWise-tag">
                          {typeof tag === 'string' ? tag : tag?.tagName || 'Tag'}
                        </span>
                      ))
                    ) : (
                      <em>No tags</em>
                    )}
                  </td>
                  <td>
                    <div className="dateWise-action-buttons">
                      <button 
                        className="dateWise-btn dateWise-view-btn" 
                        onClick={() => handleView(item)}
                        title="View"
                      >
                        <FaEye className="dateWise-btn-icon" />
                      </button>
                      <button 
                        className="dateWise-btn dateWise-delete-btn" 
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
                      >
                        <FaTrash className="dateWise-btn-icon" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {filteredLeads.length > itemsPerPage && (
            <div className="dateWise-pagination">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="dateWise-pagination-btn"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`dateWise-pagination-btn ${currentPage === number ? 'dateWise-active' : ''}`}
                >
                  {number}
                </button>
              ))}
              
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="dateWise-pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="dateWise-card-wrapper">
          {currentItems.map((item) => (
            <div className="dateWise-card" key={item.id}>
              <p><strong>Name:</strong> {item.name}</p>
              <p><strong>Phone:</strong> {item.phone}</p>
              <p><strong>Last Status:</strong> {item.status}</p>
              <p><strong>Tags:</strong> {
                item.tags.length > 0 ? item.tags.map((tag, idx) => (
                  <span key={idx} className="dateWise-tag">
                    {typeof tag === 'string' ? tag : tag?.tagName || 'Tag'}
                  </span>
                )) : <em>No tags</em>
              }</p>
              <div className="dateWise-card-actions">
                <button 
                  className="dateWise-btn dateWise-view-btn" 
                  onClick={() => handleView(item)}
                  title="View"
                >
                  <FaEye className="dateWise-btn-icon" />
                </button>
                <button 
                  className="dateWise-btn dateWise-delete-btn" 
                  onClick={() => handleDelete(item.id)}
                  title="Delete"
                >
                  <FaTrash className="dateWise-btn-icon" />
                </button>
              </div>
            </div>
          ))}

          {/* Mobile Pagination */}
          {filteredLeads.length > itemsPerPage && (
            <div className="dateWise-mobile-pagination">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="dateWise-pagination-btn"
              >
                &lt;
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="dateWise-pagination-btn"
              >
                &gt;
              </button>
            </div>
          )}
        </div>

        {filteredLeads.length === 0 && !loadingData && (
          <div className="dateWise-no-data">
            <p>No leads found matching your filters.</p>
            <button 
              onClick={() => {
                setSearchTerm("");
                setSelectedStatus("");
                setSelectedTags([]);
              }}
              className="dateWise-reset-filters-btn"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </Dashboard>
  );
};

export default DateWiseTable;