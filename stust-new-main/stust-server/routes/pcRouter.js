const { Router } = require("express");
const uuid = require("uuid");
const pcRouter = Router();
const { auth, captchaMiddleware } = require("../middleware");

pcRouter.post("/login", captchaMiddleware, async (req, res) => {
  const [rows] = await req.pool.query(
    "SELECT * FROM tb_user WHERE user_id = ? AND (user_type = 2 OR user_type = 0)",
    [req.body.userId]
  );
  if (rows.length === 0) {
    res.json({
      code: 404,
      message: "没有找到这个用户",
    });
  } else if (
    rows[0].user_password === req.body.password &&
    (rows[0].user_type === 2 || rows[0].user_type === 0)
  ) {
    const _uuid = uuid.v4();
    const [result] = await req.pool.query(
      "UPDATE tb_user SET user_token = ? WHERE user_id = ?",
      [_uuid, req.body.userId]
    );
    if (result.affectedRows === 1) {
      res.json({
        code: 200,
        message: "登录成功",
        data: _uuid,
      });
    } else {
      res.json({
        code: 500,
        message: "登录失败",
      });
    }
  } else {
    res.json({
      code: 401,
      message: "登录信息不匹配",
    });
  }
});

pcRouter.get("/statistics", auth, async (req, res) => {
  if (req.user.user_type !== 0 && req.user.user_type !== 2) {
    return res.json({
      code: 403,
      message: "没有权限",
    });
  }
  const limitUser = req.user.user_type === 2 ? req.user.user_id : "";
  // 1. 男女比例 F M
  let genderRows;
  if (!limitUser) {
    // case 1.1 无限制社团-统计全部比例-无需联表
    [genderRows] = await req.pool.query(
      `SELECT user_gender, COUNT(user_gender) as count FROM tb_user GROUP BY user_gender limit 10`
    );
  } else {
    // case 1.2 限制社团-统计社团比例-联表
    [genderRows] = await req.pool.query(
      `SELECT user_gender, COUNT(user_gender) from tb_user, tb_user_st where tb_user.user_id = tb_user_st.user_id and st_id = ?
      GROUP BY user_gender limit 10`,
      limitUser
    );
  }
  // 2. 日志
  const [logRows] = await req.pool.query(
    `SELECT * from tb_log ${
      limitUser ? `WHERE log_st_id = '${limitUser}'` : ""
    } limit 20`
  );
  // 3. 统计数据
  const [statisticsRows] = await req.pool.query(
    `SELECT * from tb_statistics limit 20 `
  );
  return res.json({
    code: 200,
    data: {
      genderRows,
      logRows,
      statisticsRows,
      type: req.user.user_type,
    },
  });
});

// 社团-查
pcRouter.get("/st/list", auth, async (req, res) => {
  if (req.user.user_type !== 0 && req.user.user_type !== 2) {
    return res.json({
      code: 403,
      message: "没有权限",
    });
  }
  const [rows] = await req.pool.query(
    `SELECT * FROM tb_st ${
      req.user.user_type === 2 ? `WHERE st_id = '${req.user.user_id}'` : ""
    }`
  );
  res.json({
    code: 200,
    data: rows,
  });
});

// 社团-增
pcRouter.post("/st/add", auth, async (req, res) => {
  if (req.user.user_id !== req.body.st_id && req.user.user_type === 2) {
    return res.json({
      code: 403,
      message: "你只能使用默认的ID",
    });
  } else if (req.user.user_type !== 0 && req.user.user_type !== 2) {
    return res.json({
      code: 403,
      message: "没有权限",
    });
  }
  const [result] = await req.pool.query(
    "INSERT INTO tb_st (st_id, st_name, st_logo, st_description, st_detail) VALUES (?, ?, ?, ?, ?)",
    [
      req.body.st_id,
      req.body.st_name,
      req.body.st_logo,
      req.body.st_description,
      req.body.st_detail,
    ]
  );
  if (result.affectedRows === 1) {
    res.json({
      code: 200,
      message: "添加成功",
    });
  } else {
    res.json({
      code: 500,
      message: "添加失败",
    });
  }
});

// 社团-改
pcRouter.post("/st/update", auth, async (req, res) => {
  if (req.user.user_type === 2 && req.user.user_id !== req.body.st_id) {
    return res.json({
      code: 403,
      message: "你只能修改自己的社团",
    });
  } else if (req.user.user_type !== 0 && req.user.user_type !== 2) {
    return res.json({
      code: 403,
      message: "没有权限",
    });
  }
  const [result] = await req.pool.query(
    "UPDATE tb_st SET st_name = ?, st_logo = ?, st_description = ?, st_detail = ? WHERE st_id = ?",
    [
      req.body.st_name,
      req.body.st_logo,
      req.body.st_description,
      req.body.st_detail,
      req.body.st_id,
    ]
  );
  if (result.affectedRows === 1) {
    res.json({
      code: 200,
      message: "更新成功",
    });
  } else {
    res.json({
      code: 500,
      message: "更新失败",
    });
  }
});

// 社团-删
pcRouter.post("/st/delete", auth, async (req, res) => {
  if (req.user.user_type !== 0) {
    return res.json({
      code: 403,
      message: "没有权限",
    });
  }
  const [result] = await req.pool.query("DELETE FROM tb_st WHERE st_id = ?", [
    req.body.st_id,
  ]);
  if (result.affectedRows === 1) {
    res.json({
      code: 200,
      message: "删除成功",
    });
  } else {
    res.json({
      code: 500,
      message: "删除失败",
    });
  }
});

