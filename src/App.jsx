import { useEffect, useState } from 'react'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom'
import AdminDashboard from './Pages/AdminDashboard'
import EmployeeReport from './Pages/EmployeeReport';
import AssignedLead from './Pages/AssignedLeads';
import UnassignedLead from './Pages/UnassignedLeads'
import Enquiries from './Pages/Enquiries';
import Employee from './Pages/Employee'
import Login from './Components/Login'
import Leads from './Pages/Leads'
import DynamicCard from './Components/DynamicCard';
import Priority from './Pages/Settings/Priority'
import LeadStatus from './Pages/Settings/LeadStatus'
import Source from './Pages/Settings/Sources'
import Tag from './Pages/Settings/Tag'
import FullLeads from './Pages/FullLeads'
import Profile from './Pages/Profile'
import EmployeeCardView from './Pages/EmployeeCardView'
import EmployeesFullPage from './Pages/EmployeesFullPage';
import ExportNumbers from './Pages/ExportNumbers';

import PasswordResetPage from './Components/PasswordResetPage';
import DateWiseTable from './Pages/DateWiseTable';
import Searching from './Pages/Searching';
import EmployeeWorkStats from './Pages/EmployeeWorkStats';
import Services from './Pages/Settings/Services';
import AdminTagRequests from './Pages/AdminTagRequests';
import LeadRequests from './Pages/LeadRequests';
import SendNotification from './Pages/SendNotification';
import TagParent from './Pages/Settings/TagParent';
import ExcelLeadsAdmin from './Pages/ExcelLeadsAdmin';
import FullExcelLeads from './Pages/FullExcelLeads';

function App() {


  return (
    <>
      <Router>
        <Routes>
          <Route path='/' element={<Login/>}/>
          <Route path='/dashboard' element={<AdminDashboard/>}/>
          <Route path="/employee-report" element={<EmployeeReport/>}/>
          <Route path='/forget-password' element={<PasswordResetPage/>}/>
          <Route path='/leads' element={<Leads/>}/>
          <Route path='/assignedLeads' element={<AssignedLead/>}/>
          <Route path='/unassignedLeads' element={<UnassignedLead/>}/>
          <Route path='/employee' element={<Employee/>}/>
          <Route  path='/profile' element={<Profile/>}/>
          <Route  path='/exportNumbers' element={<ExportNumbers/>}/>
          <Route  path='/employee/work-stats' element={<EmployeeWorkStats/>}/>
          <Route path='/employee/export/:startDate/:endDate' element={<DateWiseTable/>} />
          <Route  path='/employee/employeefullpage' element={<EmployeesFullPage/>}/>
          <Route path='/dateWiseFilter' element={<DateWiseTable/>}/>
          <Route path='/card' element={<DynamicCard/>}/>
          <Route path='/cardd' element={<EmployeeCardView/>}/>
          <Route path='/search' element={<Searching/>}/>
          <Route path='/emp-work' element={<EmployeeWorkStats/>}/>
          <Route path='/notifications' element={<SendNotification/>}/>

          <Route  path='/priority' element={<Priority/>}/>
          <Route  path='/source' element={<Source/>}/>
          <Route  path='/tag' element={<Tag/>}/>
          <Route  path='/status' element={<LeadStatus/>}/>
          <Route  path='/services' element={<Services/>}/>
          <Route  path='/tag-parent' element={<TagParent/>}/>


          <Route  path='/fullLeads' element={<FullLeads/>}/>
          <Route  path='/fullExcelLeads' element={<FullExcelLeads/>}/>

          <Route  path='/request' element={<AdminTagRequests/>}/>
          <Route  path='/lead-requests' element={<LeadRequests/>}/>
          
          <Route path='/enquiries' element={<Enquiries />} />
          <Route path='/excel-leads-admin' element={<ExcelLeadsAdmin />} />
          
        </Routes>
      </Router>      
    </>
  )
}

export default App
