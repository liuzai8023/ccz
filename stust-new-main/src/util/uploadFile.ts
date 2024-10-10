import { request } from "./request";

export async function uploadFile(file: File): Promise<string> {
  const preSignedData = await request({
    url: "util/upload/presigned",
    method: "POST",
    data: {
      key: file.name,
    },
  });
  if (preSignedData.code !== 200) {
    throw new Error("Failed to get presigned URL");
  }
  const presignedUrl = preSignedData.data.signedUrl;
  const uploadResponse = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });
  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file");
  }
  return preSignedData.data.customVisitUrl;
}
