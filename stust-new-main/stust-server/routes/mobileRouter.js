const { Router } = require("express");
const mobileRouter = Router();
const { auth, captchaMiddleware, nonMandatoryAuth } = require("../middleware");
const uuid = require("uuid");
const { appConfig } = require("../config");

mobileRouter.get("/user/:user_id", captchaMiddleware, async (req, res) => {
  const [rows] = await req.pool.query(
    "SELECT * FROM tb_user WHERE user_id = ? AND user_type = 1",
    [req.params.user_id]
  );
  if (rows.length === 0) {
    res.json({
      code: 404,
      message: "没有找到这个用户",
    });
  } else {
    res.json({
      code: 200,
      data: {
        username: rows[0].user_name[0],
        needPassword:
          rows[0].user_password != null && rows[0].user_password.length > 0,
      },
    });
  }
});

mobileRouter.post("/login", async (req, res) => {
  const [rows] = await req.pool.query(
    "SELECT * FROM tb_user WHERE user_id = ? AND user_type = 1",
    [req.body.userId]
  );
  if (rows.length === 0) {
    res.json({
      code: 404,
      message: "没有找到这个用户",
    });
  } else if (
    rows[0].user_password &&
    rows[0].user_password === req.body.password
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
  } else if (
    !rows[0].user_password &&
    rows[0].user_name === req.body.username
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
      code: 201,
      message: "登录信息不匹配",
    });
  }
});

mobileRouter.get("/st", async (req, res) => {
  const [rows] = await req.pool.query(
    "SELECT st_id,st_name,st_logo,st_description FROM tb_st"
  );
  res.json({
    code: 200,
    data: rows,
  });
});

mobileRouter.get("/st/:st_id", nonMandatoryAuth, async (req, res) => {
  const [rows] = await req.pool.query(
    "SELECT st_id,st_name,st_logo,st_description,st_detail FROM tb_st WHERE st_id = ?",
    [req.params.st_id]
  );
  if (rows.length === 0) {
    return res.json({
      code: 404,
      message: "没有找到这个社团",
    });
  }
  const isAuth = req.user && req.user.user_type === 1;
  if (isAuth) {
    const [isEnroll] = await req.pool.query(
      "SELECT * FROM tb_user_st WHERE user_id = ? AND st_id = ?",
      [req.user.user_id, req.params.st_id]
    );
    res.json({
      code: 200,
      data: {
        ...rows[0],
        isEnroll: isEnroll.length > 0,
        isAuth,
      },
    });
  } else {
    res.json({
      code: 200,
      data: {
        ...rows[0],
        isAuth,
      },
    });
  }
});

mobileRouter.post("/enroll/:st_id", auth, async (req, res) => {
  const [rows] = await req.pool.query(
    "SELECT * FROM tb_user_st WHERE user_id = ?",
    [req.user.user_id]
  );
  if (rows.length >= appConfig.maxEnrollST) {
    res.json({
      code: 403,
      message: "报名社团数量已达上限",
    });
    return;
  }
  if (rows.some((row) => row.st_id === req.params.st_id)) {
    res.json({
      code: 403,
      message: "已经报名过这个社团",
    });
    return;
  }
  const [result] = await req.pool.query(
    "INSERT INTO tb_user_st(user_id,st_id,create_time) VALUES(?,?,now())",
    [req.user.user_id, req.params.st_id]
  );
  if (result.affectedRows === 1) {
    //---------------------------更新日志--------------------------------
    await req.pool.query(
      "UPDATE tb_st SET st_count = st_count + 1 WHERE st_id = ?",
      [req.params.st_id]
    );
    await req.pool.query(
      "UPDATE tb_user SET user_count = user_count + 1 WHERE user_id = ?",
      [req.user.user_id]
    );
    await req.pool.query(
      "INSERT INTO tb_log(log_user_id,log_st_id,log_time,log_content) VALUES(?,?,now(),?)",
      [
        req.user.user_id,
        req.params.st_id,
        `用户${req.user.user_name}报名了社团${req.params.st_id}`,
      ]
    );
    await req.pool.query(
      `INSERT INTO tb_statistics(time_slot,insert_count)
      VALUES(DATE_FORMAT(now(), '%Y-%m-%d %H:00:00') + INTERVAL FLOOR(MINUTE(now()) / 30) * 30 MINUTE,1)
      ON DUPLICATE KEY UPDATE insert_count = insert_count + 1`
    );
    //---------------------------更新日志结束----------------------------
    res.json({
      code: 200,
      message: "报名成功",
    });
  } else {
    res.json({
      code: 500,
      message: "报名失败",
    });
  }
});

