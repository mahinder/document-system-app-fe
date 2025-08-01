import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ingestion } from './ingestion.component';

describe('Ingestion', () => {
  let component: Ingestion;
  let fixture: ComponentFixture<Ingestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ingestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ingestion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
