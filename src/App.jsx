import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { lazy, Suspense } from "react";

const AdminRoutes = lazy(() => import("./app/router/Router"));
const TenantRoutes = lazy(() => import("./features/tenant/Router/Routing"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
    <div className="w-10 h-10 border-4 border-blue-100 border-t-[#0052CC] rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/tenant/login" replace />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/tenant/*" element={<TenantRoutes />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
