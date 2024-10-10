import { DeleteOutlined, UserOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  List,
  Modal,
  Row,
  Spin,
  Typography,
} from "antd";
import Link from "antd/es/typography/Link";
import { useEffect, useState } from "react";
import { request } from "/src/util/request";
import { useNavigate } from "react-router-dom";

interface ST {
  st_id: string;
  st_logo: string;
  st_name: string;
  st_description: string;
}

export default function My() {
  const [stList, setSTList] = useState<ST[]>([]);
  const [loading, setLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [changePasswordForm] = Form.useForm();
  const [changeContact, setChangeContact] = useState(false);
  const [contact, setContact] = useState("");
  const navigate = useNavigate();

  const getSTList = () => {
    setLoading(true);
    request({
      url: "/mobile/enroll",
      method: "GET",
    })
      .then((res) => {
        if (res.code !== 200) return;
        setSTList(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const deleteEnroll = (stId: string) => {
    setLoading(true);
    request({
      url: "/mobile/enroll/" + stId,
      method: "DELETE",
    })
      .then((res) => {
        if (res.code !== 200) return;
        getSTList();
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const logout = () => {
    setLoading(true);
    request({
      url: "/mobile/logout",
      method: "POST",
    })
      .then((res) => {
        if (res.code !== 200) return;
        window.localStorage.removeItem("token");
        navigate("/mobile/login", { replace: true });
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const confirmChangePassword = () => {
    changePasswordForm.validateFields().then((values) => {
      if (values.newPassword !== values.newPasswordConfirm) {
        changePasswordForm.setFields([
          {
            name: "password2",
            errors: ["两次输入的密码不一致"],
          },
        ]);
        return;
      }
      setLoading(true);
      request({
        url: "/mobile/changePassword",
        method: "POST",
        data: values,
      })
        .then((res) => {
          if (res.code !== 200) return;
          setChangePassword(false);
          changePasswordForm.resetFields();
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };
  const confirmContact = () => {
    setLoading(true);
    request({
      url: "/mobile/changeContact",
      method: "POST",
      data: { contact },
    })
      .then((res) => {
        if (res.code !== 200) return;
        setChangeContact(false);
        setContact("");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getSTList();
  }, []);

  return (
    <div style={{ padding: "10px", width: "100%" }}>
      <Spin spinning={loading} fullscreen />
      <Card bordered={false} title="我登记加入的社团">
        {stList.map((st) => (
          <div key={st.st_id}>
            <Row align="middle">
              <Col span={8} style={{ textAlign: "center" }}>
                {st.st_logo ? (
                  <Avatar size={64} src={st.st_logo} />
                ) : (
                  <Avatar size={64} icon={<UserOutlined />} />
                )}
              </Col>
              <Col span={16}>
                <Typography>
                  <Typography.Title level={5}>
                    {st.st_name} &nbsp;&nbsp;
                    <Link
                      onClick={() => {
                        deleteEnroll(st.st_id);
                      }}
                    >
                      <DeleteOutlined />
                      移除
                    </Link>
                  </Typography.Title>
                  <Typography.Paragraph>
                    {st.st_description}
                  </Typography.Paragraph>
                </Typography>
              </Col>
            </Row>
            <br />
          </div>
        ))}
      </Card>
      <br />
      <Card bordered={false} title="其他操作">
        <List size="large">
          <List.Item onClick={() => setChangeContact(true)}>
            <List.Item.Meta
              title="设置我的联系方式"
              description="社团管理员导出信息时，与您取得联系的唯一方式。注意：您加入的所有社团共享着您的相同联系方式。"
            />
          </List.Item>
          <List.Item onClick={() => setChangePassword(true)}>
            <List.Item.Meta
              title="修改/设置密码"
              description="若设置密码后，下次登录需使用密码登录而不是验证您的姓名，以防有人篡改您的信息。"
            />
          </List.Item>
        </List>
      </Card>

      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <Button danger size="large" shape="round" onClick={logout} block>
          &nbsp; 退出登录 &nbsp;
        </Button>
      </div>

      <Modal
        title="修改密码"
        open={changePassword}
        onOk={confirmChangePassword}
        onCancel={() => setChangePassword(false)}
        loading={loading}
      >
        <br />
        <Form form={changePasswordForm}>
          <Form.Item label="旧密码(若没有请留空)" name="oldPassword">
            <Input.Password placeholder="请输入旧密码" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[{ required: true, message: "请输入新密码" }]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            label="确认密码"
            name="newPasswordConfirm"
            rules={[{ required: true, message: "请再次输入新密码" }]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="设置联系方式"
        open={changeContact}
        onOk={confirmContact}
        onCancel={() => setChangeContact(false)}
        loading={loading}
      >
        <br />
        <Input.TextArea
          placeholder="请输入你的联系方式(QQ、微信、手机号 或是其他)"
          onChange={(e) => setContact(e.target.value)}
        />
      </Modal>
    </div>
  );
}
