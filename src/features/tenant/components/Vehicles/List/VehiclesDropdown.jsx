// VehiclesDropdown.jsx — Tailwind CSS version
// Drop inside your existing sidebar wherever the Vehicles nav item is.
//
// Props:
//   currentPath  — string    — e.g. location.pathname
//   onNavigate   — fn(path)  — your react-router navigate function

import { useState } from "react";
import {
  ChevronDown, Truck, LayoutGrid, FileText, Shield,
  Wrench, Search, Fuel, Settings, Plug, Tag, ScrollText
} from "lucide-react";
import { 
  Badge
} from '../Common/VehicleCommon';

const VEHICLE_SUB = [
  { key: "all",          label: "All Vehicles",  Icon: Truck,       path: "/tenant/dashboard/vehicles",             badge: null },
  { key: "types",        label: "Vehicle Types", Icon: LayoutGrid,  path: "/tenant/dashboard/vehicles/types",       badge: null },
  { key: "documents",    label: "Documents",     Icon: FileText,    path: "/tenant/dashboard/vehicles/documents",   badge: 2,  badgeVariant: "red" },
  { key: "insurance",    label: "Insurance",     Icon: Shield,      path: "/tenant/dashboard/vehicles/insurance",   badge: null },
  { key: "maintenance",  label: "Maintenance",   Icon: Wrench,      path: "/tenant/dashboard/vehicles/maintenance", badge: 3,  badgeVariant: "orange" },
  { key: "inspections",  label: "Inspections",   Icon: Search,      path: "/tenant/dashboard/vehicles/inspections", badge: null },
  { key: "fuel",         label: "Fuel Logs",     Icon: Fuel,        path: "/tenant/dashboard/vehicles/fuel",        badge: null },
  { key: "tires",        label: "Tires",         Icon: Settings,    path: "/tenant/dashboard/vehicles/tires",       badge: null },
  { key: "accessories",  label: "Accessories",   Icon: Plug,        path: "/tenant/dashboard/vehicles/accessories", badge: null },
  { key: "toll",         label: "Toll Tags",     Icon: Tag,         path: "/tenant/dashboard/vehicles/toll-tags",   badge: null },
  { key: "ownership",    label: "Ownership",     Icon: ScrollText,  path: "/tenant/dashboard/vehicles/ownership",   badge: null },
];

export default function VehiclesDropdown({ currentPath = "", onNavigate }) {
  const isVehiclePath = currentPath.startsWith("/tenant/dashboard/vehicles");
  const [open, setOpen] = useState(isVehiclePath);

  const isActive = (path) => currentPath === path;
  const go = (path) => { if (onNavigate) onNavigate(path); };

  const BADGE_VARIANTS = {
    red:    'bg-red-50 text-red-600 border-red-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    blue:   'bg-blue-50 text-blue-600 border-blue-200',
    green:  'bg-green-50 text-green-600 border-green-200',
  };

  return (
    <div className="w-full">

      {/* ── Parent "Vehicles" trigger ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex items-center gap-2 w-[calc(100%-12px)] mx-1.5 px-2.5 py-1.5",
          "rounded-md text-sm transition-all duration-150 cursor-pointer",
          isVehiclePath
            ? "bg-blue-50 text-blue-600 border border-blue-200 font-semibold"
            : "text-gray-600 border border-transparent font-medium hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200",
        ].join(" ")}
      >
        <span className={[
          "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
          isVehiclePath ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500",
        ].join(" ")}>
          <Truck size={14} />
        </span>

        <span className="flex-1 text-left">Vehicles</span>

        <ChevronDown
          size={14}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {/* ── Animated submenu ── */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="ml-[22px] pl-2.5 border-l-2 border-gray-200 mt-0.5 mb-1 space-y-px">
          {VEHICLE_SUB.map(({ key, label, Icon, path, badge, badgeVariant }) => {
            const active = isActive(path);
            return (
              <button
                key={key}
                onClick={() => go(path)}
                className={[
                  "flex items-center gap-2 w-full px-2.5 py-[5px] rounded-md text-[12.5px] transition-all duration-100 cursor-pointer",
                  active
                    ? "bg-blue-50 text-blue-600 border border-blue-200 font-semibold"
                    : "text-gray-500 border border-transparent font-normal hover:bg-gray-50 hover:text-gray-700 hover:border-gray-100",
                ].join(" ")}
              >
                {/* active dot */}
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? "bg-blue-500" : "bg-gray-300"}`} />

                {/* icon */}
                <span className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${active ? "text-blue-500" : "text-gray-400"}`}>
                  <Icon size={12} />
                </span>

                {/* label */}
                <span className="flex-1 text-left">{label}</span>

                {/* badge */}
                {badge && (
                  <Badge className={`text-[10px] px-1.5 py-px font-mono ${BADGE_VARIANTS[badgeVariant] ?? BADGE_VARIANTS.blue}`}>
                    {badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
