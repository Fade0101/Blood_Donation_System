import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface PendingDonor {
  id?: number;
  data: any; // بيانات المتبرع
}

@Injectable({ providedIn: 'root' })
export class OfflineService extends Dexie {
  pendingDonors!: Table<PendingDonor>;

  constructor() {
    super('HabashyBloodDB');
    this.version(1).stores({
      pendingDonors: '++id' // المخزن المؤقت
    });
  }

  // حفظ المتبرع مؤقتاً
  async saveStep(donorData: any) {
    return await this.pendingDonors.add({ data: donorData });
  }

  // جلب كل المتبرعين اللي مستنيين النت يرجع
  async getAllPending() {
    return await this.pendingDonors.toArray();
  }

  // مسح المتبرع بعد ما يترفع للسيرفر بنجاح
  async clearPending(id: number) {
    return await this.pendingDonors.delete(id);
  }
}