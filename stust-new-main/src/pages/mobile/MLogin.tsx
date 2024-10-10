import { Input, Button, Card, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import { request } from "/src/util/request";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useNavigate } from "react-router-dom";
import { getAppConfig } from "/src/util/config";

export default function MLogin() {
  const [userId, setUserId] = useState("");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    username: "",
    needPassword: false,
  });
  const [verifyStr, setVerifyStr] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [needCaptcha, setNeedCaptcha] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getAppConfig("useCaptcha")
      .then((res) => setNeedCaptcha(Boolean(res)))
      .finally(() => setLoading(false));
  }, []);

  const getUserInfo = () => {
    setLoading(true);
    request({
      url: "/mobile/user/" + userId,
      headers: {
        "h-captcha-token": captchaToken,
      },
    })
      .then((res) => {
        if (res.code !== 200 && needCaptcha) {
          captchaRef.current && captchaRef.current.resetCaptcha();
          return;
        }
        setUserInfo(res.data);
        setStep(1);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const login = () => {
    setLoading(true);
    const verify = userInfo.needPassword
      ? { password: verifyStr }
      : { username: verifyStr };
    request({
      url: "/mobile/login",
      method: "post",
      data: {
        userId,
        ...verify,
      },
    })
      .then((res) => {
        if (res.code !== 200) return;
        localStorage.setItem("token", res.data);
        navigate("/mobile", { replace: true });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const step1 = (
    <>
      <p>输入您的学号</p>
      <Input
        type="number"
        value={userId}
        onChange={(e) =>
          setUserId(e.target.value.replace(/\D/g, "").slice(0, 10))
        }
        placeholder="您的学号"
        size="large"
      />
      <br />
      {needCaptcha && <p>为了防止恶意验证，请您点击下方验证码进行验证</p>}
      {needCaptcha && (
        <div style={{ textAlign: "center" }} className="captcha">
          <HCaptcha
            sitekey="0ea89674-3aa0-46d0-8ef4-b81e50a66484"
            onVerify={(token) => setCaptchaToken(token)}
            ref={captchaRef}
          />
        </div>
      )}

      <Button
        type="primary"
        style={{ marginBottom: "20px" }}
        size="large"
        block
        onClick={getUserInfo}
        disabled={!captchaToken && needCaptcha}
      >
        登录
      </Button>
    </>
  );
  const step2 = (
    <>
      {userInfo.needPassword ? (
        <>
          <p>你貌似设置了密码，请输入你在本系统设置的密码</p>
          <Input.Password
            style={{ marginBottom: "20px" }}
            size="large"
            onChange={(e) => setVerifyStr(e.target.value)}
          />
        </>
      ) : (
        <>
          <p>为了验证是你本人，补全你的姓名</p>
          <Input
            addonBefore={userInfo.username}
            style={{ marginBottom: "20px" }}
            size="large"
            onChange={(e) => setVerifyStr(userInfo.username + e.target.value)}
          />
        </>
      )}
      <Button
        type="primary"
        style={{ marginBottom: "20px" }}
        size="large"
        block
        onClick={login}
      >
        登录
      </Button>
    </>
  );
  return (
    <Card
      title="登录账户"
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        padding: "20px",
        margin: "20px",
      }}
    >
      {step === 0 ? step1 : step2}
      <p>
        *注意：系统不会收集你的任何信息，为了验证身份，你输入的信息只会与数据库信息进行比对。
        <br />
        在之后的每一步，系统均不会要求你输入任何完整的隐私信息。
        <br />
        联系方式等任何完整的隐私信息均为可选的，并且会附详细说明。
      </p>
      <Spin spinning={loading} fullscreen />
    </Card>
  );
}
