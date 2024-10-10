import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { ProjectRouter } from "./router.tsx";
import zhCN from "antd/locale/zh_CN";
import { ConfigProvider } from "antd";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <ProjectRouter />
    </ConfigProvider>
  </React.StrictMode>
);
