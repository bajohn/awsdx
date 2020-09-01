import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';

import { Map } from 'mapbox-gl';
import { faCoffee, faPause, faShip, faPlay } from '@fortawesome/free-solid-svg-icons';

interface ship {
  startLoc: string
  endLoc: string
  endCoord: number[]
  endDate: Date // date of arrival
  vesselName: string
  weight: number
  imoNumber: number
  lonOffset: number
  latOffset: number

  sourceData: any
  srcId: string
  ptId: string
  lineId: string
  showPopup: boolean
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  readonly accessToken = 'pk.eyJ1IjoiYnJlbmRhbmFqb2huIiwiYSI6ImNrZWM1aHkwZjA0YzIydHJzaTdudHA5cjQifQ.ogTyplFS7LdAC7QspnVVkQ';

  // Main map params
  defaultCenter = [-98.585522, 39.8333333]; //[-77.0366, 38.895]; // Assumes Kansas!
  appTime = new Date('2020-1-1');
  minDate = new Date('2020-1-1');
  maxDate = new Date('2020-08-23');
  timeRate = 20;// clock seconds per app day
  updateRate = 5;// rerenders per second
  shipSpeed = 18; // 37 kph is approx 20 knots 
  daysToShow = 3; // number of days to show a ship for
  paused = false;



  shipArr: ship[] = [];

  faPause = faPause;
  faShip = faShip;
  faPlay = faPlay;

  slider = 10;
  slideClickState = 0;
  constructor() {

  }

  async ngOnInit() {

    // start app clock
    setInterval(() => { this.updateAppTime() }, 1000 / this.updateRate)

    // 
    const pullTime = new Date(this.appTime.getTime() - this.daysToShow * 24 * 3600 * 1000)
    this.doPull(pullTime, this.daysToShow);

  }

  async debugArray() {

    const endDate = new Date();
    const testObj1 = await this.initShipObj('taipei', 'Seattle', endDate, 'boaty mcmboatface', 724, 9337468);
    const testObj2 = await this.initShipObj('tokyo', 'los angeles', endDate, 'SWLV', 40923, 9318163);
    const testObj3 = await this.initShipObj('Nhava Sheva,India', 'New York Newark Area, Newark, New Jersey', endDate, 'MAERSK', 82505923042, 9462720);

    this.shipArr.push(testObj1);
    this.shipArr.push(testObj2);
    this.shipArr.push(testObj3);
  }

  doPull(firstDate, daysToPull) {
    let curDate = new Date(firstDate.getTime());
    while (daysToPull > 0) {
      this.shipsFromApi(curDate);


      curDate = new Date(curDate.getTime() + 24 * 3600 * 1000);
      daysToPull--;
    }
  }

  async shipsFromApi(dateToPull: Date) {

    const dateToFetch = new Date(dateToPull.getTime() + this.daysToShow * 24 * 3600 * 1000);
    const dateStrToFetch = `${dateToFetch.getFullYear()}-${dateToFetch.getMonth() + 1}-${dateToFetch.getUTCDate()}`;
    console.log('Pulling', dateStrToFetch);

    const resp = await fetch(`https://cq2lqs0ov8.execute-api.us-east-1.amazonaws.com/prod/${dateStrToFetch}`);
    const respJson = await resp.json();
    const promiseArr = [];
    for (const key of Object.keys(respJson)) {
      const curObj = respJson[key];

      promiseArr.push(this.initShipObj(
        curObj['foreign_port_of_lading'],
        curObj['port_of_unlading'],
        new Date(curObj['actual_arrival_date']),
        key,
        curObj['total_weight'],
        curObj['conveyance_id'],
      )
      );
    }
    const ships = await Promise.all(promiseArr);

    for (const ship of ships) {
      if (ship !== undefined) {
        this.shipArr.push(ship);
      }
    }
  }

  async initShipObj(startLoc, endLoc, endDate, vesselName, weight, imoNumber) {
    const endCoord = await this.coord(endLoc);
    const latOffset = 10 * (Math.random() - 0.5);
    const lonOffset = 10 * (Math.random() - 0.5);
    if (endCoord.length === 2) {
      return {
        startLoc: startLoc,
        endLoc: endLoc,
        endCoord: endCoord,
        endDate: endDate,
        vesselName: vesselName,
        weight: Math.round(weight),
        imoNumber: imoNumber,

        sourceData: this.pointSource(endCoord, endDate, lonOffset, latOffset),
        latOffset: latOffset,
        lonOffset: lonOffset,
        srcId: uuidv4(),
        ptId: uuidv4(),
        lineId: uuidv4(),
        showPopup: false
      };
    }

  }

