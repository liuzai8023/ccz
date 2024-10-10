exports.hCaptchaConfig = {
  url: "https://api.hcaptcha.com/siteverify/",
  secretKey: "ES_6eb0ccbc14f24ea194c0bdc78887a402",
};

exports.mysqlConfig = {
  host: `bj-cynosdbmysql-grp-exfe67co.sql.tencentcdb.com`,
  port: 28628,
  user: "stzs",
  password: "Stzs123.",
  database: "stust_new",
};

exports.appConfig = {
  port: 3000,
  maxEnrollST: 2,
  useCaptcha: true,
  cacheAuthListMax: 100,
};

exports.s3Config = {
  region: "auto",
  endpoint: `https://b273b870ff6c252493eeee485bd4bcc8.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: "80fd4e30b98709f6c9ed9184fcf3ce39",
    secretAccessKey:
      "acd9421fe25d486d1920c2da1ba6d49d87f331e0f55879f6129d84322bd4b98c",
  },
  bucket: "stust",
  customVisitUrl: "https://stust-r2.magicalcarl.com",
};

exports.Bark_Device_Key = "7aRBPcY7AXTG3RjHPUYKFm";
