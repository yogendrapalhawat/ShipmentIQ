import React from 'react';

const DataTable = ({ columns, data, onRowClick, keyField = 'id' }) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={{ textAlign: col.align || 'left' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr
              key={row[keyField] || rIdx}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, cIdx) => (
                <td key={cIdx} style={{ textAlign: col.align || 'left' }}>
                  {col.cell ? col.cell(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
