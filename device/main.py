# @Author: FourLeafClover
# @Date:   2019-06-09 11:07:31
# @Last Modified by:   FourLeafClover
# @Last Modified time: 2019-06-09 18:47:37
from machine import Pin, Timer
import dht
from simple import MQTTClient
import ujson
import time

LED 	= Pin(2, Pin.OUT)    		# create output pin on GPIO0
BEEP    = Pin(4, Pin.OUT)			# D2
MOTOR   = Pin(14, Pin.OUT)			# D5
DHT 	= dht.DHT11(machine.Pin(5)) # D1

def sub_cb(topic, msg):
    print((topic, msg))
    data = ujson.loads(msg)["switch"]

    if data == "ON":
    	LED.on()
    	MOTOR.on()
    else:
    	LED.off()
    	MOTOR.off()

def send_data(t):
	print("send_data")
	DHT.measure()
	temper = DHT.temperature() 
	humi = DHT.humidity()    
	print("temper:", temper, "humi:", humi)

def do_connect():
    import network
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    if not wlan.isconnected():
        print('connecting to network...')
        wlan.connect('YSZN', 'yszn88888')
        while not wlan.isconnected():
            pass

    print('network config:', wlan.ifconfig())

def main():
    server = "121.40.78.172"
    CLIENT_ID = "water_system_device"
    TOPIC = b"water_flowers/ctrl"
    
    LED.off() 
    do_connect()

    c = MQTTClient(CLIENT_ID, server,port=1883, keepalive=60)
    # Subscribed messages will be delivered to this callback
    c.set_callback(sub_cb)
    c.connect()
    c.subscribe(TOPIC)
    print("connect success!")

    tim = Timer(-1)
    tim.init(freq=1, mode=Timer.PERIODIC, callback=lambda t:c.ping())
    tim.init(period=5000, mode=Timer.PERIODIC, callback=lambda t:c.ping())

    try:
        while 1:
        #micropython.mem_info()
            c.wait_msg()
            DHT.measure()
            temper = DHT.temperature()
            humi = DHT.humidity()
            if temper > 30 or humi > 80:
            	alarm = 1
            	BEEP.on()
            else:
            	alarm = 0
            	BEEP.off()
            string = '{"temper":'+str(temper)+',"humi":'+str(humi)+',"alarm":'+str(alarm)+'}'
            print("temper:", temper, "humi:", humi, "alarm:", alarm)
            c.publish("water_flowers/web_data", string, qos=1)

            # c.ping()
            time.sleep_ms(1000)
    finally:
        c.disconnect()

main()