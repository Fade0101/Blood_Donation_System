import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface PendingRequest {
  id?: number;
  url: string;
  method: string;
  body: any;
  time: number;
}

@Injectable({ providedIn: 'root' })
export class OfflineManagerService extends Dexie {
  pendingRequests!: Table<PendingRequest>;

  constructor() {
    super('HabashyBloodDB');
    this.version(1).stores({
      pendingRequests: '++id, url, method'
    });
  }

  async enqueueRequest(url: string, method: string, body: any) {
    await this.pendingRequests.add({ url, method, body, time: Date.now() });
  }
}