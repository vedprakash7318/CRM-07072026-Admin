import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, CircularProgress, Alert, Tabs, Tab,
  Accordion, AccordionSummary, AccordionDetails, IconButton,
  TextField, Button, Stack, Divider, Avatar, LinearProgress,
  Tooltip, Badge, CardHeader, Dialog, DialogTitle, DialogContent, DialogActions, Skeleton
} from '@mui/material';
import { toJpeg, toBlob } from 'html-to-image';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  PhoneCallback as FollowupIcon,
  Leaderboard as LeadIcon,
  TrendingUp as TrendingIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Work as WorkIcon,
  Today as TodayIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Public as PublicIcon
} from '@mui/icons-material';

import Dashboard from '../Components/Dashboard';

const EmployeeWorkStats = () => {
  const APi_Url = import.meta.env.VITE_API_URL;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailsList, setEmailsList] = useState([]);
  const [scheduleTime, setScheduleTime] = useState('19:00');

  const addedBy = sessionStorage.getItem('AdminId');
  const reportRef = React.useRef(null);

  const handleDownloadJPG = async () => {
    if (!reportRef.current) return;
    try {
      // Expand all accordions before capturing
      const accordionButtons = reportRef.current.querySelectorAll('.MuiAccordionSummary-root');
      accordionButtons.forEach(button => {
        const accordion = button.closest('.MuiAccordion-root');
        if (accordion && !accordion.classList.contains('Mui-expanded')) {
          button.click();
        }
      });

      // Wait for accordions to expand
      await new Promise(resolve => setTimeout(resolve, 500));

      const dataUrl = await toJpeg(reportRef.current, {
        quality: 1,
        backgroundColor: '#f8f9fa',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        pixelRatio: 1,
        skipAutoScale: false
      });
      const link = document.createElement('a');
      link.download = `Employee_Report_${selectedDate}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error downloading image', err);
    }
  };

  const handleShareReport = async () => {
    if (!reportRef.current) return;
    try {
      // Expand all accordions before capturing
      const accordionButtons = reportRef.current.querySelectorAll('.MuiAccordionSummary-root');
      accordionButtons.forEach(button => {
        const accordion = button.closest('.MuiAccordion-root');
        if (accordion && !accordion.classList.contains('Mui-expanded')) {
          button.click();
        }
      });

      // Wait for accordions to expand
      await new Promise(resolve => setTimeout(resolve, 500));

      const blob = await toBlob(reportRef.current, {
        backgroundColor: '#f8f9fa',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        pixelRatio: 1,
        skipAutoScale: false
      });
      if (!blob) return;
      const file = new File([blob], `Employee_Report_${selectedDate}.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Employee Work Report - ${selectedDate}`,
          text: 'Here is the employee work statistics report.',
          files: [file]
        });
      } else {
        handleDownloadJPG();
      }
    } catch (err) {
      console.error('Error sharing report', err);
    }
  };

  useEffect(() => {
    if(addedBy) {
      axios.get(`${APi_Url}/digicoder/crm/api/v1/report-settings/get/${addedBy}`)
        .then(res => {
          if(res.data.success && res.data.settings) {
            setEmailsList(res.data.settings.emails || []);
            setScheduleTime(res.data.settings.scheduleTime || '19:00');
          }
        }).catch(err => console.error("Error fetching report settings:", err));
    }
  }, [addedBy, APi_Url]);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/employee/emp-work`, {
        params: {
          date: selectedDate,
          addedBy: addedBy
        }
      });

      console.log(response);

      if (response.data.success && response.data.data) {
        setData(response.data.data);
      } else if (response.data.employees) {
        setData({
          overall: {
            totalEmployees: response.data.employees.length,
            totalLeadsAdded: response.data.employees.reduce((sum, emp) => sum + emp.leadsAdded, 0),
            totalFollowups: response.data.employees.reduce((sum, emp) => sum + emp.followupsDone, 0),
            totalUniqueLeadsInFollowups: 0,
            totalPublicLeadsAccepted: 0
          },
          employees: response.data.employees.map(emp => ({
            ...emp,
            leadsAdded: { count: emp.leadsAdded, details: [] },
            followupsDone: { count: emp.followupsDone, uniqueLeads: 0, details: [] },
            publicLeadsAccepted: 0
          }))
        });
      } else {
        throw new Error('Invalid response structure');
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch employee work statistics. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleSaveEmailSettings = async () => {
    try {
      await axios.post(`${APi_Url}/digicoder/crm/api/v1/report-settings/update`, {
        adminId: addedBy,
        emails: emailsList,
        scheduleTime
      });
      alert("Email Settings Saved Successfully!");
      setEmailModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    }
  };

  const handleSendUrgent = async () => {
    try {
      const res = await axios.post(`${APi_Url}/digicoder/crm/api/v1/report-settings/send-urgent`, { adminId: addedBy });
      if(res.data.success) alert("Email sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Error sending email");
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleAccordionChange = (employeeId) => (event, isExpanded) => {
    setExpandedEmployee(isExpanded ? employeeId : null);
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const setToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const getPerformanceColor = (totalWork, target = 80) => {
    if (totalWork === 0) return 'default';
    const percentage = (totalWork / target) * 100;
    if (percentage < 30) return 'error';
    if (percentage < 70) return 'warning';
    if (percentage < 100) return 'info';
    return 'success';
  };

  const getPerformanceLabel = (totalWork, target = 80) => {
    if (totalWork === 0) return 'No Activity';
    const percentage = Math.round((totalWork / target) * 100);
    if (percentage < 30) return `Low (${percentage}%)`;
    if (percentage < 70) return `Average (${percentage}%)`;
    if (percentage < 100) return `Good (${percentage}%)`;
    return `Achieved (${percentage}%)`;
  };

  const getProgressValue = (totalWork, target = 80) => {
    return Math.min((totalWork / target) * 100, 100);
  };

  if (loading) {
    return (
      <Dashboard active={'EmployeeWorkStats'}>
        <Box sx={{ p: 3, minWidth: '1200px' }}>
          {/* Header Skeleton */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Box>
              <Skeleton variant="text" width={250} height={50} />
              <Skeleton variant="text" width={180} height={30} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
          
          {/* Summary Cards Skeleton */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[1, 2, 3, 4, 5].map((item) => (
              <Grid item xs={12} sm={6} md={2.4} key={item}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
          
          {/* Table Skeleton */}
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Box>
      </Dashboard>
    );
  }

  if (error) {
    return (
      <Dashboard active={'EmployeeWorkStats'}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Dashboard>
    );
  }

  if (!data) {
    return (
      <Dashboard active={'EmployeeWorkStats'}>
        <Alert severity="info">
          No data available. Please try again later.
        </Alert>
      </Dashboard>
    );
  }

  const { overall, employees } = data;

  // Format date for display
  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const dateDisplay = new Date(selectedDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <Dashboard active={'EmployeeWorkStats'}>
      <Box
        sx={{
          p: 3,
          minWidth: '1200px', // Ensure minimum width
          overflow: 'visible' // Prevent clipping
        }}
        ref={reportRef}
        id="report-content"
      >
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2d3436' }}>
                Welcome Back!
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#636e72', mt: 0.5 }}>
                {formattedDate}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                size="small"
                sx={{
                  bgcolor: 'white',
                  borderRadius: 1,
                  '& .MuiInputBase-root': { height: '32px', fontSize: '14px' }
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={setToday}
                sx={{
                  color: '#2d3436',
                  borderColor: '#b2bec3',
                  '&:hover': { bgcolor: '#f8f9fa', borderColor: '#636e72' },
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1
                }}
              >
                Today
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setEmailModalOpen(true)}
                sx={{
                  color: '#6c5ce7',
                  borderColor: '#6c5ce7',
                  '&:hover': { bgcolor: '#f3f0ff', borderColor: '#5f3dc4' },
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1
                }}
              >
                Setup Auto Email
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleDownloadJPG}
                sx={{
                  bgcolor: '#6c5ce7',
                  color: 'white',
                  '&:hover': { bgcolor: '#5f3dc4' },
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 3,
                  borderRadius: '8px'
                }}
              >
                JPG
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleShareReport}
                sx={{
                  bgcolor: '#00b894',
                  color: 'white',
                  '&:hover': { bgcolor: '#00a381' },
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 3,
                  borderRadius: '8px'
                }}
              >
                SHARE
              </Button>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: '#b2bec3', mt: 0.5 }}>
            {dateDisplay}
          </Typography>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #e8ecf1'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#b2bec3', fontWeight: '500', fontSize: '14px' }}>
                      Total Employees
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2d3436', mt: 0.5 }}>
                      {overall.totalEmployees}
                    </Typography>
                  </Box>
                  <Box sx={{
                    bgcolor: '#e8ecf1',
                    borderRadius: '10px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PersonIcon sx={{ color: '#6c5ce7', fontSize: 28 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #e8ecf1'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#b2bec3', fontWeight: '500', fontSize: '14px' }}>
                      Loads Added
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2d3436', mt: 0.5 }}>
                      {overall.totalLeadsAdded}
                    </Typography>
                  </Box>
                  <Box sx={{
                    bgcolor: '#e8ecf1',
                    borderRadius: '10px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <LeadIcon sx={{ color: '#00b894', fontSize: 28 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #e8ecf1'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#b2bec3', fontWeight: '500', fontSize: '14px' }}>
                      Followups Done
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2d3436', mt: 0.5 }}>
                      {overall.totalFollowups}
                    </Typography>
                  </Box>
                  <Box sx={{
                    bgcolor: '#e8ecf1',
                    borderRadius: '10px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FollowupIcon sx={{ color: '#0984e3', fontSize: 28 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #e8ecf1'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#b2bec3', fontWeight: '500', fontSize: '14px' }}>
                      Unique Leads
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2d3436', mt: 0.5 }}>
                      {overall.totalUniqueLeadsInFollowups}
                    </Typography>
                  </Box>
                  <Box sx={{
                    bgcolor: '#e8ecf1',
                    borderRadius: '10px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TrendingIcon sx={{ color: '#e17055', fontSize: 28 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #e8ecf1'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#b2bec3', fontWeight: '500', fontSize: '14px' }}>
                      Public Leads Accepted
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2d3436', mt: 0.5 }}>
                      {overall.totalPublicLeadsAccepted || 0}
                    </Typography>
                  </Box>
                  <Box sx={{
                    bgcolor: '#e8ecf1',
                    borderRadius: '10px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PublicIcon sx={{ color: '#fd79a8', fontSize: 28 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            centered
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 'bold',
                color: '#b2bec3',
                '&.Mui-selected': {
                  color: '#6c5ce7'
                }
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#6c5ce7'
              }
            }}
          >
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <AssessmentIcon />
                  Employee Performance
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <WorkIcon />
                  Detailed View
                </Box>
              }
            />
          </Tabs>
        </Paper>

        {selectedTab === 0 ? (
          // Employee Performance View
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardHeader
              title="Employee Performance Overview"
              subheader={`Performance data for ${employees.length} employees`}
              avatar={<AssessmentIcon />}
            />
            <TableContainer sx={{ overflow: 'visible' }}>
              <Table sx={{ minWidth: 1200 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 200 }}>Employee</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Leads Added</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Followups Done</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Unique Leads</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Public Leads</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Total Work / Target</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Performance</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.employee._id} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                      <TableCell>
                        <Box style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {employee.employee.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {employee.employee.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {employee.employee.designation}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={employee.leadsAdded.count}
                          color={employee.leadsAdded.count > 0 ? "success" : "default"}
                          variant={employee.leadsAdded.count > 0 ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={employee.followupsDone.count}
                          color={employee.followupsDone.count > 0 ? "info" : "default"}
                          variant={employee.followupsDone.count > 0 ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={employee.followupsDone.uniqueLeads}
                          color={employee.followupsDone.uniqueLeads > 0 ? "primary" : "default"}
                          variant={employee.followupsDone.uniqueLeads > 0 ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={employee.publicLeadsAccepted || 0}
                          color={(employee.publicLeadsAccepted || 0) > 0 ? "secondary" : "default"}
                          variant={(employee.publicLeadsAccepted || 0) > 0 ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {employee.totalWork} / {employee.employee.target || 80}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getPerformanceLabel(employee.totalWork, employee.employee.target)}
                          color={getPerformanceColor(employee.totalWork, employee.employee.target)}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ width: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={getProgressValue(employee.totalWork, employee.employee.target)}
                            color={getPerformanceColor(employee.totalWork, employee.employee.target)}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="textSecondary">
                            {Math.round(getProgressValue(employee.totalWork, employee.employee.target))}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        ) : (
          // Detailed View
          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
              Detailed Employee Activities
            </Typography>
            {employees.map((employee) => (
              <Accordion
                key={employee.employee._id}
                expanded={expandedEmployee === employee.employee._id}
                onChange={handleAccordionChange(employee.employee._id)}
                elevation={3}
                sx={{
                  mb: 2,
                  '&:before': { display: 'none' },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: 'grey.50',
                    '&:hover': { backgroundColor: 'grey.100' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {employee.employee.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">{employee.employee.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {employee.employee.designation} • {employee.employee.email}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                      <Chip
                        label={`${employee.leadsAdded.count} Leads`}
                        size="small"
                        color="success"
                        icon={<LeadIcon />}
                      />
                      <Chip
                        label={`${employee.followupsDone.count} Followups`}
                        size="small"
                        color="info"
                        icon={<FollowupIcon />}
                      />
                      <Chip
                        label={`${employee.publicLeadsAccepted || 0} Public Leads`}
                        size="small"
                        color="secondary"
                        icon={<PublicIcon />}
                      />
                      <Chip
                        label={`${employee.totalWork} / ${employee.employee.target || 80} Work`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Stack>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardHeader
                          title={`Followups Done (${employee.followupsDone.count})`}
                          avatar={<FollowupIcon color="info" />}
                          sx={{ backgroundColor: 'info.50' }}
                        />
                        <CardContent>
                          {employee.followupsDone.details.length > 0 ? (
                            <TableContainer sx={{ maxHeight: 300 }}>
                              <Table size="small" stickyHeader>
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Lead</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {employee.followupsDone.details.map((followup, index) => (
                                    <TableRow key={index} hover>
                                      <TableCell sx={{ fontWeight: 'medium' }}>
                                        {followup.leadId.name}
                                      </TableCell>
                                      <TableCell>{followup.leadId.phone}</TableCell>
                                      <TableCell sx={{ maxWidth: 200 }}>
                                        <Tooltip title={followup.followupMessage}>
                                          <Typography variant="body2" noWrap>
                                            {followup.followupMessage}
                                          </Typography>
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={followup.followupStatus._id ? "Completed" : "Pending"}
                                          size="small"
                                          color={followup.followupStatus._id ? "success" : "warning"}
                                          variant="outlined"
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Box textAlign="center" py={4}>
                              <FollowupIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                              <Typography variant="body2" color="textSecondary">
                                No followups done on this date.
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardHeader
                          title={`Leads Added (${employee.leadsAdded.count})`}
                          avatar={<LeadIcon color="success" />}
                          sx={{ backgroundColor: 'success.50' }}
                        />
                        <CardContent>
                          {employee.leadsAdded.details.length > 0 ? (
                            <TableContainer sx={{ maxHeight: 300 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {employee.leadsAdded.details.map((lead, index) => (
                                    <TableRow key={index} hover>
                                      <TableCell sx={{ fontWeight: 'medium' }}>{lead.name}</TableCell>
                                      <TableCell>{lead.phone}</TableCell>
                                      <TableCell>{lead.email || 'N/A'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Box textAlign="center" py={4}>
                              <LeadIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                              <Typography variant="body2" color="textSecondary">
                                No leads added on this date.
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Box>

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <Dialog open={emailModalOpen} onClose={() => setEmailModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Automated Report Email Settings</DialogTitle>
        <DialogContent dividers>
          <Box mb={3}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Send Time (Daily)</Typography>
            <TextField 
              type="time" 
              value={scheduleTime} 
              onChange={(e) => setScheduleTime(e.target.value)}
              size="small"
              fullWidth 
            />
          </Box>
          <Box mb={2}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Recipient Emails</Typography>
            <Box display="flex" gap={1} mb={2}>
              <TextField 
                placeholder="Enter email..." 
                value={emailInput} 
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && emailInput.includes('@')) {
                    if(!emailsList.includes(emailInput)) setEmailsList([...emailsList, emailInput]);
                    setEmailInput('');
                  }
                }}
                size="small"
                fullWidth 
              />
              <Button 
                variant="contained" 
                onClick={() => {
                  if(emailInput.includes('@') && !emailsList.includes(emailInput)) {
                    setEmailsList([...emailsList, emailInput]);
                    setEmailInput('');
                  }
                }}
                sx={{ bgcolor: '#0984e3' }}
              >Add</Button>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              {emailsList.map((email, idx) => (
                <Chip 
                  key={idx} 
                  label={email} 
                  onDelete={() => setEmailsList(emailsList.filter(e => e !== email))} 
                  color="primary" 
                  variant="outlined" 
                />
              ))}
            </Box>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Need the report right now?</Typography>
            <Button variant="outlined" color="warning" onClick={handleSendUrgent}>Send Urgent Now</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailModalOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveEmailSettings} variant="contained" sx={{ bgcolor: '#6c5ce7' }}>Save Settings</Button>
        </DialogActions>
      </Dialog>
    </Dashboard>
  );
};

export default EmployeeWorkStats;