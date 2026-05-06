import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateDonorRequest } from '../interfaces/donor-interface';

@Injectable({
  providedIn: 'root'
})
export class DonorsService {

  private http = inject(HttpClient);

  private baseUrl = `${environment.baseurl}/api/donors`;
getAllDonors(page: number = 1, limit: number = 10, search: string = '', bloodType: string = 'ALL', includeStats: boolean = true) {
    let url = `${this.baseUrl}?page=${page}&limit=${limit}&includeStats=${includeStats}`;
    if (search) url += `&search=${search}`;
    if (bloodType !== 'ALL') url += `&bloodType=${bloodType}`;

    return this.http.get(url);
  }

  getDonorById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  createDonor(data: CreateDonorRequest): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  updateDonor(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  deleteDonor(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
