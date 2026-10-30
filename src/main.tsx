import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { isAndroid } from "./platform";
import { applyPrefs, loadPrefs } from "./preferences";
import "./fonts";

document.documentElement.dataset.platform = isAndroid ? "mobile" : "desktop";
applyPrefs(loadPrefs());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
