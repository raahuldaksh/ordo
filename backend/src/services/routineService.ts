import { Types } from 'mongoose';
import { RoutineTemplate, RoutineTemplateItem, Task } from '../models/index.js';
import { RoutineTemplateType, ConflictStrategy, TaskStatus } from '../constants/enums.js';
import { addDays, parseISO, format } from 'date-fns';

export class RoutineService {
  static async listTemplates(userId: string) {
    const templates = await RoutineTemplate.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
    const templateIds = templates.map(t => t._id);
    const items = await RoutineTemplateItem.find({ templateId: { $in: templateIds } }).sort({ sortOrder: 1 });

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
    const template = await RoutineTemplate.create({
      ...data,
      userId: new Types.ObjectId(userId)
    });
    return template;
  }

  static async getTemplate(userId: string, templateId: string) {
    const template = await RoutineTemplate.findOne({ _id: templateId, userId: new Types.ObjectId(userId) });
    if (!template) {
      throw { status: 404, code: 'ROUTINE_NOT_FOUND', message: 'Routine template not found or unauthorized' };
    }

    const items = await RoutineTemplateItem.find({ templateId: template._id }).sort({ sortOrder: 1 });
    return {
      ...template.toObject(),
      items
    };
  }

  static async updateTemplate(userId: string, templateId: string, data: any) {
    const template = await RoutineTemplate.findOneAndUpdate(
      { _id: templateId, userId: new Types.ObjectId(userId) },
      { $set: data },
      { new: true }
    );
    if (!template) {
      throw { status: 404, code: 'ROUTINE_NOT_FOUND', message: 'Routine template not found or unauthorized' };
    }
    return template;
  }

  static async deleteTemplate(userId: string, templateId: string) {
    const result = await RoutineTemplate.findOneAndDelete({ _id: templateId, userId: new Types.ObjectId(userId) });
    if (!result) {
      throw { status: 404, code: 'ROUTINE_NOT_FOUND', message: 'Routine template not found or unauthorized' };
    }
    await RoutineTemplateItem.deleteMany({ templateId });
    return { success: true };
  }

  static async duplicateTemplate(userId: string, templateId: string) {
    const original = await RoutineTemplate.findOne({ _id: templateId, userId: new Types.ObjectId(userId) });
    if (!original) {
      throw { status: 404, code: 'ROUTINE_NOT_FOUND', message: 'Routine template not found or unauthorized' };
    }

    const duplicate = await RoutineTemplate.create({
      userId: original.userId,
      name: `${original.name} (Copy)`,
      templateType: original.templateType,
      description: original.description,
      timezone: original.timezone
    });

    const items = await RoutineTemplateItem.find({ templateId: original._id });
    if (items.length > 0) {
      const clonedItems = items.map(item => ({
        userId: original.userId,
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
    const template = await RoutineTemplate.findOne({ _id: templateId, userId: new Types.ObjectId(userId) });
    if (!template) {
      throw { status: 404, code: 'ROUTINE_NOT_FOUND', message: 'Routine template not found or unauthorized' };
    }

    const item = await RoutineTemplateItem.create({
      ...itemData,
      userId: new Types.ObjectId(userId),
      templateId: template._id
    });
    return item;
  }

  static async updateTemplateItem(userId: string, templateId: string, itemId: string, updates: any) {
    const item = await RoutineTemplateItem.findOneAndUpdate(
      { _id: itemId, templateId, userId: new Types.ObjectId(userId) },
      { $set: updates },
      { new: true }
    );
    if (!item) {
      throw { status: 404, code: 'ROUTINE_ITEM_NOT_FOUND', message: 'Routine item not found or unauthorized' };
    }
    return item;
  }

  static async deleteTemplateItem(userId: string, templateId: string, itemId: string) {
    const result = await RoutineTemplateItem.findOneAndDelete({
      _id: itemId,
      templateId,
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
    const userObjectId = new Types.ObjectId(userId);
    const template = await RoutineTemplate.findOne({ _id: routineId, userId: userObjectId });
    if (!template) {
      throw { status: 404, code: 'ROUTINE_NOT_FOUND', message: 'Routine template not found or unauthorized' };
    }

    const items = await RoutineTemplateItem.find({ templateId: template._id }).sort({ sortOrder: 1 });
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
      const currentDayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
      const datePrefix = format(currentDate, 'yyyy-MM-dd');

      for (const item of items) {
        // If weekly template, check dayOfWeek match
        if (template.templateType === RoutineTemplateType.WEEKLY && item.dayOfWeek !== null && item.dayOfWeek !== undefined) {
          if (item.dayOfWeek !== currentDayOfWeek) {
            continue;
          }
        }

        const scheduledStart = new Date(`${datePrefix}T${item.startTimeLocal}:00.000Z`);
        const scheduledEnd = new Date(`${datePrefix}T${item.endTimeLocal}:00.000Z`);

        // Check if there is an existing overlapping task
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
            await Task.deleteOne({ _id: overlapping._id });
            replacedCount++;
          }
          // If APPEND, continue and insert regardless of overlap
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
          tags: ['routine', template.name.toLowerCase().replace(/\s+/g, '-')]
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

