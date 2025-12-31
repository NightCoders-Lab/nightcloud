import buildRelativeNodePath from "./buildRelativePath";
import ensureNodeExt from "./ensureNodeExt";
import forEachDepthLevel from "./forEachDepthLevel";
import { parseManifest } from "./parseManifest";
import parseManifestPath from "./parseManifestPath";
import { setupAbortHandling } from "./setupAbortHandling";
import { setupClientAbort } from "./setupClientAbort";

export class NodeUtils {
  static readonly ensureNodeExt = ensureNodeExt;
  static readonly buildRelativeNodePath = buildRelativeNodePath;
  static readonly forEachDepthLevel = forEachDepthLevel;
  static readonly parseManifestPath = parseManifestPath;
  static readonly parseManifest = parseManifest;
  static readonly setupAbortHandling = setupAbortHandling;
  static readonly setupClientAbort = setupClientAbort;
}
