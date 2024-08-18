import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-color-option',
  standalone: true,
  imports: [],
  templateUrl: './color-option.component.html',
  styleUrl: './color-option.component.css'
})
export class ColorOptionComponent {
  @Input({ required: true }) color!: string;
  @Input() isSelected: boolean = false;
  @Output() colorSelected = new EventEmitter<string>();

  onClick() {
    this.colorSelected.emit(this.color);
  }
}
