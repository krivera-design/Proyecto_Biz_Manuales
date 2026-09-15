// Imported capture media.
//
// Captures live in memory as object URLs. The app re-renders its whole tree on
// every state change, so <img> nodes are cached per source and re-attached
// rather than recreated — without that, typing in the editor would make the
// preview flicker as the browser re-decoded the image on each keystroke.

import { h } from "./dom.js";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const imgCache = new Map();

// Opens the system file picker and hands back the chosen images.
export function pickImages(onFiles) {
  const input = h("input", {
    type: "file",
    accept: ACCEPT,
    multiple: true,
    style: { display: "none" },
  });
  input.addEventListener("change", () => {
    const files = [...input.files].filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
    input.remove();
  });
  document.body.appendChild(input);
  input.click();
}

export function isImageDrop(dataTransfer) {
  return [...(dataTransfer?.items || [])].some((i) => i.kind === "file");
}

export function imageFilesFrom(dataTransfer) {
  return [...(dataTransfer?.files || [])].filter((f) => f.type.startsWith("image/"));
}

export function makeShot(file) {
  return {
    kind: "shot",
    file: file.name,
    src: URL.createObjectURL(file),
    title: "",
    desc: "",
  };
}

export function releaseShot(shot) {
  if (!shot || !shot.src) return;
  imgCache.delete(shot.src);
  URL.revokeObjectURL(shot.src);
}

// The cached <img> for a capture, sized to fill its box.
export function shotImage(shot, style) {
  if (!shot || !shot.src) return null;
  let img = imgCache.get(shot.src);
  if (!img) {
    img = h("img", { src: shot.src, alt: shot.file || "", draggable: "false" });
    imgCache.set(shot.src, img);
  }
  Object.assign(img.style, {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    background: "#FFFFFF",
  }, style || {});
  return img;
}
