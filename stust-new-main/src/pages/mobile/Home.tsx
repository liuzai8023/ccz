import { Avatar, Card, Col, Row, Spin, Typography } from "antd";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";

import { useNavigate } from "react-router-dom";
import { request } from "/src/util/request";
import { useEffect, useState } from "react";

interface ST {
  st_id: string;
  st_logo: string;
  st_name: string;
  st_description: string;
}

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stList, setSTList] = useState<ST[]>([]);
  const [filterList, setFilterList] = useState<ST[]>([]);

  const getSTList = () => {
    setLoading(true);
    request({
      url: "/mobile/st",
      method: "GET",
    })
      .then((res) => {
        if (res.code !== 200) return;
        setSTList(res.data);
        setFilterList(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setFilterList(stList);
    } else {
      const filterList = stList.filter((st) => st.st_name.includes(value));
      setFilterList(filterList);
    }
  };
  const gotoDetail = (st_id: string) => {
    // if (!window.localStorage.getItem("token")) {
    //   Modal.confirm({
    //     title: "请登录",
    //     content: "您还未登录，是否前往登录？",
    //     onOk() {
    //       navigate("/mobile/login");
    //     },
    //   });
    //   return;
    // }
    navigate("/mobile/st-detail/" + st_id);
  };

  useEffect(() => {
    getSTList();
  }, []);

  return (
    <>
      <Spin spinning={loading} fullscreen />
      <div
        style={{
          width: "100%",
          background: "#fff",
          padding: "20px",
          display: "flex",
        }}
      >
        <SearchOutlined />
        &nbsp;
        <input
          type="text"
          style={{ border: 0, flex: "1", outline: "none", fontSize: "16px" }}
          placeholder="输入社团名称进行筛选"
          onInput={handleSearchInput}
        />
      </div>
      <div style={{ padding: "10px", width: "100%" }}>
        {filterList.map((st) => (
          <Card
            bordered={false}
            style={{ marginBottom: "10px" }}
            onClick={() => gotoDetail(st.st_id)}
            key={st.st_id}
          >
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
                  <Typography.Title level={5}>{st.st_name}</Typography.Title>
                  <Typography.Paragraph>
                    {st.st_description}
                  </Typography.Paragraph>
                </Typography>
              </Col>
            </Row>
          </Card>
        ))}
      </div>
    </>
  );
}
