import { useState } from "react"
import { Search, Plus, Eye, PauseCircle, PlayCircle, Truck, CheckCircle } from "lucide-react"
import { useVehicles } from "../queries/vehicles/vehicleQuery"

export default function Vehicles() {

  const [search, setSearch] = useState("")
  const { data, isLoading } = useVehicles()

  const vehicles = data?.results || data || []

  const filtered = vehicles.filter(v =>
    v.registration_number?.toLowerCase().includes(search.toLowerCase())
  )

  const total = vehicles.length
  const active = vehicles.filter(v => v.status === "Active").length

  if (isLoading) {
    return <div className="p-10">Loading vehicles...</div>
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-gray-500 text-sm">
            Manage fleet vehicles
          </p>
        </div>

        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
          <Plus size={16}/>
          Add Vehicle
        </button>
      </div>


      {/* Stats */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <StatCard
          title="Total Vehicles"
          value={total}
          icon={Truck}
          color="text-blue-600"
        />

        <StatCard
          title="Active Vehicles"
          value={active}
          icon={CheckCircle}
          color="text-green-600"
        />

      </div>


      {/* Table */}

      <div className="bg-white rounded-xl border">

        <div className="p-4 border-b flex items-center gap-2">
          <Search size={16}/>
          <input
            placeholder="Search vehicle..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="outline-none flex-1"
          />
        </div>


        <table className="w-full text-sm">

          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Registration</th>
              <th className="p-3 text-left">Make</th>
              <th className="p-3 text-left">Model</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>

            {filtered.map(vehicle => (

              <tr key={vehicle.id} className="border-t">

                <td className="p-3 font-semibold">
                  {vehicle.registration_number}
                </td>

                <td className="p-3">
                  {vehicle.make}
                </td>

                <td className="p-3">
                  {vehicle.model}
                </td>

                <td className="p-3">
                  <StatusBadge status={vehicle.status}/>
                </td>

                <td className="p-3 flex gap-3">

                  <button className="text-blue-600 flex items-center gap-1">
                    <Eye size={14}/> View
                  </button>

                  <button className="text-red-600 flex items-center gap-1">
                    <PauseCircle size={14}/> Suspend
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}


/* ---------------------- STAT CARD ---------------------- */

function StatCard({ title, value, icon: Icon, color }) {

  return (
    <div className="bg-white p-5 rounded-xl border flex justify-between">

      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>
          {value}
        </p>
      </div>

      <Icon size={22} className={color}/>

    </div>
  )
}


/* ---------------------- STATUS BADGE ---------------------- */

function StatusBadge({ status }) {

  const colors = {
    Active: "bg-green-100 text-green-700",
    Maintenance: "bg-orange-100 text-orange-700",
    Retired: "bg-red-100 text-red-700"
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  )
}