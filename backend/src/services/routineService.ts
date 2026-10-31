import { Types } from 'mongoose';
import { RoutineTemplate, RoutineTemplateItem, Task } from '../models/index.js';
import { RoutineTemplateType, ConflictStrategy, TaskStatus, TaskType, TaskPriority } from '../constants/enums.js';
import { addDays, parseISO, format } from 'date-fns';

export class RoutineService {
  static async listTemplates(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const templates = await RoutineTemplate.find({ userId: userObjectId }).sort({ createdAt: -1 });
    const templateIds = templates.map(t => t._id);
    const items = await RoutineTemplateItem.find({ templateId: { $in: templateIds }, userId: userObjectId }).sort({ sortOrder: 1 });

    return templates.map(template => {
      const templateItems = items.filter(i => i.templateId.toString() === template._id.toString());
      return {
        ...template.toObject(),
        itemsCount: templateItems.length,
        items: templateItems
      };
    });
  }

  static async createTemplate(userId: string, data: any) {
    // Mass assignment prevention
    const template = await RoutineTemplate.create({
      userId: new Types.ObjectId(userId),
      name: String(data.name || '').trim().substring(0, 100),
      templateType: Object.values(RoutineTemplateType).includes(data.templateType) ? data.templateType : RoutineTemplateType.DAILY,
      description: data.description ? String(data.description).trim().substring(0, 1000) : '',
      timezone: data.timezone ? String(data.timezone).trim() : 'UTC'
    });
    return template;
  }

