import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { format } from 'date-fns';
import { Skeleton } from 'primereact/skeleton';
import Dashboard from '../Components/Dashboard';

const EmployeeReport = () => {
    const APi_Url = import.meta.env.VITE_API_URL;
    const [dates, setDates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [globalStats, setGlobalStats] = useState({});
    const [employeeStats, setEmployeeStats] = useState([]);
    const [trendStats, setTrendStats] = useState([]);
    const [dailyReports, setDailyReports] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('All');
    const token = sessionStorage.getItem('token');
    const AdminId = sessionStorage.getItem('AdminId');

    const [drilldownData, setDrilldownData] = useState([]);
    const [drilldownLoading, setDrilldownLoading] = useState(false);
    const [drilldownTitle, setDrilldownTitle] = useState('');
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
    const [apiStatuses, setApiStatuses] = useState([]);

    const [registrationData, setRegistrationData] = useState([]);
    const [registrationLoading, setRegistrationLoading] = useState(false);

    useEffect(() => {
        const fetchStatuses = async () => {
            if (!AdminId) return;
            try {
                const res = await axios.get(`${APi_Url}/digicoder/crm/api/v1/leadstatus/getall/${AdminId}`);
                if (res.data.success && res.data.leadStatus) {
                    setApiStatuses(res.data.leadStatus.map(s => s.leadStatusText));
                }
            } catch (error) {
                console.error("Error fetching statuses", error);
            }
        };
        fetchStatuses();
    }, [AdminId, APi_Url]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let url = `${APi_Url}/digicoder/crm/api/v1/lead/employee-report`;
            const params = new URLSearchParams();
            params.append('adminId', AdminId);
            if (dates && dates[0]) {
                const endDate = dates[1] || dates[0];
                params.append('startDate', dates[0].toISOString());
                params.append('endDate', endDate.toISOString());
            }
            if (selectedEmployee && selectedEmployee !== 'All') {
                params.append('empId', selectedEmployee);
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            const res = await axios.get(url);
            if (res.data.success) {
                setGlobalStats(res.data.globalStats);
                setEmployeeStats(res.data.employeeStats);
                setTrendStats(res.data.trendStats);
            }

            const dailyRes = await axios.get(`${APi_Url}/digicoder/crm/api/v1/daily-report/get-reports?${params.toString()}`);
            if (dailyRes.data.success) {
                setDailyReports(dailyRes.data.data);
            }

        } catch (error) {
            console.error("Error fetching report data", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await axios.get(`${APi_Url}/digicoder/crm/api/v1/employee/getall/${AdminId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    const empOptions = [{ label: 'All Employees', value: 'All', target: 0 }];
                    res.data.employees.forEach(emp => {
                        empOptions.push({ label: emp.empName, value: emp._id, target: emp.target || 80 });
                    });
                    setEmployees(empOptions);
                }
            } catch (error) {
                console.error("Error fetching employees", error);
            }
        };
        fetchEmployees();
    }, [AdminId, token, APi_Url]);

    useEffect(() => {
        fetchReport();
    }, [dates, selectedEmployee]);

    useEffect(() => {
        const fetchRegistrationData = async () => {
            setRegistrationLoading(true);
            try {
                const res = await axios.get('https://erpapi.thedigicoders.com/api/hr/registrations-summary?email=digicodersdevelopement@gmail.com');
                if (res.data.success) {
                    setRegistrationData(res.data.data);
                }
            } catch (error) {
                console.error("Error fetching registration data", error);
            }
            setRegistrationLoading(false);
        };
        fetchRegistrationData();
    }, []);

    const downloadCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Employee Name,Total Assigned,Pending,Missed,Upcoming Followups,Today's Followups,Reminder,Closed,Negative,Conversion %\n";
        employeeStats.forEach(emp => {
            const conversion = emp.totalAssigned > 0 ? ((emp.Closed / emp.totalAssigned) * 100).toFixed(2) : 0;
            csvContent += `${emp.empName},${emp.totalAssigned},${emp.Pending},${emp.Missed},${emp.Followups},${emp.TodaysFollowups},${emp.Reminder},${emp.Closed},${emp.Negative},${conversion}%\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Employee_Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getDonutOptions = () => ({
        chart: { type: 'pie', height: 250 },
        title: { text: null },
        tooltip: { pointFormat: '{series.name}: <b>{point.y}</b>' },
        plotOptions: {
            pie: {
                innerSize: '60%',
                dataLabels: { enabled: false },
                showInLegend: true
            }
        },
        legend: { align: 'right', verticalAlign: 'middle', layout: 'vertical' },
        series: [{
            name: 'Leads',
            colors: ['#FFA726', '#EF5350', '#42A5F5', '#AB47BC', '#66BB6A', '#78909C'],
            data: [
                ['Pending', globalStats.Pending || 0],
                ['Missed', globalStats.Missed || 0],
                ["Today's Followups", globalStats.TodaysFollowups || 0],
                ['Reminder', globalStats.Reminder || 0],
                ['Closed', globalStats.Closed || 0],
                ['Negative', globalStats.Negative || 0]
            ]
        }],
        credits: { enabled: false }
    });

    const getTargetOptions = () => {
        let totalDailyTarget = 0;
        if (selectedEmployee === 'All') {
            totalDailyTarget = employees.reduce((acc, emp) => acc + (emp.target || 0), 0);
        } else {
            const selectedEmpData = employees.find(e => e.value === selectedEmployee);
            totalDailyTarget = selectedEmpData?.target || 80;
        }

        let days = 1;
        if (dates && dates[0]) {
            const startDate = new Date(dates[0]);
            const endDate = dates[1] ? new Date(dates[1]) : new Date(dates[0]);
            const diffTime = Math.abs(endDate - startDate);
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        const totalTarget = totalDailyTarget * days;

        const achieved = globalStats.TodaysFollowups || 0;
        const remainingTarget = Math.max(0, totalTarget - achieved);
        const percentage = totalTarget > 0 ? Math.round((achieved / totalTarget) * 100) : 0;

        return {
            chart: { type: 'pie', height: 250 },
            title: {
                text: `${percentage}%<br/><span style="font-size:12px;color:#6c757d;font-weight:normal">Achieved</span>`,
                align: 'center',
                verticalAlign: 'middle',
                y: 10,
                style: { fontSize: '24px', fontWeight: 'bold', color: '#66BB6A' }
            },
            tooltip: { pointFormat: '{series.name}: <b>{point.y}</b>' },
            plotOptions: {
                pie: {
                    innerSize: '80%',
                    dataLabels: { enabled: false },
                    showInLegend: true,
                    borderWidth: 0
                }
            },
            legend: { align: 'center', verticalAlign: 'bottom', layout: 'horizontal' },
            series: [{
                name: 'Leads',
                colors: ['#66BB6A', '#f1f3f5'],
                data: [
                    ['Target Achieved', achieved],
                    ['Remaining Target', remainingTarget]
                ]
            }],
            credits: { enabled: false }
        };
    };

    const getLineOptions = () => ({
        chart: { type: 'column', height: 250 },
        title: { text: null },
        xAxis: {
            categories: trendStats.map(t => format(new Date(t._id), 'dd MMM')),
            crosshair: true
        },
        yAxis: [
            {
                title: { text: 'Daily Followups', style: { color: '#42A5F5' } },
                labels: { style: { color: '#42A5F5' } },
                min: 0
            },
            {
                title: { text: 'Missed / Closed Leads', style: { color: '#6c757d' } },
                labels: { style: { color: '#6c757d' } },
                opposite: true,
                min: 0
            }
        ],
        tooltip: { shared: true },
        plotOptions: {
            column: {
                borderRadius: 2,
                pointPadding: 0.1,
                groupPadding: 0.1,
                cursor: 'pointer',
                events: {
                    click: function (e) {
                        handleChartClick(e.point.category, e.point.series.name);
                    }
                }
            },
            series: {
                events: {
                    click: function (e) {
                        // handled at column level
                    }
                }
            }
        },
        series: [
            { name: 'Daily Followups', data: trendStats.map(t => t.ActionFollowups || 0), color: '#42A5F5', yAxis: 0 },
            { name: 'Missed Leads', data: trendStats.map(t => t.Missed || 0), color: '#EF5350', yAxis: 1 },
            { name: 'Closed Leads', data: trendStats.map(t => t.Closed || 0), color: '#66BB6A', yAxis: 1 }
        ],
        credits: { enabled: false }
    });

    const topPerformer = [...employeeStats].sort((a, b) => b.Closed - a.Closed)[0];
    const totalEmployees = employeeStats.length;
    const overallConversion = globalStats.TotalAssigned > 0
        ? ((globalStats.Closed / globalStats.TotalAssigned) * 100).toFixed(2)
        : 0;

    const conversionBodyTemplate = (rowData) => {
        const conversion = rowData.totalAssigned > 0
            ? ((rowData.Closed / rowData.totalAssigned) * 100).toFixed(2)
            : 0;
        return <span>{conversion}%</span>;
    };

    const srNoBodyTemplate = (rowData, options) => {
        return options.rowIndex + 1;
    };

    const statusBodyTemplate = (rowData) => {
        const statusStr = rowData.status ? rowData.status.replace(/_/g, ' ') : 'Pending';
        const lowerStatus = statusStr.toLowerCase();

        let bg = '#eff6ff'; // default light blue
        let color = '#3b82f6';

        // Only "Interested" gets green
        if (lowerStatus.includes('interested') && !lowerStatus.includes('not')) {
            bg = '#ecfdf5'; // pastel green
            color = '#10b981';
        } else if (lowerStatus.includes('pending') || lowerStatus.includes('busy') || lowerStatus.includes('new') || lowerStatus.includes('wait') || lowerStatus.includes('not incoming')) {
            bg = '#fffbeb'; // pastel orange/yellow
            color = '#f59e0b';
        } else if (lowerStatus.includes('not') || lowerStatus.includes('reject') || lowerStatus.includes('negative') || lowerStatus.includes('fail') || lowerStatus.includes('closed')) {
            bg = '#fef2f2'; // pastel red
            color = '#ef4444';
        }

        return (
            <span style={{
                backgroundColor: bg,
                color: color,
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                display: 'inline-block',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap'
            }}>
                {statusStr}
            </span>
        );
    };

    const handleChartClick = async (targetDate, category) => {
        setDrilldownTitle(`${category} on ${targetDate}`);
        setDrilldownLoading(true);
        try {
            // Target date in dd MMM format needs parsing or passing to backend
            const originalDateObj = trendStats.find(t => format(new Date(t._id), 'dd MMM') === targetDate);
            if (!originalDateObj) {
                setDrilldownLoading(false);
                return;
            }

            // Reset status filter when opening a new drilldown
            setSelectedStatusFilter('All');

            const res = await axios.get(`${APi_Url}/digicoder/crm/api/v1/lead/employee-report-details`, {
                params: {
                    empId: selectedEmployee,
                    targetDate: originalDateObj._id,
                    category: category
                }
            });

            if (res.data.success) {
                setDrilldownData(res.data.data);
            } else {
                setDrilldownData([]);
            }
        } catch (error) {
            console.error("Error fetching drilldown data", error);
            setDrilldownData([]);
        }
        setDrilldownLoading(false);
    };

    useEffect(() => {
        if (trendStats && trendStats.length > 0) {
            const latestDateObj = trendStats[trendStats.length - 1];
            const targetDateStr = format(new Date(latestDateObj._id), 'dd MMM');
            // Auto-load latest day's followups
            handleChartClick(targetDateStr, 'Daily Followups');
        }
    }, [trendStats]);

    const statusOptions = ['All', ...new Set([
        ...apiStatuses,
        ...drilldownData.map(d => d.status ? d.status.replace(/_/g, ' ') : 'Pending')
    ])].map(s => ({ label: s, value: s }));
    const filteredDrilldownData = selectedStatusFilter === 'All'
        ? drilldownData
        : drilldownData.filter(d => (d.status ? d.status.replace(/_/g, ' ') : 'Pending') === selectedStatusFilter);

    return (
        <Dashboard>
            <style>
                {`
                .premium-stat-card {
                    transition: all 0.3s ease;
                    background: #ffffff;
                }
                .premium-stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important;
                }
                .premium-chart-card {
                    transition: all 0.3s ease;
                }
                .premium-chart-card:hover {
                    box-shadow: 0 8px 24px rgba(0,0,0,0.06) !important;
                }
                .hide-scrollbar .p-datatable-wrapper::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar .p-datatable-wrapper {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                
                /* Custom Premium Table Styling for all tables on the page */
                .employee-report-container .p-datatable-tbody > tr > td {
                    font-size: 0.85rem !important;
                    color: #4b5563;
                    border: none !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                    padding: 0.85rem 0.75rem !important;
                    transition: all 0.2s ease;
                }
                .employee-report-container .p-datatable-thead > tr > th {
                    font-size: 0.85rem !important;
                    font-weight: 600;
                    color: #374151;
                    text-transform: capitalize;
                    background-color: #ffffff !important;
                    border: none !important;
                    border-bottom: 2px solid #e5e7eb !important;
                    padding: 0.85rem 0.75rem !important;
                }
                
                /* Striped rows matching screenshot (light blue on odd rows) */
                .employee-report-container .p-datatable-striped .p-datatable-tbody > tr:nth-child(odd) {
                    background-color: #f4f8fc !important;
                }
                .employee-report-container .p-datatable-striped .p-datatable-tbody > tr:nth-child(even) {
                    background-color: #ffffff !important;
                }
                
                /* Hover effect */
                .employee-report-container .p-datatable-tbody > tr:hover {
                    background-color: #e6f0fa !important;
                }
                `}
            </style>
            <div className="employee-report-container p-4" style={{ position: 'relative', backgroundColor: '#F8F9FA', minHeight: '100vh', paddingBottom: '20px' }}>

                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                    <div>
                        <h2 style={{ fontWeight: 'bold', margin: 0, color: '#2c3e50' }}>Employee Report</h2>
                        <p style={{ color: '#6c757d', margin: 0 }}>Overview of employee performance and lead status</p>
                    </div>
                    <div className="d-flex flex-wrap gap-3 align-items-center mt-3 mt-md-0">
                        <div className="flex-grow-1" style={{ minWidth: '200px', maxWidth: '300px' }}>
                            <Dropdown
                                value={selectedEmployee}
                                options={employees}
                                onChange={(e) => setSelectedEmployee(e.value)}
                                placeholder="Select an Employee"
                                className="w-100"
                                filter
                            />
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: '250px', maxWidth: '300px' }}>
                            <div className="d-flex w-100">
                                <Calendar
                                    value={dates}
                                    onChange={(e) => setDates(e.value)}
                                    selectionMode="range"
                                    readOnlyInput
                                    hideOnRangeSelection
                                    placeholder="Select Date Range"
                                    dateFormat="dd/mm/yy"
                                    className="w-100"
                                />
                            </div>
                        </div>
                        {(dates || selectedEmployee !== 'All') && (
                            <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => { setDates(null); setSelectedEmployee('All'); }} title="Clear All Filters">
                                <i className="pi pi-filter-slash"></i> Clear Filters
                            </button>
                        )}
                        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={downloadCSV}>
                            <i className="pi pi-download"></i> Export Report
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="mt-4">
                        <div className="row mb-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="col">
                                    <Skeleton width="100%" height="150px" borderRadius="16px" className="shadow-sm"></Skeleton>
                                </div>
                            ))}
                        </div>
                        <div className="row mb-4">
                            <div className="col-12 col-md-6 mb-3">
                                <Skeleton width="100%" height="300px" borderRadius="16px" className="shadow-sm"></Skeleton>
                            </div>
                            <div className="col-12 col-md-6 mb-3">
                                <Skeleton width="100%" height="300px" borderRadius="16px" className="shadow-sm"></Skeleton>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Skeleton width="100%" height="40px" className="mb-2" borderRadius="8px"></Skeleton>
                            <Skeleton width="100%" height="300px" borderRadius="16px" className="shadow-sm"></Skeleton>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Top Stat Cards */}
                        <div className="row mb-4">
                            <StatCard title="Total Assigned Lead" value={globalStats.TotalAssigned || 0} icon="pi-users" color="#42A5F5" />
                            <StatCard title="Pending Lead" value={globalStats.Pending || 0} icon="pi-hourglass" color="#FFA726" />
                            <StatCard title="Missed Lead" value={globalStats.Missed || 0} icon="pi-times-circle" color="#EF5350" />
                            <StatCard title="Followups Taken" value={globalStats.TodaysFollowups || 0} subtitle={
                                dates && dates[0] ? (
                                    dates[1] && dates[0].getTime() !== dates[1].getTime() ?
                                        `${format(dates[0], 'dd MMM yyyy')} - ${format(dates[1], 'dd MMM yyyy')}` :
                                        format(dates[0], 'dd MMM yyyy')
                                ) : format(new Date(), 'dd MMM yyyy')
                            } icon="pi-phone" color="#42A5F5" />
                            <StatCard title="Reminder" value={globalStats.Reminder || 0} icon="pi-bell" color="#AB47BC" />
                            <StatCard title="Closed" value={globalStats.Closed || 0} icon="pi-check-circle" color="#66BB6A" />
                            <StatCard title="Negative" value={globalStats.Negative || 0} icon="pi-thumbs-down" color="#78909C" />
                        </div>

                        {/* Middle Charts Section */}
                        <div className="row mb-4 g-4">
                            <div className="col-lg-6 col-md-12">
                                <div className="card shadow-sm border-0 h-100 p-4 premium-chart-card rounded-4">
                                    <h6 className="mb-3 font-weight-bold" style={{ color: '#495057' }}>Lead Status Overview</h6>
                                    <div className="d-flex justify-content-center align-items-center" style={{ height: '250px' }}>
                                        <HighchartsReact highcharts={Highcharts} options={getDonutOptions()} />
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6 col-md-12">
                                <div className="card shadow-sm border-0 h-100 p-4 premium-chart-card rounded-4">
                                    <h6 className="mb-3 font-weight-bold" style={{ color: '#495057' }}>Target Achievement</h6>
                                    <div className="d-flex justify-content-center align-items-center" style={{ height: '250px' }}>
                                        <HighchartsReact highcharts={Highcharts} options={getTargetOptions()} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row mb-4 g-3">
                            <div className="col-12">
                                <div className="card shadow-sm border-0 p-3 rounded-4">
                                    <h6 className="mb-3 font-weight-bold">
                                        {dates && dates[0] ? 'Lead Trend (Selected Dates)' : `Lead Trend (Last ${trendStats.length || 7} Days)`}
                                    </h6>
                                    <div style={{ height: '300px' }}>
                                        <HighchartsReact highcharts={Highcharts} options={getLineOptions()} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inline Drilldown Table */}
                        {drilldownTitle && (
                            <div className="mb-5 mt-2">
                                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap px-2 gap-3">
                                    <h5 className="font-weight-bold text-dark m-0" style={{ letterSpacing: '0.5px' }}>
                                        <i className="pi pi-list me-2" style={{ color: '#42A5F5' }}></i>
                                        Details for {drilldownTitle}
                                    </h5>
                                    <div className="d-flex align-items-center gap-2 flex-nowrap">
                                        <Dropdown
                                            value={selectedStatusFilter}
                                            options={statusOptions}
                                            onChange={(e) => setSelectedStatusFilter(e.value)}
                                            placeholder="Status"
                                            className="shadow-sm border-0"
                                            style={{ width: '140px', borderRadius: '8px' }}
                                        />
                                        <span className="p-input-icon-left">
                                            <i className="pi pi-search" style={{ left: '0.75rem', marginTop: '-0.5rem' }} />
                                            <InputText
                                                value={globalFilterValue}
                                                onChange={(e) => setGlobalFilterValue(e.target.value)}
                                                placeholder="Search..."
                                                className="shadow-sm border-0"
                                                style={{ width: '200px', borderRadius: '8px', paddingLeft: '2.5rem' }}
                                            />
                                        </span>
                                    </div>
                                </div>
                                <DataTable value={filteredDrilldownData} loading={drilldownLoading} responsiveLayout="scroll" showGridlines={false} size="small" stripedRows
                                    paginator rows={20} className="p-datatable-sm shadow-sm border-0 rounded-4 hide-scrollbar"
                                    globalFilter={globalFilterValue} globalFilterFields={['name', 'phone', 'followedBy']}
                                    style={{ backgroundColor: '#ffffff', overflow: 'hidden' }}>
                                    <Column header="Sr. No." body={srNoBodyTemplate} style={{ minWidth: '70px' }}></Column>
                                    <Column field="name" header="Name" style={{ minWidth: '150px' }} sortable></Column>
                                    <Column field="phone" header="Phone" style={{ minWidth: '120px' }} sortable></Column>
                                    <Column field="service" header="Service" style={{ minWidth: '150px' }} sortable></Column>
                                    <Column field="status" header="Status" body={statusBodyTemplate} style={{ minWidth: '150px' }} sortable></Column>
                                    <Column field="message" header="Latest Followup Message" style={{ minWidth: '300px' }} sortable></Column>
                                    <Column field="lastFollowupDate" header="Last Followup" body={(rowData) => rowData.lastFollowupDate ? format(new Date(rowData.lastFollowupDate), 'dd MMM yyyy, hh:mm a') : 'N/A'} style={{ minWidth: '180px' }} sortable></Column>
                                    <Column field="nextFollowupDate" header="Next Followup" body={(rowData) => rowData.nextFollowupDate ? format(new Date(rowData.nextFollowupDate), 'dd MMM yyyy, hh:mm a') : 'N/A'} style={{ minWidth: '180px' }} sortable></Column>
                                    <Column field="followedBy" header="Followed By" style={{ minWidth: '150px' }} sortable></Column>
                                </DataTable>
                            </div>
                        )}



                        {/* Daily Performance Snapshot Section */}
                        <div className="mt-5">
                            <h5 className="mb-4 font-weight-bold">Daily Performance Snapshots (6:59 PM)</h5>
                            <div className="card shadow-sm border-0 p-3 rounded-4">
                                <DataTable value={dailyReports} responsiveLayout="scroll" showGridlines={false} size="small" stripedRows className="p-datatable-sm" paginator rows={20}>
                                    <Column header="Date" body={(rowData) => rowData.displayDate || (rowData.reportDate ? format(new Date(rowData.reportDate), 'dd MMM yyyy') : '')} sortable field="reportDate"></Column>
                                    <Column header="Employee" body={(rowData) => rowData.employeeId?.empName || rowData.empName} sortable field="employeeId.empName"></Column>
                                    <Column field="followups" header="Followups Taken" sortable></Column>
                                    <Column field="reminders" header="Reminders Set" sortable></Column>
                                    <Column field="missedLeads" header="Missed Leads" sortable body={(rowData) => <span className="text-danger">{rowData.missedLeads}</span>}></Column>
                                    <Column field="closedLeads" header="Closed" sortable body={(rowData) => <span className="text-success">{rowData.closedLeads}</span>}></Column>
                                    <Column field="negativeLeads" header="Negative" sortable></Column>
                                </DataTable>
                            </div>
                        </div>

                        {/* HR Registrations Summary Section */}
                        <div className="mt-5">
                            <h5 className="mb-4 font-weight-bold">HR Registrations Summary</h5>
                            {registrationLoading ? (
                                <div className="text-center py-5">
                                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#42A5F5' }}></i>
                                </div>
                            ) : (
                                <div className="row g-4">
                                    {registrationData.map((data, index) => (
                                        <div key={index} className="col-xl-3 col-lg-3 col-md-4 col-sm-6">
                                            <div className="card shadow-sm border-0 text-center p-4 h-100 rounded-4 premium-stat-card" style={{ borderBottom: '4px solid #42A5F5', transition: 'transform 0.2s ease-in-out' }}>
                                                <div className="d-flex justify-content-center mb-3">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ backgroundColor: '#42A5F5', width: '48px', height: '48px', boxShadow: '0 4px 10px rgba(66, 165, 245, 0.4)' }}>
                                                        <i className="pi pi-user" style={{ fontSize: '1.4rem' }}></i>
                                                    </div>
                                                </div>
                                                <h6 className="text-muted small mb-2 font-weight-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>{data.name}</h6>
                                                <h3 className="font-weight-bold mb-0" style={{ color: '#2c3e50' }}>{data.totalCount}</h3>
                                                <small className="text-muted mt-2" style={{ fontWeight: '500' }}>Total Registrations</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

            </div>
        </Dashboard>
    );
};

const StatCard = ({ title, value, subtitle, icon, color }) => {
    return (
        <div className="col">
            <div className="card shadow-sm border-0 text-center p-3 h-100 premium-stat-card rounded-4" style={{ borderBottom: `4px solid ${color}` }}>
                <div className="d-flex justify-content-center mb-3 mt-2">
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ backgroundColor: color, width: '48px', height: '48px', boxShadow: `0 4px 10px ${color}40` }}>
                        <i className={`pi ${icon}`} style={{ fontSize: '1.4rem' }}></i>
                    </div>
                </div>
                <h6 className="text-muted small mb-1 font-weight-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>{title}</h6>
                <h3 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>{value}</h3>
                {subtitle && <small className="text-muted" style={{ fontWeight: '500' }}>{subtitle}</small>}
            </div>
        </div>
    );
};

export default EmployeeReport;
