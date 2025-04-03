import { TestBed } from '@angular/core/testing';

import { EnchancedSearchService } from './enchanced-search.service';

describe('EnchancedSearchService', () => {
  let service: EnchancedSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnchancedSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
