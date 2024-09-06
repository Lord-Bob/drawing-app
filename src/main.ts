
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

bootstrapApplication(AppComponent)
  .catch(err => console.error(err));
