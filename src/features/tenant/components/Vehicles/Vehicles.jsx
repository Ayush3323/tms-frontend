import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  Eye,
  PauseCircle,
  PlayCircle,
  Truck,
  CheckCircle,
  Wrench,
  ArchiveX,
  ChevronDown,
  Trash2
} from "lucide-react"

import {
  useVehicles,
  useUpdateVehicle,
  useDeleteVehicle
} from "../queries/vehicleQuery"

const FUEL_COLORS = {
  Diesel: "bg-orange-50 text-orange-600 border border-orange-200",
  CNG: "bg-green-50 text-green-600 border border-green-200",
  Petrol: "bg-blue-50 text-blue-600 border border-blue-200",
  Electric: "bg-teal-50 text-teal-600 border border-teal-200"
}

const STATUS_STYLES = {
  Active: {
    dot: "bg-green-500",
    text: "text-green-700",
    bg: "bg-green-50 border border-green-200"
  },
  Maintenance: {
    dot: "bg-orange-500",
    text: "text-orange-700",
    bg: "bg-orange-50 border border-orange-200"
  },
  Retired: {
    dot: "bg-red-400",
    text: "text-red-700",
    bg: "bg-red-50 border border-red-200"
  },
  Sold: {
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-50 border border-gray-200"
  }
}

const StatCard = ({ label, value, color, icon: Icon }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </span>

      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.iconBg}`}
      >
        <Icon size={15} className={color.iconText} />
      </span>
    </div>

    <span className={`text-3xl font-black ${color.value}`}>{value}</span>
  </div>
)

const Vehicles = () => {
  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatus] = useState("All Status")
  const [fuelFilter, setFuel] = useState("All Fuel")
  const [ownerFilter, setOwner] = useState("All Ownership")

  const { data, isLoading, isError } = useVehicles()

  const updateVehicle = useUpdateVehicle()
  const deleteVehicle = useDeleteVehicle()

  const vehicles = data?.results || data || []

  const total = vehicles.length

  const active = vehicles.filter(v => v.status === "Active").length
  const maintenance = vehicles.filter(v => v.status === "Maintenance").length
  const retired = vehicles.filter(
    v => v.status === "Retired" || v.status === "Sold"
  ).length

  const filtered = useMemo(() => {
    const q = search.toLowerCase()

    return vehicles.filter(v => {
      const matchSearch =
        !q ||
        v.reg?.toLowerCase().includes(q) ||
        v.make?.toLowerCase().includes(q) ||
        v.driver?.toLowerCase().includes(q)

      const matchStatus =
        statusFilter === "All Status" || v.status === statusFilter

      const matchFuel = fuelFilter === "All Fuel" || v.fuel === fuelFilter

      const matchOwner =
        ownerFilter === "All Ownership" || v.ownership === ownerFilter

      return matchSearch && matchStatus && matchFuel && matchOwner
    })
  }, [vehicles, search, statusFilter, fuelFilter, ownerFilter])

  const handleActivate = id => {
    updateVehicle.mutate({
      id,
      data: { status: "Active" }
    })
  }

  const handleSuspend = id => {
    updateVehicle.mutate({
      id,
      data: { status: "Maintenance" }
    })
  }

  const handleDelete = id => {
    if (window.confirm("Delete this vehicle?")) {
      deleteVehicle.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading vehicles...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-10 text-center text-red-500">
        Failed to load vehicles
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">
      {/* Header */}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Vehicles</h1>

          <p className="text-sm text-gray-400 mt-0.5">
            All registered vehicles
          </p>
        </div>

        <button
          onClick={() => navigate("/vehicles/create")}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg"
        >
          <Plus size={15} /> Add Vehicle
        </button>
      </div>

      {/* Stats */}

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total"
          value={total}
          icon={Truck}
          color={{
            value: "text-[#172B4D]",
            iconBg: "bg-blue-50",
            iconText: "text-blue-500"
          }}
        />

        <StatCard
          label="Active"
          value={active}
          icon={CheckCircle}
          color={{
            value: "text-green-600",
            iconBg: "bg-green-50",
            iconText: "text-green-500"
          }}
        />

        <StatCard
          label="Maintenance"
          value={maintenance}
          icon={Wrench}
          color={{
            value: "text-orange-500",
            iconBg: "bg-orange-50",
            iconText: "text-orange-500"
          }}
        />

        <StatCard
          label="Retired"
          value={retired}
          icon={ArchiveX}
          color={{
            value: "text-red-500",
            iconBg: "bg-red-50",
            iconText: "text-red-400"
          }}
        />
      </div>

      {/* Table */}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center gap-3">
          <Search size={14} />

          <input
            placeholder="Search vehicle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none"
          />

          <button
            onClick={() => {
              setSearch("")
              setStatus("All Status")
              setFuel("All Fuel")
              setOwner("All Ownership")
            }}
            className="flex items-center gap-1 text-sm text-gray-500"
          >
            <RefreshCw size={14} /> Reset
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {[
                "Registration",
                "Make",
                "Fuel",
                "Driver",
                "Status",
                "Actions"
              ].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.map(v => {
              const st = STATUS_STYLES[v.status] || STATUS_STYLES.Retired

              return (
                <tr key={v.id} className="border-b">
                  <td className="px-4 py-3 font-mono font-bold">
                    {v.reg}
                  </td>

                  <td className="px-4 py-3">{v.make}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        FUEL_COLORS[v.fuel]
                      }`}
                    >
                      {v.fuel}
                    </span>
                  </td>

                  <td className="px-4 py-3">{v.driver}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${st.bg} ${st.text}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${st.dot}`}
                      />
                      {v.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => navigate(`/vehicles/${v.id}`)}
                      className="text-blue-600 flex items-center gap-1"
                    >
                      <Eye size={14} /> View
                    </button>

                    {v.status === "Active" ? (
                      <button
                        onClick={() => handleSuspend(v.id)}
                        className="text-red-600 flex items-center gap-1"
                      >
                        <PauseCircle size={14} /> Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(v.id)}
                        className="text-green-600 flex items-center gap-1"
                      >
                        <PlayCircle size={14} /> Activate
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-gray-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="px-4 py-3 text-xs text-gray-400">
          Showing {filtered.length} of {total} vehicles
        </div>
      </div>
    </div>
  )
}

export default Vehicles