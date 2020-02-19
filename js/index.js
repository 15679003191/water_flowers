/**
 * 绘制刻度盘
 * 配置参数
 * 颜色配置
    tick_color: "#555962",  // 未达到的刻度颜色
    tick_on_color: "#527d98", // 已达到的刻度颜色
    on_color_gradient: // 已达到的刻度颜色，渐变效果，详细参考demo中，guage1。值为Array
                          例如：
                           on_color_gradient: [
                            {
                              color: "#50B517",
                              percent: 0 // 最开始，0%
                            },
                            {
                              color: "#000000",
                              percent: 100 // 结束，100%
                            },
                          ]
                          on_color_gradient 设置之后，tick_on_color则不会生效

    center_font_color: '#555962', //中间数字颜色  设置为#fff-#000时，表示从左往右渐变
    bg_color: // cavans的背景色

 * 尺寸配置：
 *  tick_length: 80, // 短刻度长度
    large_tick_length: 110, // 长刻度长度
    tick_thickness: 6, //刻度条宽度
    tick_group_length: 9, //每组内的短刻度个数
    ticks_groups_begin: 0, //起始点
    total_degrees: 240, // 刻度的总角度
    animation_duration: 550, //达到目标值的动画时间
    total_tick: 101, // 刻度总个数
    show_num: true, // 是否展示长刻度下的数字
    show_center_num: true, // 是否显示中间大的数字
    center_font_size: 200, //中间数字font-size
    center_num_font_family: ,//中间数字font-family
    num_gap: 1, // 每个刻度之间的间隔值，计算显示数字时需要
    num_begin: 0, // 起始刻度值
    num_font_size: 24, // 刻度值字体大小
    num_font_family: 'HanHei SC,PingFang SC,Helvetica Neue Thin, Helvetica, STHeitiSC-Light, Arial, sans-serif' // 刻度数字font-family

  * 不建议随意修改的参数
    tickmask_offset: 10 // 刻度值距离刻度的间隔, 单位px,
    center_offset: {
      x: 0,
      y: 0
    }, // 中间数字上下位置的偏移
    circle_radius: 5, // 刻度指示圆形的半径
    circle_offset: 0 // 刻度指示距离刻度的空隙
    gauge_scale: 1, // 缩放比例
 *@method [render]  绘制初始图形
 *@method [setTickOnColor] 设置tick_on_color颜色
 *@method [setAnimaDur] 设置动画总时间
 *@method [updatePercent] 示数动画开始
 *@example
 * 使用方法
 *  var my_canvas_obj= document.getElementById("my-canvas");
    var gauge= new SOFAGauge({
        "tick_length": 20,
        "large_tick_length": 30,
        "tick_thickness": 1,
        "tick_group_length": 9,
        "ticks_groups_begin": 0,
        "total_degrees": 240,
        "total_tick": 101,
        "tick_color": "#a6a6ad",
        "tick_on_color": "#527d98",
        "gauge_scale": 1,
        "animation_duration": 1000,
        "percent": 0,
        "canvas": my_canvas_obj
     });
     gauge.render(); //render the configured gauge
     gauge.updatePercent(60); //animate the gauge to 60%
 */
// document.write('<script src="hex_hmac_sha1.js" type="text/javascript" charset="utf-8"></script>');
// document.write('<script src="mqtt.min.js" type="text/javascript" charset="utf-8"></script>');
// document.write('<script src="paho-mqtt.js" type="text/javascript" charset="utf-8"></script>');
// const mqtt = require('mqtt.min.js');
// const crypto = require('hex_hmac_sha1.js');

