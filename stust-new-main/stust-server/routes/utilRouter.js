const { Router } = require("express");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Config, appConfig } = require("../config");
const { auth } = require("../middleware");
const utilRouter = Router();

let s3Client = null;
utilRouter.post("/upload/presigned", auth, async (req, res) => {
  if (!s3Client) {
    s3Client = new S3Client(s3Config);
  }
  const key = `${Date.now()}${req.body.key}`;
  const signedUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    }),
    { expiresIn: 3600 }
  );
  res.json({
    code: 200,
    data: {
      signedUrl,
      customVisitUrl: `${s3Config.customVisitUrl}/${key}`,
    },
  });
});

utilRouter.get("/app-config", (req, res) => {
  res.json({
    code: 200,
    data: appConfig,
  });
});

exports.utilRouter = utilRouter;
