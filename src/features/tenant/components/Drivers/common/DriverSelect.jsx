import React from 'react';
import Select from './Select';
import { useDrivers } from '../../../queries/drivers/driverCoreQuery';
import { useVehicleAssignments } from '../../../queries/drivers/vehicleAssignmentQuery';
import { useVehicles } from '../../../queries/vehicles/vehicleQuery';
import { getDriverName } from './utils';

/**
 * A centralized Driver Selection component to be used across all filter bars
 * and modals. It automatically fetches the driver list.
 */
const DriverSelect = ({ value, onChange, placeholder = "Select a driver", className = "", currentVehicleId = null, disableBusy = false }) => {
  const { data, isLoading } = useDrivers({ page_size: 1000 });
  const { data: assignmentsData } = useVehicleAssignments({ is_active: true });
  const { data: vehiclesData } = useVehicles({ page_size: 1000 });

  const drivers = data?.results ?? [];
  const activeAssignments = assignmentsData?.results ?? [];
  const allVehicles = vehiclesData?.results ?? vehiclesData ?? [];

  // Identify drivers who are already assigned to other vehicles
  const busyDrivers = new Map();

  // 1. Check VehicleAssignment model
  activeAssignments.forEach(a => {
    if (a.driver && a.vehicle !== currentVehicleId) {
      busyDrivers.set(a.driver, a.vehicle_registration || 'Another Vehicle');
    }
  });

  // 2. Check Vehicle model's assigned_driver field (as backup/fallback)
  allVehicles.forEach(v => {
    const driverId = v.assigned_driver?.id ?? v.assigned_driver;
    if (driverId && v.id !== currentVehicleId) {
      busyDrivers.set(driverId, v.registration_number || 'Another Vehicle');
    }
  });

  return (
    <Select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={className}
      disabled={isLoading}
    >
      <option value="">{isLoading ? "Loading drivers..." : placeholder}</option>
      {drivers.map(d => {
        const busyWith = busyDrivers.get(d.id);
        const isBusy = !!busyWith;
        
        return (
          <option key={d.id} value={d.id} disabled={disableBusy && isBusy}>
            {getDriverName(d)} ({d.employee_id || 'No ID'})
            {(disableBusy && isBusy) ? ` — [Assigned to ${busyWith}]` : ''}
          </option>
        );
      })}
    </Select>
  );
};

export default DriverSelect;
