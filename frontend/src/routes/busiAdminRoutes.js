import Topics from "../views/Topics.js";
import Fields from "../views/Fields.js";
import Dataset from "../views/Dataset.js";
import Model from "../views/Model.js";

const layout = "/busi-admin";

const busiAdminRoutes = [
  {
    path: "/topics",
    name: "Topics",
    icon: "nc-icon nc-tag-content",
    component: Topics,
    layout: layout,
  },
  {
    path: "/fields",
    name: "Fields",
    icon: "nc-icon nc-bullet-list-67",
    component: Fields,
    layout: layout,
  },
  {
    path: "/dataset",
    name: "Dataset",
    icon: "nc-icon nc-grid-45",
    component: Dataset,
    layout: layout,
  },
  {
    path: "/model",
    name: "Model",
    icon: "nc-icon nc-layers-3",
    component: Model,
    layout: layout,
  },
];

export default busiAdminRoutes;
