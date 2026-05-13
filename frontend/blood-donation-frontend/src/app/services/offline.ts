import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface PendingDonor {
  id?: number;
  data: any;
}

@Injectable({ providedIn: 'root' })
export class OfflineService extends Dexie {
  pendingDonors!: Table<PendingDonor>;

  constructor() {
    super('HabashyBloodDB');
    this.version(1).stores({
      pendingDonors: '++id'
    });
  }

  async saveStep(donorData: any) {
    return await this.pendingDonors.add({ data: donorData });
  }

  async getAllPending() {
    return await this.pendingDonors.toArray();
  }

  async getAllPendingDonors() {
    const pending = await this.pendingDonors.toArray();
    return pending.map(item => ({
      ...item.data,
      id: item.id,
      isOffline: true
    }));
  }

  async clearPending(id: number) {
    return await this.pendingDonors.delete(id);
  }
  async getAllSteps() {
    return await this.pendingDonors.toArray();
  }

  async deleteStep(id: number) {
    return await this.pendingDonors.delete(id);
  }
}