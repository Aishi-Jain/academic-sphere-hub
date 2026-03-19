import AppLayout from "@/components/AppLayout";
import { Outlet } from "react-router-dom";

const AppLayoutWrapper = () => {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

export default AppLayoutWrapper;