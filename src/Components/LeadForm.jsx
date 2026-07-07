import React, { useState, useEffect } from 'react';
import './CSS/LeadForm.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPriority, fetchSources } from '../Features/LeadSlice';

const LeadForm = ({ isOpen, onClose, title, buttonTitle, leadData }) => {
  const APi_Url = import.meta.env.VITE_API_URL;
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTagValues, setSelectedTagValues] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const tagData = useSelector((state) => state.leads.tag);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    priority: '',
    sources: ''
  });

  const dispatch = useDispatch();
  const priorityData = useSelector((state) => state.leads.Priority);
  const sourcesData = useSelector((state) => state.leads.leadSources);

  const [priorityOptions, setPriorityOptions] = useState([]);
  const [sourcesOptions, setSourcesOptions] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchPriority());
    dispatch(fetchSources());
  }, [dispatch]);

  useEffect(() => {
    if (priorityData && Array.isArray(priorityData)) {
      setPriorityOptions(
        priorityData.map((priority) => ({
          label: priority.priorityText,
          value: priority._id
        }))
      );
    }
  }, [priorityData]);

  useEffect(() => {
    if (sourcesData && Array.isArray(sourcesData)) {
      setSourcesOptions(
        sourcesData.map((sources) => ({
          label: sources.leadSourcesText,
          value: sources._id
        }))
      );
    }
  }, [sourcesData]);

  useEffect(() => {
    if (tagData && Array.isArray(tagData)) {
      setTagsOptions(
        tagData.map((tag) => ({
          label: tag.tagName,
          value: tag._id 
        }))
      );
    }
  }, [tagData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid mobile number');
      return;
    }

    setLoading(true);

    try {
      const AdminId = sessionStorage.getItem("AdminId");
      // Include selected tags in form data
      const dataToSubmit = {
        ...formData,
        tags: selectedTagValues
      };
      
      const response = await axios.post(`${APi_Url}/digicoder/crm/api/v1/lead/add/${AdminId}`, dataToSubmit, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201) {
        toast.success('Lead added successfully!');
        onClose();
        window.location.reload();
      } else {
        toast.error('Failed to add lead');
      }
    } catch (error) {
      console.error('Error adding lead:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to add lead');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      header={title}
      visible={isOpen}
      onHide={onClose}
      className='leadFormOuter'
      footer={
        <footer>
          <Button
            label="Close"
            icon="pi pi-times"
            onClick={onClose}
            className="p-button-text p-button-rounded"
          />
          <Button
            label={buttonTitle}
            icon="pi pi-check"
            onClick={handleSubmit}
            className={`p-button-rounded p-button-success ${loading ? 'p-button-loading' : ''}`}
            loading={loading}
          />
        </footer>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="p-grid p-fluid">
          <div className="p-field p-col-12 p-md-6">
            <label htmlFor="name">Lead Name:</label>
            <InputText
              id="name"
              name="name"
              placeholder="Enter lead name"
              value={formData.name}
              onChange={handleInputChange}
              className="p-inputtext p-component"
            />
          </div>

          <div className="p-field p-col-12 p-md-6">
            <label htmlFor="phone">Lead Phone:</label>
            <InputText
              id="phone"
              name="phone"
              placeholder="Enter lead phone number"
              value={formData.phone}
              onChange={handleInputChange}
              className="p-inputtext p-component"
            />
          </div>

          <div className="p-field p-col-12 p-md-6">
            <label htmlFor="priority">Priority:</label>
            <Dropdown
              id="priority"
              name="priority"
              value={formData.priority}
              options={priorityOptions}
              onChange={handleInputChange}
              optionLabel="label"
              optionValue="value"
              placeholder="Select priority"
              className="p-dropdown p-component"
            />
          </div>

          <div className="p-field p-col-12 p-md-6">
            <label htmlFor="sources">Sources:</label>
            <Dropdown
              id="sources"
              name="sources"
              value={formData.sources}
              options={sourcesOptions}
              onChange={handleInputChange}
              optionLabel="label" 
              optionValue="value" 
              placeholder="Select source"
              className="p-dropdown p-component"
            />
          </div>
          
          <div className="p-field p-col-12 p-md-6">
            <label htmlFor="tags">Tags:</label>
            <MultiSelect
              id="tags"
              value={selectedTagValues}
              options={tagsOptions}
              onChange={(e) => {
                setSelectedTagValues(e.value);
                setSelectAll(false);
              }}
              optionLabel="label"
              optionValue="value"
              filter
              placeholder="Filter by Tags"
              className="p-multiselect p-component"
            />
          </div>
        </div>
      </form>

      <ToastContainer />
    </Dialog>
  );
};

export default LeadForm;