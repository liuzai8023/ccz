import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Button, Card, Form, Input, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { request } from "/src/util/request";
import { useNavigate } from "react-router-dom";
import { getAppConfig } from "/src/util/config";

interface FormValues {
  userId: string;
  password: string;
}

export default function PLogin() {
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<HCaptcha>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [needCaptcha, setNeedCaptcha] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAppConfig("useCaptcha")
      .then((res) => setNeedCaptcha(Boolean(res)))
      .finally(() => setLoading(false));
  }, []);

  const onFinish = (values: FormValues) => {
    if (!values.userId || !values.password) {
      message.error("请输入用户名和密码");
      return;
    }
    if (!captchaToken && needCaptcha) {
      message.error("请完成验证码");
      return;
    }
    setLoading(true);
    request({
      url: "/pc/login",
      headers: {
        "h-captcha-token": captchaToken,
      },
      method: "POST",
      data: values,
    })
      .then((res) => {
        if (res.code !== 200 && needCaptcha) {
          captchaRef.current && captchaRef.current.resetCaptcha();
          return;
        }
        localStorage.setItem("token", res.data);
        navigate("/pc/board");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#F9F9F9",
      }}
    >
      <Card
        title="登录"
        style={{ width: 500, margin: "100px auto", padding: "30px" }}
      >
        <Form
          layout="vertical"
          size="large"
          style={{ width: "303px", margin: "0 auto" }}
          onFinish={onFinish}
        >
          <Form.Item label="用户名" name="userId">
            <Input type="text" />
          </Form.Item>
          <Form.Item label="密码" name="password">
            <Input.Password />
          </Form.Item>
          {needCaptcha && (
            <Form.Item>
              <div style={{ textAlign: "center" }}>
                <HCaptcha
                  sitekey="0ea89674-3aa0-46d0-8ef4-b81e50a66484"
                  onVerify={(token) => setCaptchaToken(token)}
                  ref={captchaRef}
                />
              </div>
            </Form.Item>
          )}
          <Form.Item>
            <Button
              block
              type="primary"
              htmlType="submit"
              disabled={!captchaToken}
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
