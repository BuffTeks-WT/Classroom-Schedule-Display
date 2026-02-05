#This Python script handles the API server using FastAPI. 

from fastapi import FastAPI
import json
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from Database import DatabaseObject
import os
from datetime import datetime

app = FastAPI()

##These are enviromental variables for the Database. You will need to create your own.
host = os.getenv('host')
port = os.getenv('port')
userName = os.getenv('usernameDB')
passWord = os.getenv('password')
database = os.getenv('database')

currentDatabase = DatabaseObject(host, port, userName, passWord, database)
currentDatabase.CreateMySQLConnectorInstance()

@app.get("/rooms")
async def GetRooms(roomId: int | None = None):
    roomsJSON = jsonable_encoder(currentDatabase.GetRooms(roomId))
    return JSONResponse(content=roomsJSON)


@app.get("/reservations")
async def GetEvents():
    eventsJSON = jsonable_encoder(currentDatabase.GetReservations())
    return JSONResponse(content=eventsJSON)


@app.get("/hosts")
async def GetHosts(hostId: int | None = None):
    hostsJSON = jsonable_encoder(currentDatabase.GetHosts(hostId))
    return hostsJSON


'''
class ReservationEventModel(BaseModel):
    hostName: str
    eventTitle: str
    eventDescription: str
    eventRequirements: str
    eventsGuestCount: int
    eventLocationId: int
    eventDateTime: datetime

    
@app.post("/reservations")
async def CreateReservationAndEvent(ReservationEvent:ReservationEventModel):
    print(ReservationEvent.eventDateTime)
'''

#To run this server
#1. Verify your terminal is currently referencing this file path (use cd .\Backend\main.py if not).
#2. Run this command:
#uvicorn main:app