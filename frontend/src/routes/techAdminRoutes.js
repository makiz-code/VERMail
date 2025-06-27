import Mailboxes from "../views/Mailboxes.js";
import Senders from "../views/Senders.js";

const layout = "/tech-admin";

const techAdminRoutes = [
  {
    path: "/mailboxes",
    name: "Mailboxes",
    icon: "nc-icon nc-email-83",
    component: Mailboxes,
    layout: layout,
  },
  {
    path: "/senders",
    name: "Senders",
    icon: "nc-icon nc-send",
    component: Senders,
    layout: layout,
  },
];

export default techAdminRoutes;
