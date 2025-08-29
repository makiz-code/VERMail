import Dashboard from "../views/Dashboard.js";

const layout = "/sys-user";

const sysUserRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "nc-icon nc-chart-pie-35",
    component: Dashboard,
    layout: layout,
  },
];

export default sysUserRoutes;
