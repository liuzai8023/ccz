import { Segmented } from "antd";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export default function MLayout() {
  const location = useLocation();
  const [current, setCurrent] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const navigate = useNavigate();
  const sysMenu = [
    {
      key: "/mobile/home",
      label: "社团列表",
      value: 0,
    },
    {
      key: "/mobile/st-detail",
      label: "社团详情",
      value: 1,
      className: showDetail ? "show" : "hide",
    },
    {
      key: "/mobile/my",
      label: "我的",
      value: 2,
    },
  ];

  useEffect(() => {
    const key = location.pathname;
    const target = sysMenu.findIndex((item) => key.startsWith(item.key));
    if (target !== -1) {
      setCurrent(target);
      if (target == 1) {
        setShowDetail(true);
      } else {
        setShowDetail(false);
      }
    } else {
      navigate(sysMenu[0].key, { replace: true });
    }
  }, [location]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
      }}
    >
      <Segmented
        options={sysMenu}
        onChange={(value) => {
          navigate(sysMenu[value].key, { replace: true });
        }}
        block
        size="large"
        style={{ margin: "20px 10px" }}
        value={current}
      />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}
