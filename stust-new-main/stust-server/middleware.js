const fetch = require("node-fetch").default;
const { hCaptchaConfig, appConfig } = require("./config");

const cacheAuthList = [];
const cacheAuthListMax = appConfig.cacheAuthListMax;
const getAuthData = async (token, pool) => {
  // 清理过期的缓存项
  const now = Date.now();
  while (cacheAuthList.length > 0 && cacheAuthList[0].expires < now) {
    cacheAuthList.shift();
  }
  // 检查缓存
  const target = cacheAuthList.find((item) => item.token === token);
  if (target) return target;
  // 查询数据库
  const [result] = await pool.query(
    "SELECT * FROM tb_user WHERE user_token = ?",
    token
  );
  if (result.length === 0) return null;
  // 添加到缓存
  while (cacheAuthList.length >= cacheAuthListMax) {
    cacheAuthList.shift();
  }
  cacheAuthList.push({
    token,
    user: result[0],
    expires: now + 1000 * 60 * 60,
  });
  return { user: result[0], expires: now + 1000 * 60 * 60 };
};

exports.auth = async function (req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.json({ message: "未登录", code: 401 });
  }
  const target = await getAuthData(token, req.pool);
  if (target) {
    req.user = target.user;
    res.setHeader("cache-auth-expires", target.expires);
    res.setHeader("cache-auth-hit", "true");
    res.setHeader("user-id", target.user.user_id);
    next();
    return;
  } else {
    return res.json({ message: "登录已过期", code: 401 });
  }
};

// 用于非强制登录的接口
exports.nonMandatoryAuth = async function (req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    next();
    return;
  }
  const target = await getAuthData(token, req.pool);
  if (target) {
    req.user = target.user;
    res.setHeader("cache-auth-expires", target.expires);
    res.setHeader("cache-auth-hit", "true");
    res.setHeader("user-id", target.user.user_id);
  }
  next();
};

exports.sqlInjectionMiddleware = function (keys) {
  return function (req, res, next) {
    const values = [];
    Object.keys(req.body).forEach((key) => {
      if (keys.includes(key)) {
        values.push(req.body[key]);
      }
    });
    values.push(req.url);
    const isInjection = values.some((value) => {
      return /(.*=.*--.*)|(.*(\+|-).*)|(.*\w+(%|\$|#|&)\w+.*)|(.*\|\|.*)|(.*\s+(and|or)\s+.*)|(.*\b(select|update|union|and|or|delete|insert|trancate|char|into|substr|ascii|declare|exec|count|master|into|drop|execute)\b.*)/.test(
        value
      );
    });
    if (isInjection) {
      return res.status(400).end();
    }
    next();
  };
};

exports.captchaMiddleware = async function (req, res, next) {
  if (!appConfig.useCaptcha) {
    next();
    return;
  }
  const captchaToken = req.headers["h-captcha-token"];
  if (!captchaToken) {
    return res
      .status(400)
      .json({ message: "No captcha token provided", code: 400 });
  }
  try {
    const result = await fetch(hCaptchaConfig.url, {
      method: "POST",
      body: `secret=${hCaptchaConfig.secretKey}&response=${captchaToken}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).then((res) => res.json());
    if (!result.success) {
      return res.json({ message: "验证失效，请重新验证", code: 201 });
    }
    req.captcha = result;
    next();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", code: 500 });
  }
};