mobileRouter.delete("/enroll/:st_id", auth, async (req, res) => {
  const [result] = await req.pool.query(
    "DELETE FROM tb_user_st WHERE user_id = ? AND st_id = ?",
    [req.user.user_id, req.params.st_id]
  );
  if (result.affectedRows === 1) {
    //---------------------------更新日志------------------------------
    await req.pool.query(
      "UPDATE tb_st SET st_count = st_count - 1 WHERE st_id = ?",
      [req.params.st_id]
    );
    await req.pool.query(
      "UPDATE tb_user SET user_count = user_count - 1 WHERE user_id = ?",
      [req.user.user_id]
    );
    await req.pool.query(
      "INSERT INTO tb_log(log_user_id,log_st_id,log_time,log_content) VALUES(?,?,now(),?)",
      [
        req.user.user_id,
        req.params.st_id,
        `用户${req.user.user_name}取消报名了社团${req.params.st_id}`,
      ]
    );
    await req.pool.query(
      `INSERT INTO tb_statistics(time_slot,insert_count)
      VALUES(DATE_FORMAT(now(), '%Y-%m-%d %H:00:00') + INTERVAL FLOOR(MINUTE(now()) / 30) * 30 MINUTE,1)
      ON DUPLICATE KEY UPDATE insert_count = insert_count + 1`
    );
    //---------------------------更新日志结束----------------------------
    res.json({
      code: 200,
      message: "取消报名成功",
    });
  } else {
    res.json({
      code: 500,
      message: "取消报名失败",
    });
  }
});

mobileRouter.get("/enroll", auth, async (req, res) => {
  const [rows] = await req.pool.query(
    "SELECT st_id,st_name,st_logo,st_description FROM tb_st WHERE st_id IN (SELECT st_id FROM tb_user_st WHERE user_id = ?)",
    [req.user.user_id]
  );
  res.json({
    code: 200,
    data: rows,
  });
});

mobileRouter.post("/changePassword", auth, async (req, res) => {
  if (
    req.user.user_password === req.body.oldPassword ||
    !req.user.user_password
  ) {
    const [result] = await req.pool.query(
      "UPDATE tb_user SET user_password = ? WHERE user_id = ?",
      [req.body.newPassword, req.user.user_id]
    );
    if (result.affectedRows === 1) {
      res.json({
        code: 200,
        message: "修改密码成功",
      });
    } else {
      res.json({
        code: 500,
        message: "修改密码失败",
      });
    }
  } else {
    res.json({
      code: 201,
      message: "旧密码错误",
    });
  }
});

mobileRouter.post("/logout", auth, async (req, res) => {
  const [result] = await req.pool.query(
    "UPDATE tb_user SET user_token = null WHERE user_id = ?",
    [req.user.user_id]
  );
  if (result.affectedRows === 1) {
    res.json({
      code: 200,
      message: "登出成功",
    });
  } else {
    res.json({
      code: 500,
      message: "登出失败",
    });
  }
});

mobileRouter.post("/changeContact", auth, async (req, res) => {
  const [result] = await req.pool.query(
    "UPDATE tb_user SET user_contact = ? WHERE user_id = ?",
    [req.body.contact, req.user.user_id]
  );
  if (result.affectedRows === 1) {
    res.json({
      code: 200,
      message: "修改联系方式成功",
    });
  } else {
    res.json({
      code: 500,
      message: "修改联系方式失败",
    });
  }
});

exports.mobileRouter = mobileRouter;
