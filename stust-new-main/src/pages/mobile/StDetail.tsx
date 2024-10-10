import {
  HeartFilled,
  HeartOutlined,
  RollbackOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  FloatButton,
  Modal,
  Row,
  Spin,
  Typography,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { request } from "/src/util/request";
import { useEffect, useState } from "react";

interface ST {
  st_id: string;
  st_logo: string;
  st_name: string;
  st_description: string;
  st_detail: string;
  isEnroll: boolean;
  isAuth: boolean;
}

export default function StDetail() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ST>();
  const { stId } = useParams();

  const getSTDetail = () => {
    setLoading(true);
    request({
      url: "/mobile/st/" + stId,
      method: "GET",
    })
      .then((res) => {
        if (res.code !== 200) return;
        setDetail(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const toggleEnroll = () => {
    if (!detail?.isAuth) {
      Modal.confirm({
        title: "请登录",
        content: "您还未登录，是否前往登录？",
        onOk() {
          navigate("/mobile/login");
        },
      });
      return;
    }
    setLoading(true);
    request({
      url: "/mobile/enroll/" + stId,
      method: detail?.isEnroll ? "DELETE" : "POST",
    })
      .then((res) => {
        if (res.code !== 200) return;
        setDetail((prev) => {
          if (prev) {
            return {
              ...prev,
              isEnroll: !prev.isEnroll,
            };
          }
          return prev;
        });
        if (!detail?.isEnroll) {
          Modal.confirm({
            title: "加入成功",
            content:
              "您已成功加入该社团！是否立即前往我的页面，修改我的联系方式，以便社团与我联系？",
            onOk() {
              navigate("/mobile/my");
            },
          });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getSTDetail();
  }, []);

  if (!detail) return <Spin spinning={true} fullscreen />;

  return (
    <div style={{ padding: "10px", width: "100%" }}>
      <Spin spinning={loading} fullscreen />
      <Card bordered={false} title={detail.st_name}>
        <Row align="middle">
          <Col span={8} style={{ textAlign: "center" }}>
            {detail.st_logo ? (
              <Avatar size={64} src={detail.st_logo} />
            ) : (
              <Avatar size={64} icon={<UserOutlined />} />
            )}
          </Col>
          <Col span={16}>
            <div>
              <Typography>
                <Typography.Paragraph>
                  {detail.st_description}
                </Typography.Paragraph>
              </Typography>
            </div>
            <div style={{ textAlign: "right" }}>
              {detail.isAuth && detail.isEnroll ? (
                <Button
                  icon={<HeartFilled />}
                  onClick={toggleEnroll}
                  type="primary"
                >
                  已加入
                </Button>
              ) : (
                <Button
                  icon={<HeartOutlined />}
                  onClick={toggleEnroll}
                  type="primary"
                >
                  登记加入
                </Button>
              )}
            </div>
          </Col>
        </Row>
        <Divider />
        <div
          dangerouslySetInnerHTML={{ __html: detail.st_detail }}
          style={{ width: "100vw" }}
        ></div>
      </Card>

      <FloatButton
        icon={<RollbackOutlined />}
        type="primary"
        style={{ width: "50px", height: "50px", bottom: "30%" }}
        description="返回"
        onClick={() => {
          navigate("/mobile/home");
        }}
        shape="square"
      />
    </div>
  );
}
