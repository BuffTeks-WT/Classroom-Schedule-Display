#This Python script handles the API server using FastAPI. 

from fastapi import FastAPI
import json
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from Database import *
import os

##These are enviromental variables for the Database. You will need to create your own.
host = os.getenv('host')
port = os.getenv('port')
userName = os.getenv('usernameDB')
passWord = os.getenv('password')
database = os.getenv('database')

currentDatabase = Database(host, port, userName, passWord, database)
currentDatabase.CreateMySQLConnectorInstance()

app = FastAPI()

@app.get("/reservations")
async def GetEvents():
    eventsJSON = jsonable_encoder(currentDatabase.GetReservations())
    return JSONResponse(content=eventsJSON)


#To run this server
#1. Verify your terminal is currently referencing this file path (use cd .\Backend\main.py if not).
#2. Run this command:
#uvicorn main:app