import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import {
  CreateNotificationRuleInput,
  UpdateNotificationRuleInput,
  NotificationRuleQueryInput,
} from '../schemas/validation';

export class NotificationRuleService {
  async create(userId: string, input: CreateNotificationRuleInput) {
    const rule = await prisma.notificationRule.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
        keywords: input.keywords,
        excludeKeywords: input.excludeKeywords || [],
        sourceTypes: input.sourceTypes || [],
        priority: input.priority ?? 0,
        channels: input.channels as any,
        schedule: input.schedule as any,
        quietHours: input.quietHours as any,
        batchEnabled: input.batchEnabled ?? false,
        batchInterval: input.batchInterval,
        maxPerBatch: input.maxPerBatch,
        isActive: input.isActive ?? true,
      },
    });

    return rule;
  }

  async findAll(userId: string, query: NotificationRuleQueryInput) {
    const { page = 1, limit = 20, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(isActive !== undefined && { isActive }),
    };

    const [rules, total] = await Promise.all([
      prisma.notificationRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.notificationRule.count({ where }),
    ]);

    return {
      data: rules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async findById(id: string, userId: string) {
    const rule = await prisma.notificationRule.findFirst({
      where: { id, userId },
    });

    if (!rule) {
      throw new AppError('Notification rule not found', 404, 'NOTIFICATION_RULE_NOT_FOUND');
    }

    return rule;
  }

  async update(id: string, userId: string, input: UpdateNotificationRuleInput) {
    // Check if rule exists and belongs to user
    await this.findById(id, userId);

    const rule = await prisma.notificationRule.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.keywords && { keywords: input.keywords }),
        ...(input.excludeKeywords && { excludeKeywords: input.excludeKeywords }),
        ...(input.sourceTypes && { sourceTypes: input.sourceTypes }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.channels && { channels: input.channels as any }),
        ...(input.schedule !== undefined && { schedule: input.schedule as any }),
        ...(input.quietHours !== undefined && { quietHours: input.quietHours as any }),
        ...(input.batchEnabled !== undefined && { batchEnabled: input.batchEnabled }),
        ...(input.batchInterval !== undefined && { batchInterval: input.batchInterval }),
        ...(input.maxPerBatch !== undefined && { maxPerBatch: input.maxPerBatch }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    return rule;
  }

  async delete(id: string, userId: string) {
    // Check if rule exists and belongs to user
    await this.findById(id, userId);

    await prisma.notificationRule.delete({
      where: { id },
    });

    return { success: true, message: 'Notification rule deleted successfully' };
  }

  async getStats(id: string, userId: string) {
    // Check if rule exists and belongs to user
    await this.findById(id, userId);

    const notificationCount = await prisma.notificationHistory.count({
      where: { notificationRuleId: id },
    });

    const lastTriggered = await prisma.notificationHistory.findFirst({
      where: { notificationRuleId: id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return {
      totalNotifications: notificationCount,
      lastTriggeredAt: lastTriggered?.createdAt || null,
    };
  }
}

export const notificationRuleService = new NotificationRuleService();
