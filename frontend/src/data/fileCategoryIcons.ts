import type { FileCategory } from "./fileCategories";
import {
  FaFileZipper,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFilePdf,
  FaDatabase,
  FaFileCode,
  FaKey,
  FaQuestion,
} from "react-icons/fa6";
import type { IconType } from "react-icons/lib";

export const FileCategoryIcons: Record<FileCategory, IconType> = {
  image: FaFileImage,
  video: FaFileVideo,
  audio: FaFileAudio,

  document: FaFilePdf,
  spreadsheet: FaDatabase,
  presentation: FaFilePdf,
  ebook: FaFilePdf,

  archive: FaFileZipper,
  compressed: FaFileZipper,

  executable: FaFileCode,
  installer: FaFileZipper,

  font: FaFileCode,

  code: FaFileCode,
  text: FaFilePdf,
  config: FaFileCode,
  data: FaDatabase,

  "disk-image": FaFileZipper,
  database: FaDatabase,

  backup: FaFileZipper,
  log: FaFilePdf,

  shortcut: FaFileZipper,

  certificate: FaKey,
  key: FaKey,

  unknown: FaQuestion,
};