  static async getTemplate(userId: string, templateId: string) {
    if (!Types.ObjectId.isValid(templateId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid routine identifier' };
    }
    const userObjectId = new Types.ObjectId(userId);
    const template = await RoutineTemplate.findOne({ _id: new Types.ObjectId(templateId), userId: userObjectId });
    if (!template) {
      throw { status: 404, code: 'ROUTINE_NOT_FOUND', message: 'Routine template not found or unauthorized' };
    }

    const items = await RoutineTemplateItem.find({ templateId: template._id, userId: userObjectId }).sort({ sortOrder: 1 });
    return {
      ...template.toObject(),
      items
    };
  }

  static async updateTemplate(userId: string, templateId: string, data: any) {
    if (!Types.ObjectId.isValid(templateId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid routine identifier' };
    }

    const safeUpdates: Record<string, any> = {};
    if (data.name !== undefined) safeUpdates.name = String(data.name).trim().substring(0, 100);
    if (data.templateType !== undefined && Object.values(RoutineTemplateType).includes(data.templateType)) {
      safeUpdates.templateType = data.templateType;
    }
    if (data.description !== undefined) safeUpdates.description = String(data.description).trim().substring(0, 1000);
    if (data.timezone !== undefined) safeUpdates.timezone = String(data.timezone).trim();

    const template = await RoutineTemplate.findOneAndUpdate(
      { _id: new Types.ObjectId(templateId), userId: new Types.ObjectId(userId) },
      { $set: safeUpdates },
      { new: true }
    );
    if (!template) {
      throw { status: 404, code: 'ROUTINE_NOT_FOUND', message: 'Routine template not found or unauthorized' };
    }
    return template;
  }

  static async deleteTemplate(userId: string, templateId: string) {
    if (!Types.ObjectId.isValid(templateId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid routine identifier' };
    }
    const userObjectId = new Types.ObjectId(userId);
    const result = await RoutineTemplate.findOneAndDelete({ _id: new Types.ObjectId(templateId), userId: userObjectId });
    if (!result) {
      throw { status: 404, code: 'ROUTINE_NOT_FOUND', message: 'Routine template not found or unauthorized' };
    }
    await RoutineTemplateItem.deleteMany({ templateId: new Types.ObjectId(templateId), userId: userObjectId });
    return { success: true };
  }

  static async duplicateTemplate(userId: string, templateId: string) {
    if (!Types.ObjectId.isValid(templateId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid routine identifier' };
    }
    const userObjectId = new Types.ObjectId(userId);
    const original = await RoutineTemplate.findOne({ _id: new Types.ObjectId(templateId), userId: userObjectId });
    if (!original) {
      throw { status: 404, code: 'ROUTINE_NOT_FOUND', message: 'Routine template not found or unauthorized' };
    }

    const duplicate = await RoutineTemplate.create({
      userId: userObjectId,
      name: `${original.name} (Copy)`.substring(0, 100),
      templateType: original.templateType,
      description: original.description,
      timezone: original.timezone
    });

    const items = await RoutineTemplateItem.find({ templateId: original._id, userId: userObjectId });
    if (items.length > 0) {
      const clonedItems = items.map(item => ({
        userId: userObjectId,
        templateId: duplicate._id,
        title: item.title,
        description: item.description,
        taskType: item.taskType,
        priority: item.priority,
        dayOfWeek: item.dayOfWeek,
        startTimeLocal: item.startTimeLocal,
        endTimeLocal: item.endTimeLocal,
        durationMinutes: item.durationMinutes,
        recurrenceRule: item.recurrenceRule,
        sortOrder: item.sortOrder
      }));
      await RoutineTemplateItem.insertMany(clonedItems);
    }

    return this.getTemplate(userId, duplicate._id.toString());
  }

  static async addTemplateItem(userId: string, templateId: string, itemData: any) {
    if (!Types.ObjectId.isValid(templateId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid routine identifier' };
    }
    const userObjectId = new Types.ObjectId(userId);
    const template = await RoutineTemplate.findOne({ _id: new Types.ObjectId(templateId), userId: userObjectId });
    if (!template) {
      throw { status: 404, code: 'ROUTINE_NOT_FOUND', message: 'Routine template not found or unauthorized' };
    }

    const item = await RoutineTemplateItem.create({
      userId: userObjectId,
      templateId: template._id,
      title: String(itemData.title || '').trim().substring(0, 200),
      description: itemData.description ? String(itemData.description).trim().substring(0, 1000) : '',
      taskType: Object.values(TaskType).includes(itemData.taskType) ? itemData.taskType : TaskType.FIXED,
      priority: Object.values(TaskPriority).includes(itemData.priority) ? itemData.priority : TaskPriority.MEDIUM,
      dayOfWeek: itemData.dayOfWeek !== undefined ? itemData.dayOfWeek : null,
      startTimeLocal: String(itemData.startTimeLocal || '08:00'),
      endTimeLocal: String(itemData.endTimeLocal || '09:00'),
      durationMinutes: typeof itemData.durationMinutes === 'number' ? Math.max(5, itemData.durationMinutes) : 30,
      sortOrder: typeof itemData.sortOrder === 'number' ? itemData.sortOrder : 0
    });
    return item;
  }

  static async updateTemplateItem(userId: string, templateId: string, itemId: string, updates: any) {
    if (!Types.ObjectId.isValid(templateId) || !Types.ObjectId.isValid(itemId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid identifier' };
    }

    const safeUpdates: Record<string, any> = {};
    if (updates.title !== undefined) safeUpdates.title = String(updates.title).trim().substring(0, 200);
    if (updates.description !== undefined) safeUpdates.description = String(updates.description).trim().substring(0, 1000);
    if (updates.taskType !== undefined && Object.values(TaskType).includes(updates.taskType)) safeUpdates.taskType = updates.taskType;
    if (updates.priority !== undefined && Object.values(TaskPriority).includes(updates.priority)) safeUpdates.priority = updates.priority;
    if (updates.dayOfWeek !== undefined) safeUpdates.dayOfWeek = updates.dayOfWeek;
    if (updates.startTimeLocal !== undefined) safeUpdates.startTimeLocal = updates.startTimeLocal;
    if (updates.endTimeLocal !== undefined) safeUpdates.endTimeLocal = updates.endTimeLocal;
    if (updates.durationMinutes !== undefined) safeUpdates.durationMinutes = Number(updates.durationMinutes);
    if (updates.sortOrder !== undefined) safeUpdates.sortOrder = Number(updates.sortOrder);

    const item = await RoutineTemplateItem.findOneAndUpdate(
      { _id: new Types.ObjectId(itemId), templateId: new Types.ObjectId(templateId), userId: new Types.ObjectId(userId) },
      { $set: safeUpdates },
      { new: true }
    );
    if (!item) {
      throw { status: 404, code: 'ROUTINE_ITEM_NOT_FOUND', message: 'Routine item not found or unauthorized' };
    }
    return item;
  }

  static async deleteTemplateItem(userId: string, templateId: string, itemId: string) {
    if (!Types.ObjectId.isValid(templateId) || !Types.ObjectId.isValid(itemId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid identifier' };
    }
    const result = await RoutineTemplateItem.findOneAndDelete({
      _id: new Types.ObjectId(itemId),
      templateId: new Types.ObjectId(templateId),
      userId: new Types.ObjectId(userId)
    });
    if (!result) {
      throw { status: 404, code: 'ROUTINE_ITEM_NOT_FOUND', message: 'Routine item not found or unauthorized' };
    }
    return { success: true };
  }

  static async applyRoutine(
    userId: string,
    routineId: string,
    startDateStr: string,
    endDateStr: string,
    conflictStrategy: ConflictStrategy = ConflictStrategy.SKIP
  ) {
    if (!Types.ObjectId.isValid(routineId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid routine identifier' };
    }
    const userObjectId = new Types.ObjectId(userId);
    const template = await RoutineTemplate.findOne({ _id: new Types.ObjectId(routineId), userId: userObjectId });
    if (!template) {
      throw { status: 404, code: 'ROUTINE_NOT_FOUND', message: 'Routine template not found or unauthorized' };
    }

    const items = await RoutineTemplateItem.find({ templateId: template._id, userId: userObjectId }).sort({ sortOrder: 1 });
    if (items.length === 0) {
      throw { status: 400, code: 'ROUTINE_EMPTY', message: 'Routine template contains no items to apply.' };
    }

    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    let currentDate = startDate;
    const tasksToInsert: any[] = [];
    let skippedCount = 0;
    let replacedCount = 0;

    while (currentDate <= endDate) {
      const currentDayOfWeek = currentDate.getDay();
      const datePrefix = format(currentDate, 'yyyy-MM-dd');

      for (const item of items) {
        if (template.templateType === RoutineTemplateType.WEEKLY && item.dayOfWeek !== null && item.dayOfWeek !== undefined) {
          if (item.dayOfWeek !== currentDayOfWeek) {
            continue;
          }
        }

        const scheduledStart = new Date(`${datePrefix}T${item.startTimeLocal}:00.000Z`);
        const scheduledEnd = new Date(`${datePrefix}T${item.endTimeLocal}:00.000Z`);

        const overlapping = await Task.findOne({
          userId: userObjectId,
          archivedAt: null,
          scheduledStartAt: { $lt: scheduledEnd },
          scheduledEndAt: { $gt: scheduledStart }
        });

        if (overlapping) {
          if (conflictStrategy === ConflictStrategy.SKIP) {
            skippedCount++;
            continue;
          } else if (conflictStrategy === ConflictStrategy.REPLACE_CONFIRMED) {
            await Task.deleteOne({ _id: overlapping._id, userId: userObjectId });
            replacedCount++;
          }
        }

        tasksToInsert.push({
          userId: userObjectId,
          title: item.title,
          description: item.description,
          taskType: item.taskType,
          priority: item.priority,
          status: TaskStatus.PENDING,
          scheduledStartAt: scheduledStart,
          scheduledEndAt: scheduledEnd,
          durationMinutes: item.durationMinutes,
          timezone: template.timezone,
          sourceTemplateId: template._id,
          tags: ['routine', template.name.toLowerCase().replace(/\s+/g, '-').substring(0, 30)]
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    if (tasksToInsert.length > 0) {
      await Task.insertMany(tasksToInsert);
    }

    return {
      appliedCount: tasksToInsert.length,
      skippedCount,
      replacedCount,
      routineName: template.name
    };
  }
}
