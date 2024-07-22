import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsumoService {
  private totalConsumoSubject = new BehaviorSubject<number>(0);
  private categoriaSubject = new BehaviorSubject<string>('');
  totalConsumo$ = this.totalConsumoSubject.asObservable();
  categoria$ = this.categoriaSubject.asObservable();
  
  constructor() { }

  setTotalConsumo(total: number): void {
    this.totalConsumoSubject.next(total);
    let categoria = '';
    if (total < 1000) {
      categoria = 'Bajo';
    } else if (total < 3000) {
      categoria = 'Medio';
    } else {
      categoria = 'Alto';
    }
    this.categoriaSubject.next(categoria);
    
  }
}
