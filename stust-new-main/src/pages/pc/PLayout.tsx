import {
  CloudDownloadOutlined,
  ContactsOutlined,
  ControlOutlined,
  FundProjectionScreenOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Layout, Menu } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { request } from "/src/util/request";
const { Header, Content, Sider } = Layout;

const sysMenu = [
  {
    key: "/pc/board",
    icon: <FundProjectionScreenOutlined />,
    label: "数据看板",
  },
  {
    key: "/pc/st-manage",
    icon: <ContactsOutlined />,
    label: "社团管理",
  },
  {
    key: "/pc/user-manage",
    icon: <UserOutlined />,
    label: "用户管理",
  },
  {
    key: "/pc/data-export",
    icon: <CloudDownloadOutlined />,
    label: "数据导出",
  },
  {
    key: "/pc/sys-setting",
    icon: <ControlOutlined />,
    label: "系统设置",
  },
  {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "退出登录",
  },
];

export default function PLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const handleMenuSelect = ({ selectedKeys }: { selectedKeys: string[] }) => {
    const key = selectedKeys[0];
    if (key === "logout") {
      request({
        url: "/pc/logout",
        method: "post",
      }).then((res) => {
        if (res.code === 200) {
          window.localStorage.removeItem("token");
          navigate("/pc/login", { replace: true });
        }
      });
    } else {
      navigate(key);
    }
  };
  if (
    !window.localStorage.getItem("token") &&
    location.pathname !== "/pc/login"
  ) {
    return <Navigate to="/pc/login" />;
  }
  if (!sysMenu.some((item) => item.key === location.pathname)) {
    return <Navigate to="/pc/board" />;
  }
  return (
    <Layout style={{ height: "100vh", display: "flex" }}>
      <Header>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: "20px" }}>
          社团登记系统
        </div>
      </Header>
      <Content style={{ flex: 1 }}>
        <Layout
          style={{
            height: "100%",
          }}
        >
          <Sider width={200}>
            <Menu
              mode="inline"
              style={{ height: "100%" }}
              items={sysMenu}
              selectedKeys={[location.pathname]}
              onSelect={handleMenuSelect}
            />
          </Sider>
          <Content style={{ height: "100%", overflowY: "scroll" }}>
            <Outlet />
          </Content>
        </Layout>
      </Content>
    </Layout>
  );
}
