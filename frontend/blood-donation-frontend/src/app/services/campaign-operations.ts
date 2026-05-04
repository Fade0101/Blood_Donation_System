import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RegisterDonorRequest, RegisterDonorResponse } from '../interfaces/campaign';

@Injectable({
  providedIn: 'root',
})
export class CampaignOperationsService {
  private http = inject(HttpClient);

private apiUrl = `${environment.baseurl}/api/campaigns`;  
  // ================= REGISTER DONOR =================
  registerDonorToCampaign(
    campaignId: string,
    payload: RegisterDonorRequest,
  ): Observable<RegisterDonorResponse> {
    return this.http.post<RegisterDonorResponse>(`${this.apiUrl}/${campaignId}/register`, payload);
  }

  // ================= EXPORT CSV =================
  exportCampaignDonors(campaignId: string, bloodType?: string): Observable<Blob> {
    let params = new HttpParams();

    if (bloodType) {
      params = params.set('bloodType', bloodType);
    }

    return this.http.get(`${this.apiUrl}/${campaignId}/export`, {
      params,
      responseType: 'blob',
    });
  }

getCampaignStats(campaignId: string) {
  return this.http.get<any>(
    `${this.apiUrl}/${campaignId}/stats`
  );
}
markAsDonated(campaignId: string, donorId: string) {
  return this.http.patch(
    `${this.apiUrl}/${campaignId}/donors/${donorId}/donate`,
    {}
  );
}

// ================= SEARCH DONORS =================
searchDonors(query: string): Observable<any[]> {
  return this.http.get<any[]>(
    `${environment.baseurl}/donors/search`,
    {
      params: { q: query }
    }
  );
}

getCampaignDonors(campaignId: string) {
  return this.http.get<any[]>(
    `${this.apiUrl}/${campaignId}/donors`
  );
}
removeDonor(campaignId: string, donorId: string) {
  return this.http.delete(
    `${this.apiUrl}/${campaignId}/donors/${donorId}`
  );
}
}
