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

  getAllDonors(): Observable<any> {
    return this.http.get(this.baseUrl);
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