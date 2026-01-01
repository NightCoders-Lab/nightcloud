import { FileCategory } from "./fileCategories";

export const extCatOverride: Record<
  string,
  Record<string, FileCategory>
> = {
  m: {
    "text/x-objective-c": FileCategory.Code,
    "application/x-matlab-data": FileCategory.Data,
  },

  pl: {
    "text/x-perl": FileCategory.Code,
    "audio/x-playlist": FileCategory.Audio,
  },

  key: {
    "application/vnd.apple.keynote": FileCategory.Presentation,
    "application/x-pem-file": FileCategory.Key,
  },
};
