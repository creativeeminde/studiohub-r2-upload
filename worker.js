
const ALLOWED_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v"
};

const MAX_BYTES = 95 * 1024 * 1024;

export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, X-File-Name"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);

    if (
      url.pathname !== "/upload" ||
      request.method !== "POST"
    ) {
      return Response.json(
        { error: "Not found" },
        { status: 404, headers }
      );
    }

    const filename =
      request.headers.get("X-File-Name") || "";

    const extension = filename
      .split(".")
      .pop()
      .toLowerCase();

    const contentType = (
      request.headers.get("Content-Type") || ""
    ).split(";")[0].trim().toLowerCase();

    const expectedType = ALLOWED_TYPES[extension];

    if (!expectedType) {
      return Response.json(
        { error: "Unsupported file format" },
        { status: 400, headers }
      );
    }

    const isImage = expectedType.startsWith("image/");
    const isVideo = expectedType.startsWith("video/");

    const validType =
      contentType === expectedType ||
      (extension === "mov" &&
        contentType === "video/mp4") ||
      (extension === "m4v" &&
        contentType === "video/mp4");

    if (!validType) {
      return Response.json(
        { error: "File type does not match extension" },
        { status: 400, headers }
      );
    }

    const size = Number(
      request.headers.get("Content-Length")
    );

    if (
      !Number.isFinite(size) ||
      size <= 0 ||
      size > MAX_BYTES
    ) {
      return Response.json(
        { error: "Invalid file size or file too large" },
        { status: 413, headers }
      );
    }

    const folder = isImage ? "images" : "clips";

    const key =
      `${folder}/${crypto.randomUUID()}.${extension}`;

    try {
      await env.BUCKET.put(key, request.body, {
        httpMetadata: {
          contentType: expectedType
        }
      });

      return Response.json(
        {
          success: true,
          key
        },
        { headers }
      );

    } catch (error) {
      console.error("R2 upload failed:", error);

      return Response.json(
        { error: "Upload failed" },
        { status: 500, headers }
      );
    }
  }
};
