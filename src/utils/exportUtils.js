import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import API from '../api/apiClient';

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) { alert('No data to export'); return; }
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const s = String(value);
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    )
  ].join('\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

export const exportToExcel = async (data, filename = 'export.xlsx') => {
  if (!data || data.length === 0) { alert('No data to export'); return; }
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  
  const headers = Object.keys(data[0]);
  worksheet.addRow(headers);
  
  // Style headers
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '7D2AE8' }
  };

  // Set column widths
  worksheet.columns = headers.map(h => ({
    header: h,
    key: h,
    width: h.toLowerCase() === 'image' ? 10 : 20
  }));

  for (let i = 0; i < data.length; i++) {
    const rowData = data[i];
    const rowValues = headers.map(h => {
      if (h.toLowerCase() === 'image') return ''; 
      return rowData[h];
    });
    
    const row = worksheet.getRow(i + 2); // row 1 is header
    row.values = rowValues;
    row.height = 40; 

    // Handle Image
    const imageHeaderIndex = headers.findIndex(h => h.toLowerCase() === 'image');
    if (imageHeaderIndex !== -1 && rowData[headers[imageHeaderIndex]]) {
      try {
        const rawImage = rowData[headers[imageHeaderIndex]];
        const pngDataUrl = await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = img.naturalWidth || img.width || 40;
              canvas.height = img.naturalHeight || img.height || 40;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL("image/png"));
            } catch (e) {
              console.error("Canvas draw failed", e);
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = rawImage;
        });

        if (pngDataUrl) {
          const base64 = pngDataUrl.split(',')[1];
          const imageId = workbook.addImage({
            base64: base64,
            extension: 'png',
          });
          
          worksheet.addImage(imageId, {
            tl: { col: imageHeaderIndex, row: i + 1 }, // 0-indexed column, 0-indexed row (header is 0)
            ext: { width: 40, height: 40 },
            editAs: 'oneCell'
          });
        }
      } catch (e) {
        console.error('Error embedding image in Excel:', e);
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};

export const exportToPDF = (data, filename = 'export.pdf', title = 'Export') => {
  if (!data || data.length === 0) { alert('No data to export'); return; }
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`
  ).join('');
  const html = `
    <html><head><title>${title}</title><style>
      body { font-family: Arial, sans-serif; font-size: 11px; }
      h2 { color: #1e1b4b; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #7d2ae8; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
      td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
      tr:nth-child(even) td { background: #f8fafc; }
    </style></head><body>
      <h2>${title}</h2>
      <p style="color:#64748b;font-size:10px">Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${data.map(row => 
        `<tr>${headers.map(h => {
          if (h.toLowerCase() === 'image' && row[h]) {
            return `<td><img src="${row[h]}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;" /></td>`;
          }
          return `<td>${row[h] ?? ''}</td>`;
        }).join('')}</tr>`
      ).join('')}</tbody></table>
    </body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
};

export const formatOrderData = (orders) =>
  orders.map(o => ({
    'Order No': o.orderNo || `ORD-${o.id}`,
    'Outlet': o.outlet?.outletName || '—',
    'Items': o.items?.length || 0,
    'Status': o.status,
    'Date': o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—',
  }));

export const formatBatchData = (batches) =>
  batches.map(b => ({
    'Batch No': b.batchNo,
    'Product': b.productName || b.product?.name || '—',
    'Quantity': b.quantity,
    'Manufacture Date': b.manufactureDate || '—',
    'Expiry Date': b.expiryDate || '—',
    'Purchase Price': b.purchasePrice,
    'Selling Price': b.sellingPrice,
    'Status': b.status,
  }));

export const formatStockData = (stock) =>
  stock.map(s => ({
    'Outlet': s.outletName || s.outletId,
    'Product': s.productName || s.productId,
    'Available Qty': s.availableQty,
    'Reserved Qty': s.reservedQty || 0,
  }));

export const formatUserData = (users) =>
  users.map(u => ({
    'Name': u.name || u.username,
    'Username': u.username,
    'Email': u.email,
    'Role': u.role,
    'Status': u.status,
  }));

export const formatOutletData = (outlets) =>
  outlets.map(o => ({
    'ID': o.id,
    'Outlet Name': o.outletName,
    'Code': o.outletCode || '—',
    'Type': o.outletType,
    'Location': o.locationName,
    'Divisions': (o.divisionNames || []).join('; '),
    'Products': (o.productNames || []).join('; '),
    'Owner Name': o.ownerName,
    'Address': o.address,
  }));

export const formatDivisionData = (divisions) =>
  divisions.map(d => ({
    'ID': d.id,
    'Division Name': d.name,
    'Total Products': d.products?.length || 0,
    'Created At': d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—',
  }));

export const formatProductData = (products) =>
  products.map(p => ({
    'ID': p.id,
    'Product Name': p.name,
    'Product Code': p.productCode || '—',
    'Division': p.divisionName || p.division?.name || '—',
    'UIM Price': p.uimPrice ?? '—',
    'MRP': p.mrp ?? '—',
    'Selling Price': p.sellingPrice ?? '—',
    'Purchase Price': p.purchasePrice ?? '—',
    'Image': p.image || '',
  }));

export const formatLocationData = (locations) =>
  locations.map(l => ({
    'ID': l.id,
    'Location Name': l.name,
  }));

export const downloadBackendExport = async (type, format) => {
  try {
    const response = await API.get(`/api/export/${type}`, {
      params: { format },
      responseType: 'blob',
    });
    
    const contentDisposition = response.headers['content-disposition'];
    let filename = `${type}_export.${format === 'excel' || format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'html' : 'csv'}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=(.+)/);
      if (match && match[1]) filename = match[1];
    }
    
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || (format === 'pdf' ? 'text/html' : format === 'excel' || format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv')
    });
    
    if (format === 'pdf') {
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
      } else {
        alert("Pop-up blocked! Please allow pop-ups to print the report.");
      }
    } else {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Backend export failed:", error);
    alert("Export failed: " + (error.response?.data?.message || error.message || "Unknown error"));
  }
};
