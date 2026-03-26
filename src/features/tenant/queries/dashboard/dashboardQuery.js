import { useQuery } from '@tanstack/react-query';
import { ordersApi, tripsApi, deliveriesApi } from '../../api/orders/ordersEndpoint';
import { vehiclesApi } from '../../api/vehicles/vehicleEndpoint';

export const dashboardKeys = {
  all: ['dashboard'],
  summary: () => [...dashboardKeys.all, 'summary'],
  activities: () => [...dashboardKeys.all, 'activities'],
  tracking: () => [...dashboardKeys.all, 'tracking'],
};

// Hook for Dashboard Summary (Aggregate Stats)
export const useDashboardSummary = () => {
    // In a real scenario, we would use existing APIs and aggregate on frontend
    // or call a dedicated dashboard summary endpoint.
    return useQuery({
        queryKey: dashboardKeys.summary(),
        queryFn: async () => {
            // Placeholder for real logic:
            // const [orders, vehicles, deliveries] = await Promise.all([
            //     ordersApi.list(),
            //     vehiclesApi.list(),
            //     deliveriesApi.list()
            // ]);
            // return aggregateDashboardData(orders, vehicles, deliveries);
            
            // For now, returning realistic default data as discussed
            return {
                totalShipments: 1284,
                activeVehicles: 482,
                avgDeliveryTime: "4h 12m",
                onTimeRate: "98.2%",
                trends: {
                    shipments: "+12.5%",
                    vehicles: "+3.2%",
                    time: "-18m",
                    rate: "-0.4%"
                }
            };
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// Hook for Recent Activities
export const useRecentActivities = () => {
    return useQuery({
        queryKey: dashboardKeys.activities(),
        queryFn: async () => {
            // return tripsApi.list({ ordering: '-created_at', limit: 10 });
            return []; // Placeholder for real data
        }
    });
};
