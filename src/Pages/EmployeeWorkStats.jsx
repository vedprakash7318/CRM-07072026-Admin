import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, CircularProgress, Alert, Tabs, Tab,
  Accordion, AccordionSummary, AccordionDetails, IconButton,
  TextField, Button, Stack, Divider, Avatar, LinearProgress,
  Tooltip, Badge, CardHeader
} from '@mui/material';
import html2canvas from 'html2canvas';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  PhoneCallback as FollowupIcon,
  Leaderboard as LeadIcon,
  TrendingUp as TrendingIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Work as WorkIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
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

  const addedBy = sessionStorage.getItem('AdminId');
  const reportRef = React.useRef(null);

  const handleDownloadJPG = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `Employee_Report_${selectedDate}.jpg`;
      link.href = canvas.toDataURL('image/jpeg');
      link.click();
    } catch (err) {
      console.error('Error downloading image', err);
    }
  };

  const handleShareReport = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Employee_Report_${selectedDate}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Employee Work Report - ${selectedDate}`,
            text: 'Here is the employee work statistics report.',
            files: [file]
          });
        } else {
          // Fallback if sharing is not supported
          handleDownloadJPG();
        }
      }, 'image/jpeg');
    } catch (err) {
      console.error('Error sharing report', err);
    }
  };

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

      // Check if the response has the expected structure
      if (response.data.success && response.data.data) {
        setData(response.data.data);
      } else if (response.data.employees) {
        // Fallback for old structure
        setData({
          overall: {
            totalEmployees: response.data.employees.length,
            totalLeadsAdded: response.data.employees.reduce((sum, emp) => sum + emp.leadsAdded, 0),
            totalFollowups: response.data.employees.reduce((sum, emp) => sum + emp.followupsDone, 0),
            totalUniqueLeadsInFollowups: 0
          },
          employees: response.data.employees.map(emp => ({
            ...emp,
            leadsAdded: { count: emp.leadsAdded, details: [] },
            followupsDone: { count: emp.followupsDone, uniqueLeads: 0, details: [] }
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
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading employee statistics...
          </Typography>
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

  return (
    <Dashboard active={'EmployeeWorkStats'}>
      <Box sx={{ p: 3 }} ref={reportRef} id="report-content">
        {/* Header Section */}
        <Card elevation={2} sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent sx={{ pb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Employee Work Statistics
                </Typography>
                <Box display="flex" alignItems="center">
                  <CalendarIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" gap={2} flexWrap="wrap">
                {/* Export Buttons Section */}
                <Card sx={{ minWidth: 200, background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                  <CardContent sx={{ pb: '16px !important', p: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadJPG}
                        sx={{ bgcolor: 'white', color: '#667eea', '&:hover': { bgcolor: '#f0f0f0' } }}
                      >
                        JPG
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<ShareIcon />}
                        onClick={handleShareReport}
                        sx={{ bgcolor: 'white', color: '#764ba2', '&:hover': { bgcolor: '#f0f0f0' } }}
                      >
                        Share
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Date Filter Section */}
                <Card sx={{ minWidth: 300 }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        size="small"
                        sx={{ flexGrow: 1 }}
                        InputProps={{
                          startAdornment: <DateRangeIcon sx={{ mr: 1, color: 'action.active' }} />
                        }}
                      />
                      <Tooltip title="Today">
                        <IconButton onClick={setToday} color="primary">
                          <TodayIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Refresh">
                        <IconButton onClick={handleRefresh} disabled={isRefreshing}>
                          <RefreshIcon className={isRefreshing ? 'spinning' : ''} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Enhanced Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box sx={{ color: 'white' }}>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                      Total Employees
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                      {overall.totalEmployees}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <PersonIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box sx={{ color: 'white' }}>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                      Leads Added
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                      {overall.totalLeadsAdded}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <LeadIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #3742fa 0%, #2f3542 100%)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box sx={{ color: 'white' }}>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                      Followups Done
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                      {overall.totalFollowups}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <FollowupIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box sx={{ color: 'white' }}>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                      Unique Leads
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                      {overall.totalUniqueLeadsInFollowups}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <TrendingIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #ff9a44 0%, #fc6076 100%)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box sx={{ color: 'white' }}>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                      Public Leads Accepted
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                      {overall.totalPublicLeadsAccepted || 0}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <PublicIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Enhanced Tabs */}
        <Paper sx={{ mb: 3 }} elevation={3}>
          <Tabs value={selectedTab} onChange={handleTabChange} centered variant="fullWidth">
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
          // Enhanced Employee Performance View
          <Card elevation={3}>
            <CardHeader
              title="Employee Performance Overview"
              subheader={`Performance data for ${employees.length} employees`}
              avatar={<AssessmentIcon />}
            />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Employee</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Leads Added</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Followups Done</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Unique Leads</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Public Leads Accepted</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Total Work / Target</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Performance</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.employee._id} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
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
          // Enhanced Detailed View with Accordions
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
                  <Grid container >

                    <Grid item xs={12} >
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
                                  {employee.followupsDone.details.length > 10 && (
                                    <TableRow>
                                      <TableCell colSpan={4} align="center" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                        ... and {employee.followupsDone.details.length - 10} more followups
                                      </TableCell>
                                    </TableRow>
                                  )}
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
                    <Grid item xs={12} >
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
    </Dashboard>
  );
};

export default EmployeeWorkStats;