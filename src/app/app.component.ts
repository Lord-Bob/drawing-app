import { Component, ViewChild, ElementRef, AfterViewInit, signal, HostListener, TrackByFunction } from '@angular/core';
import { ColorOptionComponent } from './color-option/color-option.component';
import { ToolButtonComponent } from './tool-button/tool-button.component';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ToolButtonComponent, ColorOptionComponent, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>


  trackByFn(index: number, item: string): string {
    return item;
  }

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;

  selectedTool = signal('brush');
  brushWidth = signal(5);
  selectedColor = signal('#000');

  tools = ['brush', 'eraser', 'rectangle', 'circle', 'triangle', 'line'];
  colors = ['#000', '#fff', '#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];

  ngAfterViewInit() {
    this.initializeCanvas();
    this.resizeCanvas();
  }

  private initializeCanvas() {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.resizeCanvas();

    // Set canvas size to match its display size
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

    // Set initial canvas background to white
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Set default stroke and fill style
    this.ctx.strokeStyle = this.selectedColor();
    this.ctx.fillStyle = this.selectedColor();
    this.ctx.lineWidth = this.brushWidth();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resizeCanvas();
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    // const rect = canvas.getBoundingClientRect();
    const rect = this.canvas.getBoundingClientRect();

    
    // Create a temporary canvas to hold the current drawing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx!.drawImage(canvas, 0, 0);
    
    // Resize the main canvas
    // canvas.width = rect.width;
    // canvas.height = rect.height;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Redraw the content
    this.ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
    
    // Reset the context properties
    this.ctx.strokeStyle = this.selectedColor();
    this.ctx.fillStyle = this.selectedColor();
    this.ctx.lineWidth = this.brushWidth();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  startDrawing(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.isDrawing = true;
    [this.lastX, this.lastY] = [e.clientX - rect.left, e.clientY - rect.top];
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  public draw(e: MouseEvent) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.ctx.strokeStyle = this.selectedTool() === 'eraser' ? '#fff' : this.selectedColor();
    this.ctx.lineWidth = this.brushWidth();


      switch (this.selectedTool()) {
        case 'brush':
        case 'eraser':
          this.drawBrush(x, y);
          break;
        case 'rectangle':
          this.drawRectangle(x, y);
          break;
        case 'circle':
          this.drawCircle(x, y);
          break;
        case 'triangle':
          this.drawTriangle(x, y);
          break;
        case 'line':
          this.drawLine(x, y);
          break;
      }
      [this.lastX, this.lastY] = [x, y];
    }

  private drawBrush(x: number, y: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }
  private drawRectangle(x: number, y: number) {
    const width = x - this.lastX;
    const height = y - this.lastY;
    this.ctx.strokeRect(this.lastX, this.lastY, width, height);
  }

  private drawCircle(x: number, y: number) {
    const radius = Math.sqrt(Math.pow(x - this.lastX, 2) + Math.pow(y - this.lastY, 2));
    this.ctx.beginPath();
    this.ctx.arc(this.lastX, this.lastY, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  private drawTriangle(x: number, y: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.lineTo(this.lastX * 2 - x, y);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private drawLine(x: number, y: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  selectTool(tool: string) {
    this.selectedTool.set(tool);
  }

  selectColor(color: string) {
    this.selectedColor.set(color);
  }

  changeBrushSize(size: number) {
    this.brushWidth.set(size);
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  saveImage() {
    const link = document.createElement('a');
    link.download = `drawing_${Date.now()}.png`;
    link.href = this.canvas.toDataURL();
    link.click();
  }


    isToolbarVisible = true;
  
    toggleToolbar() {
      this.isToolbarVisible = !this.isToolbarVisible;
    }

}
