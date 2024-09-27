import { Component, ViewChild, ElementRef, AfterViewInit, signal, HostListener, TrackByFunction, WritableSignal } from '@angular/core';
import { ColorOptionComponent } from './color-option/color-option.component';
import { ToolButtonComponent } from './tool-button/tool-button.component';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

interface Layer {
  id: number;
  name: string;
  canvas: HTMLCanvasElement;
  preview: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ToolButtonComponent, ColorOptionComponent, FormsModule, DragDropModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>


  private readonly MIN_CANVAS_SIZE = 100;
  private readonly MAX_CANVAS_SIZE = 3000;

  canvasWidth = signal(800);
  canvasHeight = signal(600);

  backgroundColor = signal('#ffffff');
  layers: Layer[] = [];
  activeLayerIndex: WritableSignal<number> = signal(0);

  nextLayerId = 1;

  setBackgroundColor(event: Event) {
    const input = event.target as HTMLInputElement;
    this.backgroundColor.set(input.value);
    this.updateCanvasBackground();

  }

  private updateCanvasBackground() {
    this.ctx.fillStyle = this.backgroundColor();
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.redrawLayers();

    this.setContextProperties();
  }

  saveBackgroundColorState() {
    this.saveCanvasState();
  }

  updateCanvasSize(width: number, height: number) {

    const newWidth = Math.max(this.MIN_CANVAS_SIZE, Math.min(width, this.MAX_CANVAS_SIZE));
    const newHeight = Math.max(this.MIN_CANVAS_SIZE, Math.min(height, this.MAX_CANVAS_SIZE));

    this.canvasWidth.set(newWidth);
    this.canvasHeight.set(newHeight);
    this.resizeCanvas();
    this.updateMainCanvas();
    this.updateLayerPreviews();
  }

  private redrawLayers() {
    this.layers.forEach(layer => {
      const layerCanvas = layer.canvas;
      const layerCtx = layerCanvas.getContext('2d')!;
      const tempLayerCanvas = document.createElement('canvas');
      const tempLayerCtx = tempLayerCanvas.getContext('2d')!;
      
      tempLayerCanvas.width = layerCanvas.width;
      tempLayerCanvas.height = layerCanvas.height;
      tempLayerCtx.drawImage(layerCanvas, 0, 0);
      
      layerCanvas.width = this.canvasWidth();
      layerCanvas.height = this.canvasHeight();
      this.ctx.drawImage(layer.canvas, 0, 0);
    });
  }

  trackByFn(index: number, item: string): string {
    return item;
  }

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private lastPressure = 1;

  selectedTool = signal('brush');
  brushWidth = signal(5);
  selectedColor = signal('#000');


  tools = ['brush', 'eraser'];
  colors = ['#000', '#fff', '#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];

  private undoStack: {imageData: ImageData, backgroundColor: string}[] = [];
  private redoStack: {imageData: ImageData, backgroundColor: string}[] = [];


  ngAfterViewInit() {
    this.initializeCanvas();
    this.addLayer();
    this.resizeCanvas();
    this.saveCanvasState();
    this.updateLayerPreviews();
  }

  ngOnInit() {
    this.addLayer();
  }

  private initializeCanvas() {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = this.canvasWidth();
    this.canvas.height = this.canvasHeight();
  
    this.updateCanvasBackground();
  
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
    const newWidth = this.canvasWidth();
    const newHeight = this.canvasHeight();
  
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
  
    this.layers.forEach(layer => {
      const layerCanvas = layer.canvas;
      const layerCtx = layerCanvas.getContext('2d')!;
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCanvas.width = layerCanvas.width;
      tempCanvas.height = layerCanvas.height;
      tempCtx.drawImage(layerCanvas, 0, 0);
      
      layerCanvas.width = newWidth;
      layerCanvas.height = newHeight;
      
      layerCtx.drawImage(tempCanvas, 0, 0);
    });
  

    this.updateMainCanvas();
    

    this.updateLayerPreviews();
  
    this.setContextProperties();
  }

  private setContextProperties() {
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = this.selectedColor();
    this.ctx.lineWidth = this.brushWidth();
  }

  startDrawing(e: PointerEvent) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    [this.lastX, this.lastY] = [e.clientX - rect.left, e.clientY - rect.top];
    this.lastPressure = this.getPressure(e);

    const activeLayer = this.layers[this.activeLayerIndex()];
    const layerCtx = activeLayer.canvas.getContext('2d')!;
    layerCtx.beginPath();
    layerCtx.moveTo(this.lastX, this.lastY);
  }

  draw(e: PointerEvent) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = this.getPressure(e);

    const activeLayer = this.layers[this.activeLayerIndex()];
    const layerCtx = activeLayer.canvas.getContext('2d')!;

