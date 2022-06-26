

import { AppService, ResultI } from './app.service';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwToolbarMixedModesError } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {


  selected_interface: string = "";
  status: boolean = false;
  interfaces: string[] = [];
  port_no: number;
  started: boolean =false;

  results: ResultI[] = [];


  constructor(
    private _service: AppService,
    private _snackBar: MatSnackBar,
  ) {

  }
  title = 'xss-detector-frontend';
  async getInterfaces() {
    this.interfaces = await this._service.getInterfaces();
  }

  async retry() {
    try {
      this.status = false;
      this.status = await this._service.ping();
      this._snackBar.open("Connected to BackEnd.", "Ok");
    }
    catch (err) {
      this._snackBar.open("Can't connect to BackEnd.", "Ok");
      this.status = false;
    }
  }

  async ngOnInit() {
    await this.retry();
    if (this.status)
      this.interfaces = await this._service.getInterfaces();
    this.interfaces = await this._service.getInterfaces();

    this._service._notification.subscribe((data:ResultI)=> {
        this.results.push(data);
    })
  }

  start() {
    this._service.startListening(this.port_no, this.selected_interface);
    this.started = true;
    this._snackBar.open(`All Request are being monitored on PORT:${this.port_no} with Interface: ${this.selected_interface}`, "OK");
  }

}