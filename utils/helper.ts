export function convertLocalPathToUrl(localPath: string): string {
  const fileName = localPath.split("\\ImageStore\\").pop();

  if (!fileName) return "";

  return `http://www.hospitalbase.somee.com/ImageStore/${fileName}`;
}

export function extractImageValue(
  image: File | string | null | undefined
): File | string | null {
  if (image instanceof File) {
    return image;
  }

  if (typeof image === "string") {
    const parts = image.split("/");
    return parts[parts.length - 1];
  }

  return null;
}