(function (window) {
  var PIDEG = Math.PI / 180;
  function Gauge (options) {
    //set defaults
    var properties= {
      tick_length: 80,
      large_tick_length: 110,
      tick_thickness: 6,
      tick_group_length: 9,
      ticks_groups_begin: 0,
      total_degrees: 240,
      tick_color: "#555962",
      tick_on_color: "#527d98",
      on_color_gradient: null,
      bg_color: null,
      gauge_scale: 1,
      animation_duration: 550,
      total_tick: 101,
      show_num: true,
      show_center_num: true,
      center_font_size: 200,
      center_font_color: '#555962',
      cur_score_circle_color: '#555962',
      center_offset: {
        x: 0,
        y: 0
      },
      center_num_font_family: 'HanHei SC, PingFang SC, Helvetica Neue Thin, Helvetica, STHeitiSC-Light, Arial, sans-serif',
      num_gap: 1,
      num_begin: 0,
      num_font_size: 16,
      tickmask_offset: 0,
      num_font_family: 'HanHei SC, PingFang SC, Helvetica Neue Thin, Helvetica, STHeitiSC-Light, Arial, sans-serif',
      circle_radius: 5,
      circle_offset: 0,
      center_text_unit: '分',
      center_text_offset: {
        x: 16,
        y: 8
      }
    };
    this.mergeOptions(properties, options)
    this._canvas = options.canvas;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this._canvas.width;
    this.canvas.height = this._canvas.height;
    this.delatLength = this.large_tick_length - this.tick_length;
    this.context = this.canvas.getContext('2d');
    this._context = this._canvas.getContext('2d');
    this._percent = options.percent || 0;
    this._target_percent = this._percent;
    this.tickmask_offset = this.getTickMarkOffset(this.tickmask_offset)
    this._halfCanvasWidth = this.canvas.width / 2;
    this._halfCanvasHeight = this.canvas.height / 2;
    this._rotation_deg = this.getRotationDeg()
    return this;
  }
  Gauge.prototype.mergeOptions = function(defaultOpt, options) {
    var _this = this;
    this._property_list = Object.keys(defaultOpt);
    this._property_list.forEach(function(key) {
      _this[key] = typeof options[key] === 'undefined' ? defaultOpt[key] : options[key]
    })
  }
  Gauge.prototype.getTickMarkOffset = function() {
    return this.tickmask_offset + this.circle_radius * 2 + this.circle_offset;
  }
  Gauge.prototype.getRotationDeg = function() {
    return this.total_degrees / (this.total_tick - 1) * PIDEG;
  }
  Gauge.prototype.render = function (percent) {
    if (typeof percent !== 'undefined') {
      this._percent = percent
    }
    var canvas = this.canvas;
    var context = this.context;
    context.save(); //save original state of context to that it can be restore after rendering
    this._prepareStage();
    //figure out how many degrees between each tick
    var num_ticks = this.total_tick;
    //adjust for smaller than 180 degree gauges
    var starting_deg = (180 - this.total_degrees) / 2;
    context.rotate(starting_deg * PIDEG);
    this._drawScoreTipCircle(this._halfCanvasWidth - this.circle_radius, this.circle_radius, 0);
    //draw all of the ticks
    for(var i = 1; i <= num_ticks; i++) {
      //should this tick be on or off?
      var is_on = (((i - 1) / num_ticks) * 100 < this._percent);
      //scale the ticks at group split
      var _isLargeTick = this._isLargeTick(i)
      var rect_scale = _isLargeTick ? this.large_tick_scale : 1;
      var tick_length = _isLargeTick ? this.large_tick_length : this.tick_length;
      //draw tick
      var color = this._getTickColor(is_on, i);
      context.fillStyle = color;
      if (_isLargeTick) {
        context.fillRect(-1*this._halfCanvasWidth + this.circle_radius * 2 + this.circle_offset, -this.tick_thickness/2, tick_length, this.tick_thickness);
        if (this.show_num) {
          this._drawGaugeNum(tick_length, i);
        }
      } else {
        context.fillRect(-1*this._halfCanvasWidth + this.circle_radius * 2 + this.circle_offset + this.delatLength, -this.tick_thickness/2, tick_length, this.tick_thickness);
      }
      //rotate for next tick to be placed
      context.rotate(this._rotation_deg);
    }
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.drawImage(this.canvas, 0, 0);
    context.restore(); //set back to original state
  };

  Gauge.prototype.setTickOnColor = function (option) {
    this.tick_on_color = option.tick_on_color || this.tick_on_color;
    this.on_color_gradient = option.on_color_gradient || null;
    this.center_font_color = option.center_font_color || this.tick_on_color;
    this.cur_score_circle_color = option.cur_score_circle_color || this.cur_score_circle_color || this.tick_on_color;
  }

  Gauge.prototype.setAnimaDur = function (duration) {
    this.animation_duration = duration;
  }

  Gauge.prototype.updatePercent = function(percent, options) {
    if (percent - 0.1 < 0) {
      return;
    }
    var _this = this;
    this._target_percent = percent;
    options = options || {};
    var duration = ('animation_duration' in options) ? options.animation_duration : _this.animation_duration;
    if(duration) {
      var lastUpdate = +new Date();
      var start = this._percent;
      var end = this._target_percent;
      var change_per_ms = (end - start)/duration;
      var increasing = change_per_ms > 0 ? 1 : 0;
      this.colorArray = this._gradientColorArray();
      var update = function () {
        var now = +new Date();
        var elapsed = now - lastUpdate;
        _this._percent += elapsed*change_per_ms;
        lastUpdate= now;
        //check if we've made it to our stopping point
        if ((increasing && _this._percent < _this._target_percent)
          || (!increasing && _this._percent > _this._target_percent)) {
          _this.render();
          _this._requestAnimFrame(update);
        }
        else {
          _this._percent = _this._target_percent;
          _this.render();
        }
      };
      _this._requestAnimFrame(update);
    }
    else {
      _this._percent = percent;
      _this.render();
    }
  };

  // 私有函数
  Gauge.prototype._requestAnimFrame = function (f) {
    var anim = window.requestAnimationFrame
      || window.webkitRequestAnimationFrame
      || window.mozRequestAnimationFrame
      || window.oRequestAnimationFrame
      || window.msRequestAnimationFrame
      || function (callback, element) {
        window.setTimeout(function () {
          callback(+new Date);
        }, 1000 / 60);
      };
    anim(f);
  };

  Gauge.prototype._applyBG = function () {
    var canvas = this.canvas;
    var context = this.context;
    if (this.bg_color) {
      context.save();
      context.fillStyle = this.bg_color;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.restore();
    }
  };

  Gauge.prototype._prepareStage = function() {
    var canvas = this.canvas;
    var context = this.context;
    //clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    //set background
    this._applyBG();
    //set the center of rotation to the bottom/center of the canvas
    context.translate(this._halfCanvasWidth, this._halfCanvasHeight - this.tick_thickness / 2);
    //set the scale of the gauge (will naturally fill the width of the canvas
    context.scale(this.gauge_scale, this.gauge_scale);
    //draw center big num
    if (this.show_center_num) {
      this._drawCenterNum();
    }
  };

  Gauge.prototype._gradientColorArray = function () {
    var colorArray = []
    if (!this.on_color_gradient || !this._target_percent) {
      return
    }
    for(var i = 0; i < this.on_color_gradient.length - 1; i++) {
      var next = this.on_color_gradient[i + 1];
      var cur = this.on_color_gradient[i];
      var colorStep = (next.percent - cur.percent) / 100 * this.total_tick;
      colorArray = colorArray.concat(new gradientColor(cur.color, next.color, colorStep));
    }
    return colorArray;
  }

  Gauge.prototype._getTickColor = function (is_on, index) {
    var _index = index < 1 ? 1 : index;
    if (is_on) {
      if (this.colorArray && this.colorArray.length > 0) {
        return this.colorArray[_index-1];
      } else {
        return this.tick_on_color;
      }
    } else {
      return this.tick_color;
    }
  }

  Gauge.prototype._isLargeTick = function(currentNum) {
    return (currentNum + this.ticks_groups_begin - 1) % (this.tick_group_length + 1) === 0
  };

  Gauge.prototype._drawScoreTipCircle = function (beginX, beginY) {
    var context = this.context;
    var is_on = this._percent > 0.01;
    context.save();
    context.fillStyle = this._percent > 0.01 ? this.cur_score_circle_color : this.tick_color; // this._getTickColor(is_on, Math.floor(this._percent));
    context.rotate(this._percent * this.total_degrees / 100 * PIDEG);
    context.beginPath();
    context.arc(-beginX, -beginY, this.circle_radius, 0, Math.PI*2,true);
    context.closePath();
    context.fill();
    context.restore();
  };

  Gauge.prototype._drawCenterNum = function () {
    var context = this.context;
    var canvas = this.canvas;
    var fillColor = this.center_font_color ? this.center_font_color.split('-') : [this.tick_on_color];
    var centerText = Math.floor(this._percent * ((this.total_tick - 1) * this.num_gap + this.num_begin) / 100);
    var gaugeWidth = this.canvas.width / 2 - this.circle_radius * 2 - this.circle_offset - this.large_tick_length - this.tickmask_offset
    context.save();
    if (fillColor.length === 2) {
      var gradient = context.createLinearGradient(-gaugeWidth, 0, gaugeWidth, 0);
      gradient.addColorStop('0', fillColor[0]);
      gradient.addColorStop('0.7', fillColor[1]);
      gradient.addColorStop('1', fillColor[1]);
      context.fillStyle = gradient;
    } else {
      context.fillStyle = fillColor[0];
    }
    context.font = this.center_font_size + 'px ' + this.center_num_font_family;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    var centerTextWidth = Math.floor(context.measureText(centerText).width);
    context.fillText(centerText, this.center_offset.x, this.center_offset.y);
    context.font = '30px ' + this.num_font_family;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(this.center_text_unit, centerTextWidth/2 + this.center_text_offset.x, this.center_text_offset.y);
    context.restore();
  };

  Gauge.prototype._drawGaugeNum = function (tick_length, tickIndex) {
    var canvas = this.canvas;
    var context = this.context;
    var text = this.num_begin + this.num_gap*tickIndex - 1;
    var textWidth = context.measureText(text).width;
    context.save();
    //set the center of rotation to the text middle
    context.translate(-1 * this._halfCanvasWidth + tick_length + this.circle_radius * 2 + this.circle_offset + this.num_font_size / 2, -this.tick_thickness / 2);
    context.rotate(-90 * PIDEG);
    context.font = this.num_font_size + 'px ' + this.num_font_family;
    context.textAlign ='center';
    context.textBaseline ='middle';
    context.fillText(text , 0, this.tickmask_offset);
    context.restore();
  };

  window.Gauge= Gauge;
}
)(window);

