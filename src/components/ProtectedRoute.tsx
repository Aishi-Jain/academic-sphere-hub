import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }: any) => {

  const user = JSON.parse(localStorage.getItem("user") || "null");

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // ❌ Role not allowed
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  // ✅ Allowed
  return children;
};

export default ProtectedRoute;