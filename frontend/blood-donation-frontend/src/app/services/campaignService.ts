import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Campaign } from '../interfaces/campaign';
import { CreateCampaignRequest } from '../interfaces/campaign';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {

  private http = inject(HttpClient);

private baseUrl = `${environment.baseurl}/api/campaigns`;  // ================= GET ALL =================
  getAllCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(this.baseUrl);
  }

  // ================= GET BY ID =================
  getCampaignById(id: string): Observable<Campaign> {
    return this.http.get<Campaign>(`${this.baseUrl}/${id}`);
  }

  // ================= CREATE =================
  createCampaign(data: CreateCampaignRequest): Observable<Campaign> {
    return this.http.post<Campaign>(this.baseUrl, data);
  }

  // ================= UPDATE =================
  updateCampaign(id: string, data: Partial<CreateCampaignRequest>): Observable<Campaign> {
    return this.http.put<Campaign>(`${this.baseUrl}/${id}`, data);
  }

  // ================= DELETE =================
deleteCampaign(id: string) {
  return this.http.delete(`${this.baseUrl}/${id}`, {
    responseType: 'text' as 'json' // 🔥 مهم جدًا مع 204
  });
}
  getAllDonors() {
  return this.http.get<any[]>(`${environment.baseurl}/api/donors`);
}

}