function gradientColor(startColor,endColor,step){
  startRGB = this.colorRgb(startColor);//转换为rgb数组模式
  startR = startRGB[0];
  startG = startRGB[1];
  startB = startRGB[2];

  endRGB = this.colorRgb(endColor);
  endR = endRGB[0];
  endG = endRGB[1];
  endB = endRGB[2];

  sR = (endR-startR)/step;//总差值
  sG = (endG-startG)/step;
  sB = (endB-startB)/step;

  var colorArr = [];
  for(var i=0;i<step;i++){
  //计算每一步的hex值
     var hex = this.colorHex('rgb('+parseInt((sR*i+startR))+','+parseInt((sG*i+startG))+','+parseInt((sB*i+startB))+')');
     colorArr.push(hex);
  }
  return colorArr;
}
// 将hex表示方式转换为rgb表示方式(这里返回rgb数组模式)
gradientColor.prototype.colorRgb = function(sColor){
  var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
  var sColor = sColor.toLowerCase();
  if(sColor && reg.test(sColor)){
     if(sColor.length === 4){
         var sColorNew = "#";
         for(var i=1; i<4; i+=1){
             sColorNew += sColor.slice(i,i+1).concat(sColor.slice(i,i+1));
         }
         sColor = sColorNew;
     }
     //处理六位的颜色值
     var sColorChange = [];
     for(var i=1; i<7; i+=2){
         sColorChange.push(parseInt("0x"+sColor.slice(i,i+2)));
     }
     return sColorChange;
  }else{
     return sColor;
  }
};
// 将rgb表示方式转换为hex表示方式
gradientColor.prototype.colorHex = function(rgb){
  var _this = rgb;
  var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
  if(/^(rgb|RGB)/.test(_this)){
     var aColor = _this.replace(/(?:(|)|rgb|RGB)*/g,"").split(",");
     var strHex = "#";
     for(var i=0; i<aColor.length; i++){
         var hex = Number(aColor[i]).toString(16);
         hex = hex<10 ? 0+''+hex :hex;// 保证每个rgb的值为2位
         if(hex === "0"){
             hex += hex;
         }
         strHex += hex;
     }
     if(strHex.length !== 7){
         strHex = _this;
     }
     return strHex;
  }else if(reg.test(_this)){
     var aNum = _this.replace(/#/,"").split("");
     if(aNum.length === 6){
         return _this;
     }else if(aNum.length === 3){
         var numHex = "#";
         for(var i=0; i<aNum.length; i+=1){
             numHex += (aNum[i]+aNum[i]);
         }
         return numHex;
     }
  }else{
     return _this;
  }
}

//点击控制button
(function(select){
    var box = document.querySelector(select)
    var checkbox = box.querySelector("input");
    box.onclick = function(){
        // checkbox.checked = !checkbox.checked;
        console.log("cleck!", checkbox.checked);
        this.classList.toggle("swich-on");
        if(checkbox.checked){
            console.log("已经选中");
            checkbox.checked = false;
            mqttX.sendMessage('ctrl', {"switch": "ON"})
        }else{
            console.log("没有选中");
            checkbox.checked = true;
            mqttX.sendMessage('ctrl', {"switch": "OFF"})
        }
    }
})(".swich");

// app
var my_canvas_obj1= document.getElementById("gauge1");
var my_canvas_obj2= document.getElementById("gauge2");

var gauge1 = new Gauge({
  "tick_length": 12,
  "large_tick_length": 22,
  "tick_thickness": 1,
  "tick_group_length": 9,
  "ticks_groups_begin": 0,
  "total_degrees": 250,
  "total_tick": 101,
  "tick_color": "#666",
  "num_font_size": 18,
  "percent": 0,
  "center_font_size": 172,
  on_color_gradient: [
    {
      color: "#9ED110",
      percent: 0
    },
    {
      color: "#50B517",
      percent: 10
    },
    {
      color: "#8adec2",
      percent: 20
    },
    {
      color: "#08d9fb",
      percent: 40
    },
    {
      color: "#883efd",
      percent: 50
    },
    {
      color: "#FF5800",
      percent: 60
    },
    {
      color: "#FF8100",
      percent: 70
    },
    {
      color: "#FEAC00",
      percent: 80
    },
    {
      color: "#FFCC00",
      percent: 90
    },
    {
      color: "#ff0000",
      percent: 100
    }
  ],
  animation_duration: 2000,
  tick_on_color: '#f1594e',
  cur_score_circle_color: '#ff5e52',
  center_font_color: '#a0a0a0',
  center_text_unit: '°C',
  "canvas": my_canvas_obj1
})

var gauge2 = new Gauge({
  "tick_length": 12,
  "large_tick_length": 22,
  "tick_thickness": 1,
  "tick_group_length": 9,
  "ticks_groups_begin": 0,
  "total_degrees": 250,
  "total_tick": 101,
  "tick_color": "#666",
  "num_font_size": 18,
  "percent": 0,
  "center_font_size": 172,
  tick_on_color: '#f1594e',
  cur_score_circle_color: '#ff5e52',
  center_font_color: '#ff5e52',
  center_text_unit: 'RH',
  animation_duration: 1000,
  "canvas": my_canvas_obj2
})

gauge1.render(0);
gauge2.render(0);
//mqttx 初始化
mqttX.init({
	id:'water_system_web',
	ip:'121.40.78.172',
	port:8083,
	success:function(){
		console.log("mqttx连接成功");
		mqttX.subscribe('web_data');
	},
	error:function(){
		console.log("mqttx连接失败");
	},
	connectLost:function(){
		console.log("mqttx连接丢失");
		mqttX.reconnect();
	},
	onMessage:function(message){
		console.log("recevice topic message:",message.payloadString);
		var jsonObj = JSON.parse(message.payloadString);
        gauge1.render(jsonObj.temper);
        gauge2.render(jsonObj.humi);
        var image = document.getElementById('alarm');
        if(jsonObj.alarm == 1){
          image.src = "../image/alarm_red.png";
        }
        else{
          image.src = "../image/alarm_green.png";
        }
	}
});