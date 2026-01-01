export const FileCategory = {
  // Media
  Image: "image",
  Video: "video",
  Audio: "audio",

  // Documents
  Document: "document",
  Spreadsheet: "spreadsheet",
  Presentation: "presentation",
  Ebook: "ebook",

  // Archives
  Archive: "archive",
  Compressed: "compressed",

  // System
  Executable: "executable",
  Installer: "installer",

  // Design
  Font: "font",

  // Code & Text
  Code: "code",
  Text: "text",
  Config: "config",
  Data: "data",

  // Misc
  DiskImage: "disk-image",
  Database: "database",
  Backup: "backup",
  Log: "log",
  Shortcut: "shortcut",

  // Security
  Certificate: "certificate",
  Key: "key",

  // Fallback
  Unknown: "unknown",
} as const;

export type FileCategory = (typeof FileCategory)[keyof typeof FileCategory];