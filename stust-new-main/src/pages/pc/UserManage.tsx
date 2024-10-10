import {
  Card,
  Table,
  TableColumnsType,
  Form,
  Select,
  Button,
  Input,
  Drawer,
  Flex,
  Spin,
} from "antd";
import ExcelJS from "exceljs";
import { useEffect, useState } from "react";
import { request } from "/src/util/request";

interface User {
  user_id?: string;
  user_name?: string;
  user_type?: number; // 0管理员,1学生, 2社团
  user_gender?: string;
  user_password?: string;
  user_token?: string;
  user_count?: number;
  user_contact?: string;
  user_addition?: string;
  isNew?: boolean;
}

interface QueryParam {
  page: number;
  pageSize: number;
  user_name?: string;
  user_type?: number;
  user_id?: string;
}

export default function UserManage() {
  const [queryParam, setQueryParam] = useState<QueryParam>({
    page: 1,
    pageSize: 10,
    user_name: "",
    user_type: 1,
    user_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [userDetail, setUserDetail] = useState<User | null>(null);

  useEffect(() => {
    searchData();
  }, []);

  const searchData = (values?: QueryParam) => {
    if (values) {
      setQueryParam({ ...queryParam, ...values });
    }
    setLoading(true);
    request({
      url: "/pc/user/list",
      params: { ...queryParam, ...values },
    })
      .then((res) => {
        if (res.code !== 200) return;
        const { rows, total } = res.data;
        setList(rows);
        setTotal(total);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const finishEdit = (values: User) => {
    if (!values) return;
    setLoading(true);
    request({
      url: userDetail!.isNew ? "/pc/user/add" : "/pc/user/update",
      method: "POST",
      data: userDetail!.isNew ? [values] : values,
    })
      .then((res) => {
        if (res.code === 200) {
          searchData();
          setUserDetail(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const deleteUser = (user_id: string) => {
    setLoading(true);
    request({
      url: "/pc/user/delete",
      method: "POST",
      data: { user_id },
    })
      .then((res) => {
        if (res.code === 200) {
          searchData();
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const importExcel = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx";
    input.click();
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.files) {
        setLoading(true);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await target.files[0].arrayBuffer());
        const worksheet = workbook.getWorksheet(1);
        console.log(worksheet);
        if (!worksheet) return;
        const data: User[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          data.push({
            user_id: row.getCell(1).text.toString(),
            user_name: row.getCell(2).text.toString(),
            user_type: Number(row.getCell(3).value),
            user_gender: row.getCell(4).text.toString(),
            user_addition:
              Array.isArray(row.values) && row.values.length > 4
                ? row.values.slice(5).join(",")
                : "",
          });
        });
        request({
          url: "/pc/user/add",
          method: "POST",
          data,
        })
          .then((res) => {
            if (res.code === 200) {
              searchData();
            }
          })
          .finally(() => {
            setLoading(false);
          });
      }
    };
  };
  const createTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    worksheet.columns = [
      { header: "ID/学号", key: "user_id", width: 30 },
      { header: "姓名", key: "user_name", width: 30 },
      { header: "类型（0管理员,1学生, 2社团）", key: "user_type", width: 30 },
      { header: "性别", key: "user_gender", width: 30 },
      { header: "其他信息1（标题可更改）", key: "user_addition1", width: 30 },
      { header: "其他信息2（标题可更改）", key: "user_addition2", width: 30 },
      { header: "其他信息3（标题可更改）", key: "user_addition3", width: 30 },
      { header: "其他信息...（数量任意）", key: "user_addition3", width: 30 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "UserTemplate.xlsx";
    link.click();
  };

  const columns: TableColumnsType<User> = [
    {
      title: "ID/学号",
      dataIndex: "user_id",
      key: "user_id",
      align: "center",
    },
    {
      title: "姓名",
      dataIndex: "user_name",
      key: "user_name",
      align: "center",
      render: (_text: string, record: User) => (
        <a onClick={() => setUserDetail({ ...record, isNew: false })}>
          {record.user_name}
        </a>
      ),
    },
    {
      title: "用户类型",
      dataIndex: "user_type",
      key: "user_type",
      align: "center",
      render: (text: number) => {
        switch (text) {
          case 0:
            return "管理员";
          case 1:
            return "学生";
          case 2:
            return "社团";
          default:
            return "未知";
        }
      },
    },
    {
      title: "登记数量",
      dataIndex: "user_count",
      key: "user_count",
      align: "center",
    },
    {
      title: "操作",
      dataIndex: "opt",
      key: "opt",
      render: (_text: string, record: User) => (
        <a onClick={() => deleteUser(record.user_id!)}>删除</a>
      ),
      align: "center",
    },
  ];
  return (
    <div style={{ padding: "20px" }}>
      <Card>
        <Form layout="inline" onFinish={searchData} initialValues={queryParam}>
          <Form.Item label="姓名" name="user_name">
            <Input allowClear />
          </Form.Item>
          <Form.Item label="用户ID" name="user_id">
            <Input allowClear />
          </Form.Item>
          <Form.Item label="用户类型" name="user_type">
            <Select style={{ width: 120 }} allowClear>
              <Select.Option value={0}>管理员</Select.Option>
              <Select.Option value={1}>学生</Select.Option>
              <Select.Option value={2}>社团</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Flex gap="small">
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button onClick={createTemplate}>下载导入模板</Button>
              <Button onClick={importExcel}>导入</Button>
              <Button onClick={() => setUserDetail({ isNew: true })}>
                单个新增
              </Button>
            </Flex>
          </Form.Item>
        </Form>
        <Table
          dataSource={list}
          columns={columns}
          loading={loading}
          pagination={{
            current: queryParam.page,
            pageSize: queryParam.pageSize,
            total: total,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              searchData({ page, pageSize });
            },
            onShowSizeChange: (page, pageSize) => {
              searchData({ page, pageSize });
            },
          }}
        />
      </Card>
      <Drawer
        title="用户详情"
        open={userDetail != null}
        onClose={() => setUserDetail(null)}
        width={500}
        loading={loading}
      >
        {userDetail ? (
          <Form initialValues={userDetail} onFinish={finishEdit}>
            <Form.Item label="ID/学号" name="user_id">
              <Input />
            </Form.Item>
            <Form.Item label="用户姓名" name="user_name">
              <Input />
            </Form.Item>
            <Form.Item label="用户密码" name="user_password">
              <Input.Password />
            </Form.Item>
            <Form.Item label="用户类型" name="user_type">
              <Select>
                <Select.Option value={0}>管理员</Select.Option>
                <Select.Option value={1}>学生</Select.Option>
                <Select.Option value={2}>社团</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="用户性别" name="user_gender">
              <Input />
            </Form.Item>
            <Form.Item label="联系方式" name="user_contact">
              <Input />
            </Form.Item>
            <Form.Item label="其他信息" name="user_addition">
              <Input.TextArea />
            </Form.Item>
            <Form.Item style={{ textAlign: "center" }}>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Spin />
        )}
      </Drawer>
    </div>
  );
}
