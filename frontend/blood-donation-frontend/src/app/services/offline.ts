import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface PendingDonor {
  id?: number;
  data: any; // بيانات المتبرع (payload)
}

@Injectable({ providedIn: 'root' })
export class OfflineService extends Dexie {
  // تعريف الجدول
  pendingDonors!: Table<PendingDonor>;

  constructor() {
    super('HabashyBloodDB');
    this.version(1).stores({
      pendingDonors: '++id' // السجل المؤقت للمتبرعين
    });
  }

  // حفظ المتبرع أوفلاين
  async saveStep(donorData: any) {
    return await this.pendingDonors.add({ data: donorData });
  }

  // جلب كل السجلات المعلقة (للمزامنة)
  async getAllPending() {
    return await this.pendingDonors.toArray();
  }

  // دالة مخصصة لصفحة الحملة: بترجع الداتا فقط في Array نضيف
  async getAllPendingDonors() {
    const pending = await this.pendingDonors.toArray();
    return pending.map(item => ({
      ...item.data,
      id: item.id, // بنبعت الـ id بتاع Dexie كمؤشر مؤقت
      isOffline: true // علامة عشان تميزه في الـ UI
    }));
  }

  // مسح السجل بعد الرفع الناجح
  async clearPending(id: number) {
    return await this.pendingDonors.delete(id);
  }
  async getAllSteps() {
    // بنستخدم الجدول اللي عرفناه فوق
    return await this.pendingDonors.toArray();
  }

  async deleteStep(id: number) {
    // بنمسح من الجدول الصح
    return await this.pendingDonors.delete(id);
  }
}