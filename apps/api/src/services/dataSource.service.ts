import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import {
  CreateDataSourceInput,
  UpdateDataSourceInput,
  DataSourceQueryInput,
} from '../schemas/validation';

export class DataSourceService {
  async create(userId: string, input: CreateDataSourceInput) {
    const dataSource = await prisma.dataSource.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        config: input.config as any,
        isActive: input.isActive ?? true,
        checkInterval: input.checkInterval ?? 300,
      },
    });

    return dataSource;
  }

  async findAll(userId: string, query: DataSourceQueryInput) {
    const { page = 1, limit = 20, type, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(type && { type }),
      ...(isActive !== undefined && { isActive }),
    };

    const [dataSources, total] = await Promise.all([
      prisma.dataSource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.dataSource.count({ where }),
    ]);

    return {
      data: dataSources,
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
    const dataSource = await prisma.dataSource.findFirst({
      where: { id, userId },
    });

    if (!dataSource) {
      throw new AppError('Data source not found', 404, 'DATA_SOURCE_NOT_FOUND');
    }

    return dataSource;
  }

  async update(id: string, userId: string, input: UpdateDataSourceInput) {
    // Check if data source exists and belongs to user
    await this.findById(id, userId);

    const dataSource = await prisma.dataSource.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.type && { type: input.type }),
        ...(input.config && { config: input.config as any }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.checkInterval && { checkInterval: input.checkInterval }),
      },
    });

    return dataSource;
  }

  async delete(id: string, userId: string) {
    // Check if data source exists and belongs to user
    await this.findById(id, userId);

    await prisma.dataSource.delete({
      where: { id },
    });

    return { success: true, message: 'Data source deleted successfully' };
  }

  async getStats(id: string, userId: string) {
    // Check if data source exists and belongs to user
    await this.findById(id, userId);

    const [collectedCount, lastCollected] = await Promise.all([
      prisma.collectedData.count({
        where: { dataSourceId: id },
      }),
      prisma.collectedData.findFirst({
        where: { dataSourceId: id },
        orderBy: { collectedAt: 'desc' },
        select: { collectedAt: true },
      }),
    ]);

    return {
      totalCollected: collectedCount,
      lastCollectedAt: lastCollected?.collectedAt || null,
    };
  }
}

export const dataSourceService = new DataSourceService();
