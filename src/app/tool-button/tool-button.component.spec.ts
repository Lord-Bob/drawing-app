import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolButtonComponent } from './tool-button.component';

describe('ToolButtonComponent', () => {
  let component: ToolButtonComponent;
  let fixture: ComponentFixture<ToolButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
