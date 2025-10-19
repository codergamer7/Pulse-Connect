import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ApplicantPortal from "./pages/ApplicantPortal";
import DoctorPortal from "./pages/DoctorPortal";
import StaffPortal from "./pages/StaffPortal";
import Register from "./pages/Register";
import { Toaster } from "sonner"; // 👈 import this

const ProtectedRoute = ({ children, allowedRoles }) => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" replace />;

  return children;
};

export default function App() {
  return (
    <>
      {/* Your routes */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/applicant"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffPortal />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* 👇 Add Toaster here */}
      <Toaster richColors position="top-right" />
    </>
  );
}
