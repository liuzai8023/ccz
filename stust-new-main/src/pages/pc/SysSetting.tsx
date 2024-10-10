import { Button, Card, Form, message } from "antd";
import { useState } from "react";
import { request } from "/src/util/request";

export default function SysSetting() {
  const [loading, setLoading] = useState(false);

  const clearUserTable = (table: string) => {
    setLoading(true);
    request({
      url: "pc/clearTable",
      method: "POST",
      data: {
        table,
      },
    })
      .then((res) => {
        if (res.code === 200) {
          message.success("清除成功");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div style={{ padding: "20px" }}>
      <Card title="清除数据-操作不可恢复">
        <Form>
          <Form.Item label="清除用户表">
            <Button
              danger
              onClick={() => clearUserTable("tb_user")}
              loading={loading}
            >
              清除
            </Button>
          </Form.Item>
          <Form.Item label="清除社团表">
            <Button
              danger
              onClick={() => clearUserTable("tb_st")}
              loading={loading}
            >
              清除
            </Button>
          </Form.Item>
          <Form.Item label="清除用户-社团关联表">
            <Button
              danger
              onClick={() => clearUserTable("tb_user_st")}
              loading={loading}
            >
              清除
            </Button>
          </Form.Item>
          <Form.Item label="清除日志表">
            <Button
              danger
              onClick={() => clearUserTable("tb_log")}
              loading={loading}
            >
              清除
            </Button>
          </Form.Item>
          <Form.Item label="清除统计表">
            <Button
              danger
              onClick={() => clearUserTable("tb_statistics")}
              loading={loading}
            >
              清除
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
