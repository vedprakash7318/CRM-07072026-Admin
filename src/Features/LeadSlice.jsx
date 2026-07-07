// src/store/leadsSlice.js
import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const leadsSlice = createSlice({
  name: 'leads',
  initialState: {
    Priority: [],
    Services:[],
    LeadStatus: null,
    Employee: null,
    leadSources: [],
    tag: [],
    loading: false,
    error: null,
  },

  reducers: {
    setPriority: (state, action) => {
      state.Priority = action.payload;
    },
    setServices: (state, action) => {
      state.Services = action.payload;
    },
    setTags: (state, action) => {
      state.tag = action.payload;
    },
    setLeadStatus: (state, action) => {
      state.LeadStatus = action.payload;
    },
    setEmployee: (state, action) => {
      state.Employee = action.payload;
    },
    setLeadSources: (state, action) => {
      state.leadSources = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setPriority,
  setServices,
  setTags,
  setLeadStatus,
  setEmployee,
  setLeadSources,
  setLoading,
  setError,
} = leadsSlice.actions;

export const fetchTags = () => async (dispatch) => {
  try {
    const APi_Url = import.meta.env.VITE_API_URL;
    const AdminId = sessionStorage.getItem('AdminId');
    const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/tags/getall/${AdminId}`);
    dispatch(setTags(response.data.tags));
  } catch (error) {
    console.error('Error fetching tags:', error);
  }
};

export const fetchPriority = () => async (dispatch) => {
  try {
    const APi_Url = import.meta.env.VITE_API_URL;
    const AdminId = sessionStorage.getItem('AdminId');
    const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/priority/get/${AdminId}`);
    dispatch(setPriority(response.data.priorities));
  } catch (error) {
    console.error('Error fetching priority data:', error);
  }
};

export const fetchServices = () => async (dispatch) => {
  try {
    const APi_Url = import.meta.env.VITE_API_URL;
    const AdminId = sessionStorage.getItem('AdminId');
    const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/service/get/${AdminId}`);
    dispatch(setServices(response.data.services));
  } catch (error) {
    console.error('Error fetching Services data:', error);
  }
};

export const fetchLeadStatus = () => async (dispatch) => {
  try {
    const APi_Url = import.meta.env.VITE_API_URL;
    const AdminId = sessionStorage.getItem('AdminId');
    const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/leadstatus/getall/${AdminId}`);
    dispatch(setLeadStatus(response.data.leadStatus));
  } catch (error) {
    console.error('Error fetching lead status data:', error);
  }
};

export const fetchEmployee = () => async (dispatch) => {
  try {
    const APi_Url = import.meta.env.VITE_API_URL;
    const AdminId = sessionStorage.getItem('AdminId');
    const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/employee/getall/${AdminId}?nopage=true`);
    dispatch(setEmployee(response.data.employees));
  } catch (error) {
    console.error('Error fetching employee data:', error);
  }
};

export const fetchSources = () => async (dispatch) => {
  try {
    const APi_Url = import.meta.env.VITE_API_URL;
    const AdminId = sessionStorage.getItem('AdminId');
    const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/leadSources/getall/${AdminId}`);
    dispatch(setLeadSources(response.data.leadSources));
  } catch (error) {
    console.error('Error fetching lead sources:', error);
  }
};

// Global fetch-all thunk for full-page loader
export const fetchAllLeadData = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const APi_Url = import.meta.env.VITE_API_URL;
    const AdminId = sessionStorage.getItem('AdminId');

    const [
      leads,
      tags,
      priority,
      leadStatus,
      employee,
      sources,
    ] = await Promise.all([
      axios.get(`${APi_Url}/digicoder/crm/api/v1/tags/getall/${AdminId}`),
      axios.get(`${APi_Url}/digicoder/crm/api/v1/priority/get/${AdminId}`),
      axios.get(`${APi_Url}/digicoder/crm/api/v1/leadstatus/getall/${AdminId}`),
      axios.get(`${APi_Url}/digicoder/crm/api/v1/employee/getall/${AdminId}`),
      axios.get(`${APi_Url}/digicoder/crm/api/v1/leadSources/getall/${AdminId}`),
    ]);

    dispatch(setTags(tags.data.tags));
    dispatch(setPriority(priority.data.priorities));
    dispatch(setLeadStatus(leadStatus.data.leadStatus));
    dispatch(setEmployee(employee.data.employees));
    dispatch(setLeadSources(sources.data.leadSources));
  } catch (error) {
    dispatch(setError(error.message));
    console.error('Error in fetchAllLeadData:', error);
  } finally {
    dispatch(setLoading(false));
  }
};

export default leadsSlice.reducer;
