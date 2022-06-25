import { AppService } from './app.service';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwToolbarMixedModesError } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {


  selected_interface : string = "";
  status : boolean = false;
  interfaces : string[] = [];
  port_no : number;
  constructor(
    private _service : AppService,
    private _snackBar : MatSnackBar,
  ){

  }
  title = 'xss-detector-frontend';
  async getInterfaces(){
    this.interfaces = await this._service.getInterfaces();
  }

  async retry(){
    try{
      this.status = false;
      this.status = await this._service.ping();
      this._snackBar.open("Connected to BackEnd.", "Ok");
    }
    catch(err){
      this._snackBar.open("Can't connect to BackEnd.", "Ok");
      this.status = false;
    }
  }

  async ngOnInit(){
    await this.retry();
    if(this.status)
      this.interfaces = await this._service.getInterfaces();
    this.interfaces = await this._service.getInterfaces();
    
  }

}
