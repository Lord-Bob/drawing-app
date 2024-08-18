import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-tool-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tool-button.component.html',
  styleUrl: './tool-button.component.css'
})
export class ToolButtonComponent {
  @Input({ required: true }) toolName!: string;
  @Input() isActive: boolean = false;
  @Output() toolSelected = new EventEmitter<string>();

  onClick() {
    this.toolSelected.emit(this.toolName);
  }
}
