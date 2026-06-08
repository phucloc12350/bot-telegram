import { prisma } from '@/lib/db';
import { z } from 'zod';
import { ApiError } from '@/lib/apiError';

export const botSettingSchema = z.object({
  botName: z.string().min(1, 'Tên bot không được trống').max(100),
  botType: z.enum(['GOLD', 'FUEL', 'ALERT', 'MANUAL', 'OTHER']),
  chatId: z.string().min(1, 'Chat ID không được trống'),
  isActive: z.boolean().optional().default(true),
  cronExpression: z.string().nullish(),
  alertCondition: z.any().nullish(),
  messageTemplate: z.string().nullish(),
});

export async function listBotSettings() {
  const rows = await prisma.botSetting.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(serialize);
}

export async function createBotSetting(input) {
  const data = botSettingSchema.parse(input);
  const row = await prisma.botSetting.create({ data });
  return serialize(row);
}

export async function updateBotSetting(id, input) {
  const data = botSettingSchema.partial().parse(input);
  const row = await prisma.botSetting
    .update({ where: { id: Number(id) }, data })
    .catch(() => null);
  if (!row) throw new ApiError(404, 'Bot setting không tồn tại');
  return serialize(row);
}

export async function toggleBotSetting(id) {
  const cur = await prisma.botSetting.findUnique({ where: { id: Number(id) } });
  if (!cur) throw new ApiError(404, 'Bot setting không tồn tại');
  const row = await prisma.botSetting.update({
    where: { id: cur.id },
    data: { isActive: !cur.isActive },
  });
  return serialize(row);
}

export async function deleteBotSetting(id) {
  await prisma.botSetting.delete({ where: { id: Number(id) } }).catch(() => null);
  return { deleted: true };
}

function serialize(r) {
  return { ...r };
}
