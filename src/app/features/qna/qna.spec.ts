import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Qna } from './qna';

describe('Qna', () => {
  let component: Qna;
  let fixture: ComponentFixture<Qna>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Qna]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Qna);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