// 用户-查
pcRouter.get("/user/list", auth, async (req, res) => {
  if (req.user.user_type !== 0 && req.user.user_type !== 2) {
    return res.json({
      code: 403,
      message: "没有权限",
    });
  }
  const limitUser = req.user.user_type === 2 ? req.user.user_id : "";
  const { user_id, user_name, user_type, page, pageSize } = req.query;
  const conditions = [];
  if (user_id) {
    conditions.push("user_id = " + user_id);
  }
  if (user_name) {
    conditions.push("user_name LIKE '%" + user_name + "%'");
  }
  if (user_type) {
    conditions.push("user_type = " + user_type);
  }
  if (limitUser) {
    conditions.push(
      `user_id in (SELECT user_id from tb_user_st where st_id = '${limitUser}')`
    );
  }
  const [rows] = await req.pool.query(
    `SELECT * FROM tb_user ${
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
    } LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`
  );
  const [totalRows] = await req.pool.query(
    `SELECT COUNT(*) as total FROM tb_user ${
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
    }`
  );
  res.json({
    code: 200,
    data: {
      rows,
      total: totalRows[0].total,
    },
  });
});

// 用户-增
pcRouter.post("/user/add", auth, async (req, res) => {
  if (req.user.user_type !== 0) {
    return res.json({
      code: 403,
      message: "没有权限",
    });
  }
  const insertValues = [];
  req.body.forEach((item) => {
    insertValues.push([
      item.user_id,
      item.user_name,
      item.user_type,
      item.user_gender,
      item.user_addition,
    ]);
  });
  const [result] = await req.pool.query(
    "INSERT INTO tb_user (user_id, user_name, user_type, user_gender, user_addition) VALUES ?",
    [insertValues]
  );
  if (result.affectedRows === insertValues.length) {
    res.json({
      code: 200,
      message: "添加成功",
    });
  } else {
    res.json({
      code: 500,
      message: "添加失败",
    });
  }
});

// 用户-改
pcRouter.post("/user/update", auth, async (req, res) => {
  if (
    req.user.user_type !== 0 ||
    (req.user.user_type === 2 && req.user.user_id !== req.body.user_id)
  ) {
    return res.json({
      code: 403,
      message: "没有权限",
    });
  }
  const {
    user_id,
    user_name,
    user_type,
    user_gender,
    user_password,
    user_addition,
  } = req.body;
  const [result] = await req.pool.query(
    `UPDATE tb_user SET user_name = ?, user_type = ?, user_gender = ?, user_password = ?, user_addition = ? WHERE user_id = ?`,
    [
      user_name,
      user_type,
      user_gender,
      user_password || null,
      user_addition,
      user_id,
    ]
  );
  if (result.affectedRows === 1) {
    res.json({
      code: 200,
      message: "更新成功",
    });
  } else {
    res.json({
      code: 500,
      message: "更新失败",
    });
  }
});

// 用户-删
pcRouter.post("/user/delete", auth, async (req, res) => {
  if (req.user.user_type !== 0) {
    return res.json({
      code: 403,
      message: "没有权限",
    });
  }
  const [result] = await req.pool.query(
    "DELETE FROM tb_user WHERE user_id = ?",
    [req.body.user_id]
  );
  if (result.affectedRows === 1) {
    res.json({
      code: 200,
      message: "删除成功",
    });
  } else {
    res.json({
      code: 500,
      message: "删除失败",
    });
  }
});

// 导出社团-用户表
pcRouter.get("/export", auth, async (req, res) => {
  if (req.user.user_type !== 0) {
    return res.json({
      code: 403,
      message: "没有权限",
    });
  }
  const [rows] = await req.pool.query(
    `SELECT tb_st.st_id,st_name,tb_user.user_id,user_name,user_type,user_gender,user_count,user_contact,user_addition FROM tb_user_st 
    JOIN tb_st ON tb_user_st.st_id = tb_st.st_id 
    JOIN tb_user ON tb_user.user_id = tb_user_st.user_id`
  );
  const columns = Object.keys(rows[0] || []);
  const minifyRows = rows.map((row) => {
    const user_addition = row.user_addition ? row.user_addition.split(",") : [];
    return Object.values(row).concat(user_addition);
  });
  res.json({
    code: 200,
    data: {
      columns,
      rows: minifyRows,
    },
  });
});

// 清空表
pcRouter.post("/clearTable", auth, async (req, res) => {
  if (req.user.user_type !== 0) {
    return res.json({
      code: 403,
      message: "没有权限",
    });
  }
  const { table } = req.body;
  const [result] = await req.pool.query(`DELETE FROM ${table}`);
  if (result.affectedRows > 0) {
    if (table === "tb_user") {
      await req.pool
        .query(`INSERT INTO tb_user (user_id, user_name, user_type, user_password)
        VALUES ('admin', 'admin', 0, 'admin')`);
    }
    res.json({
      code: 200,
      message: "清空成功",
      data: result.affected,
    });
  } else {
    res.json({
      code: 500,
      message: "清空失败",
    });
  }
});

// 退出登录
pcRouter.post("/logout", auth, async (req, res) => {
  const [result] = await req.pool.query(
    "UPDATE tb_user SET user_token = null WHERE user_id = ?",
    [req.user.user_id]
  );
  if (result.affectedRows === 1) {
    res.json({
      code: 200,
      message: "退出成功",
    });
  } else {
    res.json({
      code: 500,
      message: "退出失败",
    });
  }
});

exports.pcRouter = pcRouter;
