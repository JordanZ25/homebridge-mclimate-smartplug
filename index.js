var Service, Characteristic;
const axios = require('axios');
module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-mclimate-smartplug", "MClimate-SmartPlug", SmartPlugAccessory);
}

function SmartPlugAccessory(log, config) {
    this.log = log;
    this.name = config["name"];
    this.plugName = config["plug_name"] || this.name; // fallback to "name" if you didn't specify an exact "bulb_name"
    // this.binaryState = 0; // bulb state, default is OFF
    this.log("Starting a smart plug device with name '" + this.plugName + "'...");
    this.serial_number = config['serial_number'];
    this.access_token = config['access_token'];
}
SmartPlugAccessory.prototype.getPowerOn = function(callback) {
    var plugName = this.plugName
    axios({
        method: 'get',
        url: "https://developer-api.seemelissa.com/v1/controllers/5CJ213423P5Y8",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 8f9bad8a25120b3b1402d40f7a09edd30ce7e3bd'
        }
    }).then(function(response) {
        var controller = response.data.controller;
        var relay_state = controller.relay_state;
        this.binaryState = relay_state ? 1 : 0;
        var state = relay_state ? 'on' : 'off';
        console.log("Power state for the '%s' is %s", plugName, state);
        callback(null, binaryState);
    })
}
SmartPlugAccessory.prototype.setPowerOn = function(powerOn, callback) {
    console.log(powerOn);
    // this.binaryState = powerOn ? 'on' : 'off'; 
    var state = powerOn ? 'on' : 'off';
    var plugName = this.plugName
    callback(null);
    axios({
        method: 'post',
        url: 'https://developer-api.seemelissa.com/v1/provider/send',
        data: {
            "serial_number": this.serial_number,
            "command": "switch_on_off",
            "state": state
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.access_token
        }
    }).then(function(response) {
        console.log("Set power state on the '%s' to %s", plugName, state);
    })
}
SmartPlugAccessory.prototype.getServices = function() {
    var smartPlugService = new Service.Outlet(this.name);
    smartPlugService.getCharacteristic(Characteristic.On).on('get', this.getPowerOn.bind(this)).on('set', this.setPowerOn.bind(this));
    return [smartPlugService];
}