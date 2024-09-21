import { TestBed } from '@angular/core/testing';

import { RecalculateService } from './recalculate.service';

describe('RecalculateService', () => {
  let service: RecalculateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecalculateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
