#This Python script handles the API server using FastAPI. 

from fastapi import FastAPI

app = FastAPI()

#For this function, the goal is to take a user's username and password
#and by calling a function in the database connection Python file, return a pass or fail
#possibly represented as a boolean (and maybe some other stuff like HTTP status codes)
@app.get("/")
async def root():
    return None

    #For this function, we can return HTML

#To run this server
#1. Verify your terminal is currently referencing this file path (use cd .\Backend\main.py if not).
#2. Run this command:
#uvicorn app:app