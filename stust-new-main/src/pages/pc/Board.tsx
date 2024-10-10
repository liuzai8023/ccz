import { Card, Col, Row, Spin, Result } from "antd";
import { Line, Pie } from "@ant-design/plots";
import { useEffect, useState } from "react";
import { request } from "/src/util/request";

interface Data {
  genderRows: [];
  logRows: {
    log_id: number;
    log_content: string;
  }[];
  statisticsRows: {
    time_slot: string;
  }[];
}

export default function Board() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Data>();
  const getData = () => {
    setLoading(true);
    request({
      url: "/pc/statistics",
      method: "get",
    })
      .then((res) => {
        if (res.code !== 200) return;
        res.data.statisticsRows.forEach((item: { time_slot: string }) => {
          const time = item.time_slot;
          item.time_slot = time.replace("T", " ").slice(5, 16);
        });
        setData(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getData();
  }, []);

  if (loading) return <Spin fullscreen />;
  if (!data) return <Result status="warning" title="发生了异常，请稍后重试" />;
  return (
    <div style={{ padding: "20px" }}>
      {/* <Card>
        <Form layout="inline">
          <Form.Item label="时间段">
            <TimePicker.RangePicker />
          </Form.Item>
          <Form.Item label="社团">
            <Select style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary">查询</Button>
          </Form.Item>
        </Form>
      </Card>
      <br /> */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="按时间统计登记情况">
            <Line
              data={data.statisticsRows}
              xField="time_slot"
              yField="insert_count"
              height={300}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="男女比例">
            <Pie
              data={data.genderRows}
              angleField="count"
              colorField="user_gender"
              height={300}
            />
          </Card>
        </Col>
      </Row>
      <br />
      <Card title="系统日志-最近十条">
        {data.logRows.map((item) => (
          <p key={item.log_id}>{item.log_content}</p>
        ))}
      </Card>
    </div>
  );
}
