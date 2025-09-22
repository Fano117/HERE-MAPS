import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PolygonAnalysisResult {
  coordinates: { lat: number; lng: number };
  address?: string;
  status: 'inside' | 'outside' | 'no_polygons';
  result: any | null;
  distance: number | null;
  allContaining?: any[];
  allDistances?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PolygonAnalysisService {
  private readonly API_BASE = 'http://localhost:3000/api/polygon-analysis';

  constructor(private http: HttpClient) {}

  analyzeAddressPoint(lat: number, lng: number, address?: string): Observable<PolygonAnalysisResult> {
    return this.http.post<PolygonAnalysisResult>(`${this.API_BASE}/address`, {
      lat,
      lng,
      address
    });
  }

  analyzeMapPoint(lat: number, lng: number): Observable<PolygonAnalysisResult> {
    return this.http.post<PolygonAnalysisResult>(`${this.API_BASE}/point`, {
      lat,
      lng
    });
  }
}
