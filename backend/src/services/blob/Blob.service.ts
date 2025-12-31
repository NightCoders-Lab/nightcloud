import type { Blob } from "@/domain/blobs/blob";
import { BlobRepository } from "@/repositories/BlobRepository";

export class BlobService {
  private static get repo() {
    return BlobRepository;
  }

  static async getBlobById(id: Blob["id"]): Promise<Blob | null> {
    return await this.repo.findById(id);
  }
}
