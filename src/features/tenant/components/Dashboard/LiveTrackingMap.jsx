import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Truck, Clock, Package, Navigation, Info, AlertTriangle, Eye, EyeOff } from 'lucide-react';

// ─── Vehicle Mock Data ────────────────────────────────────────────────────────
const VEHICLES = [
  {
    id: "TRC-042",
    driver: "Ramesh Kumar",
    type: "18W Truck",
    status: "in-transit",
    route: "Delhi → Jaipur",
    origin: "Delhi",
    destination: "Jaipur",
    eta: "14:30",
    speed: "72 km/h",
    lat: 28.6139,
    lng: 77.209,
    phone: "+91 98765 43210",
    progress: 65,
    routeCoords: [[28.6139, 77.209], [28.1, 76.8], [27.4, 76.2], [26.9124, 75.7873]],
  },
  {
    id: "TRC-088",
    driver: "Vijay Mehta",
    type: "Container Truck",
    status: "delayed",
    route: "Delhi → Meerut",
    origin: "Delhi",
    destination: "Meerut",
    eta: "+45 min delay",
    speed: "18 km/h",
    lat: 28.75,
    lng: 77.5,
    phone: "+91 76543 21098",
    progress: 30,
    routeCoords: [[28.6139, 77.209], [28.75, 77.5], [28.9845, 77.7064]],
  },
  {
    id: "TRC-033",
    driver: "Deepak Rao",
    type: "Mini Truck",
    status: "stationary",
    route: "Lucknow → Delhi",
    origin: "Lucknow",
    destination: "Delhi",
    eta: "Parked",
    speed: "0 km/h",
    lat: 26.8467,
    lng: 80.9462,
    phone: "+91 54321 09876",
    progress: 100,
    routeCoords: [[26.8467, 80.9462], [27.5706, 80.098], [28.6139, 77.209]],
  },
  {
    id: "TRC-017",
    driver: "Amit Singh",
    type: "Mini Pickup",
    status: "pickup",
    route: "Noida → Gurgaon",
    origin: "Noida",
    destination: "Gurgaon",
    eta: "Collecting cargo",
    speed: "5 km/h",
    lat: 28.5355,
    lng: 77.391,
    phone: "+91 87654 32109",
    progress: 5,
    routeCoords: [[28.5355, 77.391], [28.4595, 77.0266]],
  }
];

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "in-transit": { color: "#16a34a", bg: "bg-green-50", text: "text-green-700", label: "In transit", icon: <Truck size={14} /> },
  pickup: { color: "#2563eb", bg: "bg-blue-50", text: "text-blue-700", label: "Pick-up", icon: <Package size={14} /> },
  stationary: { color: "#d97706", bg: "bg-amber-50", text: "text-amber-700", label: "Stationary", icon: <MapPin size={14} /> },
  delayed: { color: "#dc2626", bg: "bg-red-50", text: "text-red-700", label: "Delayed", icon: <AlertTriangle size={14} /> },
};

