import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelDestinationsComponent } from './travel-destinations.component';

describe('TravelDestinationsComponent', () => {
  let component: TravelDestinationsComponent;
  let fixture: ComponentFixture<TravelDestinationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelDestinationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelDestinationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
