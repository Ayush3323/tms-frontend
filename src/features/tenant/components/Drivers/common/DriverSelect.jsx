import React from 'react';
import Select from './Select';
import { useDrivers } from '../../../queries/drivers/driverCoreQuery';
import { getDriverName } from './utils';

/**
 * A centralized Driver Selection component to be used across all filter bars
 * and modals. It automatically fetches the driver list.
 */
const DriverSelect = ({ value, onChange, placeholder = "Select a driver", className = "" }) => {
  const { data, isLoading } = useDrivers({ page_size: 100 });
  const drivers = data?.results ?? [];

  return (
    <Select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={className}
      disabled={isLoading}
    >
      <option value="">{isLoading ? "Loading drivers..." : placeholder}</option>
      {drivers.map(d => (
        <option key={d.id} value={d.id}>
          {getDriverName(d)} ({d.employee_id || 'No ID'})
        </option>
      ))}
    </Select>
  );
};

export default DriverSelect;
