import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelPlannerComponent } from './travel-planner.component';

describe('TravelPlannerComponent', () => {
  let component: TravelPlannerComponent;
  let fixture: ComponentFixture<TravelPlannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelPlannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelPlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
