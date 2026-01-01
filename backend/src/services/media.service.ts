import db from "@/lib/db";
import { boardsTable, cardsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class ServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

const entityConfig = {
  board: {
    table: boardsTable,
    urlField: "backgroundUrl" as const,
    publicIdField: "backgroundPublicId" as const,
    authorization: true as const,
  },
  card: {
    table: cardsTable,
    urlField: "coverUrl" as const,
    publicIdField: "coverPublicId" as const,
    authorization: false as const,
  },
} as const;

export async function saveImage(userSub: string, type: "board" | "card", id: string, secure_url: string, public_id: string) {
  const config = entityConfig[type];
  if (!config) throw new ServiceError("Invalid type", 400);

  const entity = await db
    .select()
    .from(config.table)
    .where(eq(config.table.id, id))
    .then((r) => r[0]);

  if (!entity) {
    await deleteFromCloudinary(public_id);
    throw new ServiceError(`Không tìm thấy ${type}`, 404);
  }

  if (config.authorization && entity.userId !== userSub) {
    await deleteFromCloudinary(public_id);
    throw new ServiceError(`Không có quyền upload ảnh của ${type} này`, 403);
  }

  if (entity[config.publicIdField as keyof typeof entity])
    await deleteFromCloudinary(entity[config.publicIdField as keyof typeof entity] as string);

  const updated = await db
    .update(config.table)
    .set({
      [config.urlField]: secure_url,
      [config.publicIdField]: public_id,
    } as any)
    .where(eq(config.table.id, id))
    .returning({
      [config.urlField]: config.table[config.urlField as keyof typeof entity],
      [config.publicIdField]: config.table[config.publicIdField as keyof typeof entity],
    })
    .then((r) => r[0]);

  return updated;
}

export async function deleteImage(userSub: string, type: "board" | "card", id: string) {
  const config = entityConfig[type];
  if (!config) throw new ServiceError("Invalid type", 400);

  const entity = await db
    .select()
    .from(config.table)
    .where(eq(config.table.id, id))
    .then((r) => r[0]);
  if (!entity) throw new ServiceError(`Không tìm thấy ${type}`, 404);
  if (config.authorization && entity.userId !== userSub) throw new ServiceError(`Không có quyền xóa ảnh của ${type} này`, 403);

  if (entity[config.publicIdField as keyof typeof entity])
    await deleteFromCloudinary(entity[config.publicIdField as keyof typeof entity] as string);

  await db
    .update(config.table)
    .set({ [config.urlField]: null, [config.publicIdField]: null } as any)
    .where(eq(config.table.id, id));

  return { message: "Xóa ảnh thành công" };
}
