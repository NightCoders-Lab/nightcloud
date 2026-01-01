import computeBlobIdentifiers from "./computeBlobIdentifiers";
import { validateLocalStorageKey } from "./validateLocalStorageKey";

export class BlobUtils {
  static readonly computeBlobIdentifiers = computeBlobIdentifiers;
  static readonly validateLocalStorageKey = validateLocalStorageKey;
}
