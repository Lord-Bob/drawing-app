// import { BrowserModule } from '@angular/platform-browser';
// import { NgModule } from '@angular/core';

// // import { AppComponent } from './app.component';
// import { AppComponent } from './app/app.component';

// @NgModule({
//   declarations: [
//     AppComponent
//   ],
//   imports: [
//     BrowserModule
//   ],
//   providers: [],
//   bootstrap: [AppComponent]
// })
// export class AppModule { }

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent)
  .catch(err => console.error(err));
