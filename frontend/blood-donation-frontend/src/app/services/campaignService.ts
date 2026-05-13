import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Campaign } from '../interfaces/campaign';
import { CreateCampaignRequest } from '../interfaces/campaign';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {

 openCampaignModal = signal(false);

  openCampaign() {
    this.openCampaignModal.set(true);
  }

  closeCampaign() {
    this.openCampaignModal.set(false);
  }
  private http = inject(HttpClient);
private donorsUrl = `${environment.baseurl}/api/donors`;
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
    responseType: 'text' as 'json'
  });
}
getAllDonors(page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
  if (search && search.trim() !== '') {
    const params = new HttpParams().set('q', search);
    return this.http.get<any>(`${this.donorsUrl}/search`, { params });
  }

  const params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString());

  return this.http.get<any>(this.donorsUrl, { params });
}

getAllDonorsStatic(): Observable<any> {
  return this.http.get<any>(this.donorsUrl); 
}
}