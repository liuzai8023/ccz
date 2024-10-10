import { DownloadOutlined } from "@ant-design/icons";
import { Button, Card, Spin } from "antd";
import { useState } from "react";
import { request } from "/src/util/request";
import ExcelJS from "exceljs";

export default function DataExport() {
  const [loading, setLoading] = useState(false);
  const exportData = async () => {
    setLoading(true);
    const res = await request({
      url: "/pc/export",
      method: "get",
    }).finally(() => {
      setLoading(false);
    });
    if (res.code !== 200) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("data");
    worksheet.columns = res.data.columns.map((item: string) => ({
      header: item,
      key: item,
    }));
    res.data.rows.forEach((row: string[]) => {
      worksheet.addRow(row);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "export.xlsx";
    link.click();
  };
  return (
    <div style={{ padding: "20px" }}>
      <Spin spinning={loading} fullscreen />
      <Card title="导出数据">
        <p>**提示：导出用户选择社团的数据会消耗大量的系统资源，请勿频繁导出!</p>
        <Button
          type="primary"
          style={{ marginBottom: "20px" }}
          icon={<DownloadOutlined />}
          onClick={exportData}
        >
          导出用户数据
        </Button>
      </Card>
    </div>
  );
}
