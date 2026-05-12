import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImportService {

  private baseUrl = 'http://localhost:5000/api/imports';

  constructor(private http: HttpClient) {}

  importBloodBank(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(
      `${this.baseUrl}/blood-bank`,
      formData
    );
  }

  importLegacy(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(
      `${this.baseUrl}/legacy`,
      formData
    );
  }
}