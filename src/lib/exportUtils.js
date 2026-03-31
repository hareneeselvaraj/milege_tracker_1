import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exports fuel log data as a branded PDF using jsPDF's native save.
 */
export const exportFuelPDF = (entries, vehicles, filterLabel = 'All Units') => {
  try {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Header
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(167, 139, 250);
    doc.setFont('helvetica', 'bold');
    doc.text('UltraLog', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 220);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Fuel Archive Report', 14, 26);
    doc.text('Generated: ' + today + '  |  Filter: ' + filterLabel, 14, 33);

    // Stats
    const totalCost = entries.reduce((s, e) => s + Number(e.cost), 0);
    const totalLiters = entries.reduce((s, e) => s + Number(e.liters), 0);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Total Records: ' + entries.length + '  |  Total Liters: ' + totalLiters.toFixed(1) + ' L  |  Total Spend: Rs.' + totalCost.toLocaleString(), 14, 48);

    // Table
    const headers = [['Date', 'Vehicle', 'Odometer', 'Liters', 'Cost (Rs.)', 'Price/L']];
    const rows = entries.map(e => {
      const pricePerL = e.liters > 0 ? (Number(e.cost) / Number(e.liters)).toFixed(1) : '-';
      return [
        e.date,
        vehicles.find(v => v.id === e.vehicleId)?.name || 'Unknown',
        e.odometer + ' KM',
        e.liters + ' L',
        'Rs.' + Number(e.cost).toLocaleString(),
        'Rs.' + pricePerL,
      ];
    });

    autoTable(doc, {
      startY: 54,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [30, 27, 75], textColor: [167, 139, 250], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 247, 255] },
      columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' } },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Page ' + i + ' of ' + pageCount + '  |  UltraLog Mileage Tracker', 14, doc.internal.pageSize.height - 8);
    }

    // Use jsPDF's native save — most reliable method
    doc.save('UltraLog_Fuel_Report_' + new Date().toISOString().split('T')[0] + '.pdf');
  } catch (err) {
    console.error('PDF Export Error:', err);
    alert('PDF export failed: ' + err.message);
  }
};

/**
 * Exports trip log data as a PDF.
 */
export const exportTripPDF = (trips, vehicles) => {
  try {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-GB');

    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(167, 139, 250);
    doc.setFont('helvetica', 'bold');
    doc.text('UltraLog', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 220);
    doc.setFont('helvetica', 'normal');
    doc.text('Trip Log Report', 14, 26);
    doc.text('Generated: ' + today, 14, 33);

    const totalKm = trips.reduce((s, t) => s + (Number(t.endOdometer) - Number(t.startOdometer)), 0);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Total Trips: ' + trips.length + '  |  Total Distance: ' + totalKm.toLocaleString() + ' KM', 14, 48);

    const headers = [['Date', 'Vehicle', 'Start KM', 'End KM', 'Distance', 'Purpose']];
    const rows = trips.map(t => [
      t.date,
      vehicles.find(v => v.id === t.vehicleId)?.name || 'Unknown',
      t.startOdometer + ' KM',
      t.endOdometer + ' KM',
      (Number(t.endOdometer) - Number(t.startOdometer)).toLocaleString() + ' KM',
      t.purpose || '-',
    ]);

    autoTable(doc, {
      startY: 54,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [30, 27, 75], textColor: [167, 139, 250], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 247, 255] },
    });

    doc.save('UltraLog_Trip_Report_' + new Date().toISOString().split('T')[0] + '.pdf');
  } catch (err) {
    console.error('Trip PDF Export Error:', err);
    alert('Trip PDF export failed: ' + err.message);
  }
};

/**
 * Exports fuel log entries as CSV using a Blob download.
 */
export const exportCSV = (entries, vehicles) => {
  try {
    const headers = ['Date', 'Vehicle', 'Odometer (KM)', 'Liters', 'Cost (INR)', 'Price Per Liter'];
    const rows = entries.map(e => {
      const ppl = e.liters > 0 ? (Number(e.cost) / Number(e.liters)).toFixed(2) : '';
      return [
        e.date,
        vehicles.find(v => v.id === e.vehicleId)?.name || 'Unknown',
        e.odometer,
        e.liters,
        e.cost,
        ppl,
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => '"' + cell + '"').join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = 'UltraLog_Fuel_Data_' + new Date().toISOString().split('T')[0] + '.csv';

    // Use blob URL — works when no service worker is intercepting
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Delay cleanup so browser starts the download
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  } catch (err) {
    console.error('CSV Export Error:', err);
    alert('CSV export failed: ' + err.message);
  }
};
