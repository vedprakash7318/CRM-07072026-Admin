import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MultiSelect } from 'primereact/multiselect';
import { Paginator } from 'primereact/paginator';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import Dashboard from '../Components/Dashboard';

const ExportNumbers = () => {
  const [leads, setLeads] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [limit] = useState(500);
  const APi_Url = import.meta.env.VITE_API_URL;
  const AdminId = sessionStorage.getItem('AdminId');

  const fetchTags = async () => {
    try {
      const res = await axios.get(`${APi_Url}/digicoder/crm/api/v1/tags/getall/${AdminId}`);
      setTags(res.data.tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit,
        tags: selectedTags.map(tag => tag._id).join(','),
      };
      const response = await axios.get(`${APi_Url}/digicoder/crm/api/v1/lead/getAll/${AdminId}`, { params });
      setLeads(response.data.leads);
      setTotalRecords(response.data.totalLeads);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (e) => {
    setPage(e.page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setPage(0);
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [page, selectedTags]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(leads.map((lead, index) => ({
      "Sr No.": index + 1 + page * limit,
      Name: lead.name,
      Phone: lead.phone
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, "Leads.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Leads Report', 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [['Sr No.', 'Name', 'Phone']],
      body: leads.map((lead, index) => [
        index + 1 + page * limit,
        lead.name,
        lead.phone
      ]),
      styles: {
        cellPadding: 5,
        fontSize: 10,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    doc.save('Leads.pdf');
  };

  const srNoTemplate = (rowData, column) => {
    return column.rowIndex + 1 + page * limit;
  };

  return (
    <Dashboard>
      <div className="p-4">
        <Card className="shadow-2 border-round">
          {/* Fixed Header Section */}
          <div className="sticky top-0 z-5 bg-white pt-3 pb-3 pl-5 pr-5 shadow-1 mb-2">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 m-0">Export Leads</h2>
                <p className="text-gray-600 text-sm m-0 mt-1">Filter and export your leads data</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  icon="pi pi-file-excel" 
                  className="p-button-success p-button-sm" 
                  onClick={exportToExcel}
                  tooltip="Export to Excel"
                  tooltipOptions={{ position: 'bottom' }}
                />
                <Button 
                  icon="pi pi-file-pdf" 
                  className="p-button-danger p-button-sm" 
                  onClick={exportToPDF}
                  tooltip="Export to PDF"
                  tooltipOptions={{ position: 'bottom' }}
                />
              </div>
            </div>

            {/* Filter Section */}
            <div className="flex align-items-center gap-3 mt-3">
              <MultiSelect
                value={selectedTags}
                options={tags}
                onChange={(e) => {
                  setSelectedTags(e.value);
                  setPage(0);
                }}
                optionLabel="tagName"
                placeholder="Filter by tags"
                display="chip"
                filter
                showClear
                clearIcon="pi pi-times"
                className="w-full"
                panelClassName="shadow-2"
                maxSelectedLabels={2}
                selectedItemsLabel="{0} tags"
                panelStyle={{width:"50%"}}
              />
              {selectedTags.length > 0 && (
                <Button 
                  icon="pi pi-filter-slash" 
                  className="p-button-outlined p-button-sm" 
                  onClick={clearFilters}
                  tooltip="Clear filters"
                  tooltipOptions={{ position: 'bottom' }}
                />
              )}
            </div>
          </div>

          {/* Data Section */}
          <div className="border-round overflow-hidden mt-3">
            {loading ? (
              <div className="flex justify-content-center py-8">
                <ProgressSpinner />
              </div>
            ) : (
              <>
                <DataTable 
                  value={leads} 
                  responsiveLayout="scroll" 
                  className="border-round shadow-none p-datatable-sm"
                  emptyMessage="No leads found"
                  loading={loading}
                  size="small"
                  rowClassName={() => 'cursor-pointer hover:bg-blue-50'}
                >
                  <Column 
                    body={srNoTemplate} 
                    header="Sr No." 
                    headerClassName="bg-gray-100 font-semibold py-2 px-3 text-sm"
                    bodyClassName="py-2 px-3 text-sm"
                    style={{ width: '80px' }}
                  />
                  <Column 
                    field="name" 
                    header="Name" 
                    sortable 
                    headerClassName="bg-gray-100 font-semibold py-2 px-3 text-sm"
                    bodyClassName="py-2 px-3 text-sm"
                  />
                  <Column 
                    field="phone" 
                    header="Phone" 
                    sortable 
                    headerClassName="bg-gray-100 font-semibold py-2 px-3 text-sm"
                    bodyClassName="py-2 px-3 text-sm"
                  />
                </DataTable>

                <Paginator
                  first={page * limit}
                  rows={limit}
                  totalRecords={totalRecords}
                  onPageChange={onPageChange}
                  className="border-round-bottom border-top-1 surface-0 py-2 px-3 text-sm"
                  template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                  currentPageReportTemplate="{first} to {last} of {totalRecords}"
                  leftContent={`Showing ${page * limit + 1} to ${Math.min((page + 1) * limit, totalRecords)} of ${totalRecords} leads`}
                />
              </>
            )}
          </div>
        </Card>
      </div>
    </Dashboard>
  );
};

export default ExportNumbers;