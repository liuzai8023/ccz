import {
  Avatar,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Modal,
  Spin,
  Table,
  TableColumnsType,
} from "antd";
import { useEffect, useState } from "react";
import { request } from "/src/util/request";
import { UserOutlined } from "@ant-design/icons";
import { uploadFile } from "/src/util/uploadFile";
import QRCode from "qrcode";
import "@wangeditor/editor/dist/css/style.css"; // 引入 css
import { Editor, Toolbar } from "@wangeditor/editor-for-react";
import { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";
type InsertFnType = (url: string, alt: string, href: string) => void;
interface StItem {
  st_logo: string;
  st_name: string;
  st_count: number;
  st_description: string;
  st_detail: string;
  st_id: string;
  isAdd?: boolean;
}

export default function StManage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stDetail, setStDetail] = useState<StItem | null>(null);
  const [qRCodeUrl, setQRCodeUrl] = useState<string | null>(null);
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const toolbarConfig: Partial<IToolbarConfig> = {
    excludeKeys: ["insertImage", "insertVideo", "uploadVideo"],
  };
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: "请输入内容...",
    MENU_CONF: {
      uploadImage: {
        customUpload(file: File, insertFn: InsertFnType) {
          uploadFile(file).then((res) => {
            insertFn(res, "", "");
          });
        },
      },
    },
  };
  const closeDetail = () => {
    setStDetail(null);
    if (editor != null) {
      editor.destroy();
      setEditor(null);
    }
  };
  const getList = () => {
    setLoading(true);
    request({
      url: "/pc/st/list",
    })
      .then((res) => {
        if (res.code !== 200) return;
        setList(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const uploadLogo = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.files) {
        setLoading(true);
        const file = target.files[0];
        uploadFile(file)
          .then((res) => {
            setStDetail({
              ...stDetail!,
              st_logo: res,
            });
          })
          .finally(() => {
            setLoading(false);
          });
      }
    };
  };
  const finishEdit = (values: StItem) => {
    if (!values) return;
    setLoading(true);
    const data = {
      ...values,
      st_logo: stDetail?.st_logo,
      st_detail: editor?.getHtml(),
    };
    request({
      url: `pc/st/${stDetail!.isAdd ? "add" : "update"}`,
      method: "POST",
      data,
    })
      .then((res) => {
        if (res.code === 200) {
          closeDetail();
          getList();
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const deleteSt = (stId: string) => {
    setLoading(true);
    request({
      url: "pc/st/delete",
      method: "POST",
      data: {
        st_id: stId,
      },
    })
      .then((res) => {
        if (res.code === 200) {
          getList();
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getList();
  }, []);

  const columns: TableColumnsType<StItem> = [
    {
      title: "Logo",
      dataIndex: "st_logo",
      key: "st_logo",
      render: (text: string) => <img src={text} style={{ width: "50px" }} />,
      align: "center",
    },
    {
      title: "社团名",
      dataIndex: "st_name",
      key: "st_name",
      render: (text: string, record: StItem) => (
        <a onClick={() => setStDetail({ ...record, isAdd: false })}>{text}</a>
      ),
      align: "center",
    },
    {
      title: "登记人数",
      dataIndex: "st_count",
      key: "st_count",
      align: "center",
    },
    {
      title: "简介",
      dataIndex: "st_description",
      key: "st_description",
      align: "center",
    },
    {
      title: "操作",
      dataIndex: "opt",
      key: "opt",
      render: (_text: string, record: StItem) => (
        <>
          <a
            onClick={() => {
              deleteSt(record.st_id);
            }}
          >
            删除
          </a>
          &nbsp;&nbsp;
          <a
            onClick={() => {
              QRCode.toDataURL(
                `${window.location.origin}/mobile/st-detail/${record.st_id}`
              ).then(setQRCodeUrl);
            }}
          >
            二维码
          </a>
        </>
      ),
      align: "center",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Spin spinning={loading} fullscreen />
      <Card>
        <div style={{ textAlign: "right" }}>
          <Button
            type="primary"
            onClick={() => {
              setStDetail({
                st_logo: "",
                st_name: "",
                st_count: 0,
                st_description: "",
                st_detail: "",
                st_id: localStorage.getItem("userId") || "",
                isAdd: true,
              });
            }}
          >
            新增
          </Button>
        </div>
        <Table dataSource={list} columns={columns} loading={loading} />
      </Card>
      <Drawer
        title="社团详情"
        open={stDetail != null}
        onClose={closeDetail}
        width="50%"
      >
        {stDetail == null ? (
          <Spin />
        ) : (
          <Form onFinish={finishEdit} initialValues={stDetail}>
            <Form.Item label="LOGO(点击更换)">
              {stDetail.st_logo ? (
                <Avatar size={64} src={stDetail.st_logo} onClick={uploadLogo} />
              ) : (
                <Avatar
                  size={64}
                  icon={<UserOutlined />}
                  onClick={uploadLogo}
                />
              )}
            </Form.Item>
            <Form.Item label="社团ID" name="st_id">
              <Input disabled={!stDetail.isAdd} />
            </Form.Item>
            <Form.Item label="社团名称" name="st_name">
              <Input />
            </Form.Item>
            <Form.Item label="社团人数" name="st_count">
              <Input disabled />
            </Form.Item>
            <Form.Item label="社团描述" name="st_description">
              <Input />
            </Form.Item>
            <Form.Item label="社团详情" name="st_detail">
              <div style={{ border: "1px solid #ccc", zIndex: 100 }}>
                <Toolbar
                  editor={editor}
                  defaultConfig={toolbarConfig}
                  mode="default"
                  style={{ borderBottom: "1px solid #ccc" }}
                />
                <Editor
                  defaultConfig={editorConfig}
                  value={stDetail.st_detail}
                  onCreated={setEditor}
                  onChange={(editor) =>
                    setStDetail({ ...stDetail, st_detail: editor.getHtml() })
                  }
                  mode="default"
                  style={{ height: "500px", overflowY: "hidden" }}
                />
              </div>
            </Form.Item>
            <Form.Item style={{ textAlign: "center" }}>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Form.Item>
          </Form>
        )}
      </Drawer>
      <Modal
        open={qRCodeUrl != null}
        onCancel={() => setQRCodeUrl(null)}
        footer={null}
      >
        <img src={qRCodeUrl!} style={{ width: "100%" }} />
      </Modal>
    </div>
  );
}