  pauseClick() {
    this.paused = !this.paused;
  }

  updateAppTime() {
    if (!this.paused) {
      const curTime = this.appTime.getTime();
      const curDate = this.appTime.getUTCDate();

      const newTimeMs = curTime + 24 * 3600 * 1000 / this.updateRate / this.timeRate;
      const newTimeObj = new Date(newTimeMs);
      const newTimeDate = newTimeObj.getUTCDate()

      if (this.maxDate > newTimeObj) {
        if (this.slideClickState === 0) {
          this.slider = 100 * (newTimeMs - this.minDate.getTime()) / (this.maxDate.getTime() - this.minDate.getTime())
        }
        if (newTimeDate !== curDate) {
          this.doPull(this.appTime, 1);
        }
        this.appTime = newTimeObj

        this.updateShips();
      }

    }

  }


  // Hit Mapbox geo code API to figure out
  // lat/lon from a generic place name
  async coord(placeName: string) {
    let request = "https://api.mapbox.com/geocoding/v5/mapbox.places/";
    request += placeName.replace('/', ''); //tiny bit of cleaning
    request += '.json';
    request += '?access_token=';
    request += this.accessToken;

    const resp = await fetch(request);
    if (resp.status === 200) {
      const respBody = await resp.json();
      const features = respBody['features'];

      const bestfeature = features[0];
      return bestfeature['center'];
    }
    return [];
  }



  showGraphics(endDate: Date) {
    const startDate = new Date(endDate.getTime() - this.daysToShow * 24 * 3600 * 1000);
    return endDate > this.appTime && startDate < this.appTime;
  }


  shipCoord(endCoord, endDate: Date, lonOffset, latOffset) {
    const D = this.shipSpeed * this.daysToShow * 24; // km total over days to show

    const totalDeltaLon = endCoord[0] - this.defaultCenter[0];
    const totalDeltaLat = endCoord[1] - this.defaultCenter[1];

    const AoA = Math.atan2(totalDeltaLat, totalDeltaLon);// "angle of attack"- ratio of lat:lon
    const lonKm = D * Math.cos(AoA); // KM in the east/west direction
    const latKm = D * Math.sin(AoA); // KM in north/south

    const latConst = 111.2;
    const lonConst = 111.2 * Math.cos(Math.PI / 180 * this.defaultCenter[1]);

    const deltaLat = latKm / latConst;
    const deltaLon = lonKm / lonConst;

    const daysLeft = (endDate.getTime() - this.appTime.getTime()) / (24 * 3600 * 1000);
    const pct = daysLeft / this.daysToShow;

    return [endCoord[0] + (deltaLon + lonOffset) * pct, endCoord[1] + (deltaLat + latOffset) * pct];
  }

  pointSource(endCoord, endDate, lonOffset, latOffset) {

    const curCoord = this.shipCoord(endCoord, endDate, lonOffset, latOffset);
    const ret = {
      type: 'Point',
      coordinates: curCoord
    }
    return ret;
  }

  updateShips() {

    // iterate backwards to allow deletion in-place
    for (let i = this.shipArr.length - 1; i >= 0; i--) {
      const curObj = this.shipArr[i]
      if (curObj.endDate < this.appTime) {
        // delete completed journey
        this.shipArr.splice(i, 1);
      } else {
        this.shipArr[i].sourceData = this.pointSource(curObj.endCoord, curObj.endDate, curObj.lonOffset, curObj.latOffset);

      }
    }
  }



  circleEnter(shipIdx: number) {
    this.shipArr[shipIdx].showPopup = true;
  }
  circleExit(shipIdx: number) {
    this.shipArr[shipIdx].showPopup = false;
  }

  getAppTime() {
    return this.appTime.toUTCString();
  }



  mouseDown() {
    this.slideClickState = 1;

  }

  mouseUp() {
    if (this.slideClickState === 1) {
      this.slideClickState = 2;
    }
  }

  sliderChange(ev) {

    if (this.slideClickState === 2) {
      const totalMs = this.maxDate.getTime() - this.minDate.getTime();
      this.appTime = new Date(this.minDate.getTime() + totalMs * this.slider / 100)
      this.slideClickState = 0;
      this.shipArr = [];
      const pullTime = new Date(this.appTime.getTime() - this.daysToShow * 24 * 3600 * 1000);
      this.doPull(pullTime, this.daysToShow);
    }


  }

  getPaint(obj) {
    
    const radius = Math.max(Math.log(obj.weight)/2,1);

    return {
      'circle-radius': radius,
      'circle-color': 'red'
    }
  }


  // Not yet used but could be useful.
  // saveMap(map: Map) {
  //   this.map = map;
  // }

}


