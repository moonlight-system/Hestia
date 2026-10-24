import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { isAndroid } from "./platform";
document.documentElement.dataset.platform = isAndroid ? "mobile" : "desktop";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
