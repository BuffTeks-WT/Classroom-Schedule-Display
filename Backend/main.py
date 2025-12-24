#This Python script handles the API server using FastAPI. 

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from database import *
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

##These are enviromental variables for the Database. You will need to create your own.
host = os.getenv('host')
port = os.getenv('port')
userName = os.getenv('usernameDB')
passWord = os.getenv('password')
database = os.getenv('database')

currentDatabase = Database(host, port, userName, passWord, database)
currentDatabase.CreateMySQLConnectorInstance()

app = FastAPI()

# CORS middleware - allows frontend to access API
# SECURITY: Once in production, replace with specific frontend domains
allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/reservations")
async def GetEvents():
    eventsJSON = jsonable_encoder(currentDatabase.GetReservations())
    return JSONResponse(content=eventsJSON)


#To run this server
#1. Verify your terminal is currently referencing this file path (use cd .\Backend\main.py if not).
#2. Run this command:
#uvicorn main:app