// ─── Custom Marker Component ───────────────────────────────────────────────────
const createTruckIcon = (status, isHovered = false) => {
  const cfg = STATUS_CONFIG[status];
  const size = isHovered ? 48 : 42;
  const html = `
    <div class="relative flex items-center justify-center group" style="width: ${size}px; height: ${size}px;">
      <div class="absolute inset-0 rounded-full ${status === 'in-transit' ? 'animate-pulse' : ''}" style="background: ${cfg.color}22;"></div>
      <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110" style="background: ${cfg.color}; border: 2px solid white;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 17h4V5H2v12h3m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m9 2V10l-3-5h-4v12h1m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0"></path>
        </svg>
      </div>
      <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm" style="background: ${cfg.color};"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// ─── Vehicle Detail Popup ──────────────────────────────────────────────────────
const VehiclePopup = ({ vehicle }) => {
  const cfg = STATUS_CONFIG[vehicle.status];
  return (
    <div className="w-[240px] font-inter p-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black text-[#172B4D] tracking-tight">{vehicle.id}</span>
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border leading-none ${cfg.bg} ${cfg.text} border-current/20`}>
          {cfg.label}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-xl">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm`} style={{ background: cfg.color }}>
          {vehicle.driver.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="text-[11px] font-bold text-[#172B4D] leading-tight">{vehicle.driver}</p>
          <p className="text-[9px] text-gray-500 font-medium ">{vehicle.phone}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {[
          { label: 'Current Route', value: vehicle.route, icon: <Navigation size={10} /> },
          { label: 'ETA', value: vehicle.eta, icon: <Clock size={10} /> },
          { label: 'Speed', value: vehicle.speed, icon: <Navigation size={10} className="rotate-45" /> },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400 font-bold flex items-center gap-1.5 uppercase tracking-tighter">
              {item.icon} {item.label}
            </span>
            <span className="text-[#172B4D] font-bold">{item.value}</span>
          </div>
        ))}
      </div>

      {vehicle.status === 'in-transit' && (
        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center text-[9px] mb-1.5 font-bold uppercase text-gray-400 tracking-wider">
            <span>Progress</span>
            <span className={cfg.text}>{vehicle.progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full transition-all duration-1000" style={{ width: `${vehicle.progress}%`, background: cfg.color }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tool Components ──────────────────────────────────────────────────────────
const MapAutoFit = ({ vehicles, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (vehicles.length === 0) return;

    // Auto-close any open popups when filter/trigger changes
    map.closePopup();

    const bounds = L.latLngBounds(vehicles.map(v => [v.lat, v.lng]));
    map.fitBounds(bounds, { padding: [100, 100], animate: true, maxZoom: 15 });
  }, [trigger, map]); // Added map to dependencies for safety
  return null;
};

const LiveTrackingMap = ({ height = 500 }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoutes, setShowRoutes] = useState(true);
  const [centerTrigger, setCenterTrigger] = useState(0);
  const mapRef = useRef(null); // Added mapRef

  const filteredVehicles = VEHICLES.filter(v => {
    const matchesSearch = v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driver.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const focusedVehicles = activeFilter === 'all'
    ? filteredVehicles
    : filteredVehicles.filter(v => v.status === activeFilter);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group font-inter h-full">
      {/* 1. Header Area (Refined) */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-black text-black uppercase tracking-widest leading-none">Live tracking fleet</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group/search">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-blue-500" />
            <input
              type="text"
              placeholder="Search truck id, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 w-48 sm:w-64 transition-all"
            />
          </div>
          <button
            onClick={() => setCenterTrigger(prev => prev + 1)}
            className="p-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-lg flex items-center justify-center"
            title="Recenter Map"
          >
            <MapPin size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* 2. Map Area */}
        <div className="flex-1 relative h-full">
          {/* Floating Controls Removed or simplified */}

          <MapContainer
            center={[28.6139, 77.209]}
            zoom={10}
            scrollWheelZoom={true}
            dragging={true}
            tap={true}
            touchZoom={true}
            className="h-full w-full z-0"
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapAutoFit vehicles={focusedVehicles} trigger={centerTrigger} />

            {showRoutes && filteredVehicles.map(v => (
              <Polyline
                key={`route-${v.id}`}
                positions={v.routeCoords}
                color={STATUS_CONFIG[v.status].color}
                weight={3}
                opacity={activeFilter === 'all' || activeFilter === v.status ? 0.3 : 0.05}
                dashArray={v.status === 'delayed' ? '10, 10' : null}
              />
            ))}

            {filteredVehicles.map(v => (
              <Marker
                key={v.id}
                position={[v.lat, v.lng]}
                icon={createTruckIcon(v.status)}
                opacity={activeFilter === 'all' || activeFilter === v.status ? 1 : 0.3}
              >
                <Tooltip permanent direction="top" offset={[0, -20]} className="custom-tooltip">
                  <span className="font-black text-[10px] tracking-tight">{v.id}</span>
                </Tooltip>
                <Popup className="custom-popup" maxWidth={250}>
                  <VehiclePopup vehicle={v} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* 3. Footer Legend Row */}
        <div className="bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-around z-10">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => {
                setActiveFilter(key);
                setCenterTrigger(prev => prev + 1);
              }}
              className={`flex items-center gap-2 group transition-all px-3 py-1 rounded-xl ${activeFilter === key ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
            >
              <div className={`w-2 h-2 rounded-full ring-4 ring-offset-1 transition-all ${activeFilter === key ? 'ring-current opacity-100 scale-110' : 'ring-transparent opacity-60'}`} style={{ backgroundColor: cfg.color, color: cfg.color }}></div>
              <span className={`text-[11px] font-black uppercase tracking-widest ${activeFilter === key ? 'text-[#172B4D]' : 'text-gray-500 hover:text-[#172B4D]'}`}>
                {cfg.label}
              </span>
            </button>
          ))}
          <div className="w-[1px] h-4 bg-gray-100 mx-2"></div>
          <button
            onClick={() => {
              setActiveFilter('all');
              setCenterTrigger(prev => prev + 1);
            }}
            className={`text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl transition-all ${activeFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            View All
          </button>
        </div>
      </div>

      <style>{`
                .custom-popup .leaflet-popup-content-wrapper {
                    border-radius: 20px !important;
                    padding: 8px !important;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
                }
                .custom-popup .leaflet-popup-tip {
                    background: #fff !important;
                }
                .custom-tooltip {
                    background: white !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 6px !important;
                    padding: 2px 6px !important;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
                    font-family: inherit !important;
                }
                .custom-tooltip::before {
                    border-top-color: white !important;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
    </div>
  );
};

export default LiveTrackingMap;
