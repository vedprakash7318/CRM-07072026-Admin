import { configureStore } from '@reduxjs/toolkit';
import leadsReducer from '../Features/LeadSlice';

const store = configureStore({
  reducer: {
    leads: leadsReducer,
  },
});

export default store;