    if (this.selectedTool() === 'eraser') {
      const eraserSize = this.brushWidth() * pressure;
      layerCtx.globalCompositeOperation = 'destination-out';
      layerCtx.beginPath();
      layerCtx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
      layerCtx.fill();
    } else {
      layerCtx.globalCompositeOperation = 'source-over';
      layerCtx.strokeStyle = this.selectedColor();
      layerCtx.lineWidth = this.brushWidth() * pressure;
      layerCtx.lineCap = 'round';
      layerCtx.lineJoin = 'round';

      layerCtx.beginPath();
      layerCtx.moveTo(this.lastX, this.lastY);
      layerCtx.lineTo(x, y);
      layerCtx.stroke();
    }


    this.updateMainCanvas();

    [this.lastX, this.lastY, this.lastPressure] = [x, y, pressure];
  }
  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      const activeLayer = this.layers[this.activeLayerIndex()];
      const layerCtx = activeLayer.canvas.getContext('2d')!;
      layerCtx.beginPath();
      this.saveCanvasState();
      this.updateMainCanvas();
      this.updateLayerPreviews();
    }
  }

  private getPressure(e: PointerEvent): number {
    if (e.pressure !== 0) {
      return e.pressure;
    }

    switch (e.pointerType) {
      case 'mouse':
        return e.buttons === 1 ? 1 : 0;
      case 'touch':
        return 1;
      default:
        return 1;
    }
  }

  private updateMainCanvas() {
    this.ctx.fillStyle = this.backgroundColor();
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.layers.slice().reverse().forEach(layer => {
      this.ctx.drawImage(layer.canvas, 0, 0);
    });
  }

  addLayer() {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = this.canvasWidth();
    newCanvas.height = this.canvasHeight();
  
    const newLayer: Layer = {
      id: this.nextLayerId++,
      name: `Layer ${this.layers.length + 1}`,
      canvas: newCanvas,
      preview: this.createLayerPreview(newCanvas)
    };
  
    this.layers.unshift(newLayer);
    this.activeLayerIndex.set(0);
    this.updateMainCanvas();
  }

  removeLayer(index: number) {
    if (this.layers.length > 1) {
      this.layers.splice(index, 1);
      if (this.activeLayerIndex() >= this.layers.length) {
        this.activeLayerIndex.set(this.layers.length - 1);
      }
      this.updateMainCanvas();
    }
  }

  onLayerDrop(event: CdkDragDrop<Layer[]>) {
    moveItemInArray(this.layers, event.previousIndex, event.currentIndex);
    this.updateMainCanvas();
    this.updateLayerPreviews();
  }


  updateLayerPreviews() {
    this.layers.forEach(layer => {
      layer.preview = this.createLayerPreview(layer.canvas);
    });
  }


  createLayerPreview(canvas: HTMLCanvasElement): string {
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = 50; // Set preview size
    previewCanvas.height = 50;
    const previewCtx = previewCanvas.getContext('2d')!;
    previewCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 50, 50);
    return previewCanvas.toDataURL();
  }


  selectLayer(index: number) {
    this.activeLayerIndex.set(index);
  }

  renameLayer(layer: Layer, newName: string) {
    layer.name = newName;
  }

  onDrop(event: CdkDragDrop<Layer[]>) {
    moveItemInArray(this.layers, event.previousIndex, event.currentIndex);
    this.updateMainCanvas();
  }


    private saveCanvasState() {
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = this.canvas.width;
      compositeCanvas.height = this.canvas.height;
      const compositeCtx = compositeCanvas.getContext('2d')!;
  
      compositeCtx.fillStyle = this.backgroundColor();
      compositeCtx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
  
      this.layers.slice().reverse().forEach(layer => {
        compositeCtx.drawImage(layer.canvas, 0, 0);
      });
  
      const imageData = compositeCtx.getImageData(0, 0, compositeCanvas.width, compositeCanvas.height);
      this.undoStack.push({imageData, backgroundColor: this.backgroundColor()});
      this.redoStack = [];
    }

  undo() {
    if (this.undoStack.length > 1) {
      const currentState = this.undoStack.pop();
      if (currentState) this.redoStack.push(currentState);
      const previousState = this.undoStack[this.undoStack.length - 1];
      this.restoreCanvasState(previousState);
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const nextState = this.redoStack.pop();
      if (nextState) {
        this.undoStack.push(nextState);
        this.restoreCanvasState(nextState);
      }
    }
  }

    private restoreCanvasState(state: {imageData: ImageData, backgroundColor: string}) {
      this.backgroundColor.set(state.backgroundColor);
      this.ctx.putImageData(state.imageData, 0, 0);
      
      this.layers.forEach((layer, index) => {
        const layerCtx = layer.canvas.getContext('2d')!;
        layerCtx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
        if (index === 0) {
          layerCtx.putImageData(state.imageData, 0, 0);
        }
      });
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
    this.ctx.fillStyle = this.backgroundColor();
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.layers.forEach(layer => {
      const ctx = layer.canvas.getContext('2d')!;
      ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    });
    this.saveCanvasState();
  }


  saveImage() {

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d')!;
    
        tempCtx.fillStyle = this.backgroundColor();
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
        this.layers.forEach(layer => {
          tempCtx.drawImage(layer.canvas, 0, 0);
        });
    


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
