# This Python script handles the API server using FastAPI.

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from datetime import datetime
from database import Database, DatabaseError
from models import ReservationCreate, ReservationUpdate, ReservationResponse
import os
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# These are enviromental variables for the Database.
host = os.getenv('host')
port = os.getenv('port')
user_name = os.getenv('usernameDB')
password = os.getenv('password')
database = os.getenv('database')

from contextlib import asynccontextmanager
import time

# ... (imports remain) ...

# Initialize database object (connection happens in lifespan)
current_database = Database(host, port, user_name, password, database)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handle startup and shutdown logic.
    Attempts to connect to the database with retries.
    """
    # Startup: Connect to DB
    max_retries = 10
    retry_interval = 5  # seconds
    
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Connecting to database (Attempt {attempt}/{max_retries})...")
            current_database.connect()
            logger.info("Database connection established.")
            break
        except DatabaseError as e:
            if attempt == max_retries:
                logger.critical(f"Could not connect to database after {max_retries} attempts. Exiting.")
                raise e
            logger.warning(f"Connection failed: {e}. Retrying in {retry_interval}s...")
            time.sleep(retry_interval)
            
    yield
    
    # Shutdown: (Optional) Close pool if needed, though usually handled by process exit
    logger.info("Shutting down...")


app = FastAPI(
    title="Classroom Schedule API",
    description="API for managing classroom reservations",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - allows frontend to access API
# SECURITY: In production, set ALLOWED_ORIGINS to specific frontend domains
# Example: ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NOTE: For production, we need to consider adding rate limiting using slowapi or similar to prevent API abuse. This might require additional dependencies.


@app.get("/reservations", response_model=List[ReservationResponse])
async def get_reservations(
    reservation_id: Optional[int] = Query(
        None, description="Filter by existing reservation ID", ge=1),
    start_from: Optional[datetime] = Query(
        None, description="Filter events starting from this datetime"),
    end_to: Optional[datetime] = Query(
        None, description="Filter events ending before this datetime"),
    host_name: Optional[str] = Query(
        None, description="Filter by partial host name match", max_length=100)
):
    """
    Get reservations with optional filters.

    Examples:
        GET /reservations - returns all reservations
        GET /reservations?reservation_id=1 - filter by ID
        GET /reservations?start_from=2025-12-01T00:00:00&end_to=2025-12-31T23:59:59 - filter by date range
        GET /reservations?host_name=Haylee - filter by host name
    """
    try:
        reservations = current_database.get_reservations(
            reservation_id=reservation_id,
            start_from=start_from,
            end_to=end_to,
            host_name=host_name
        )
        # We can return the list of ReservationResponse models directly; FastAPI/Pydantic validation can handle the serialization into ReservationResponse models
        if not reservations:
            return []

        return reservations

    except DatabaseError as e:
        logger.error(f"Database error in /reservations endpoint: {e}")
        raise HTTPException(
            status_code=503, detail="Service temporarily unavailable")

    except Exception as e:
        logger.error(f"Unexpected error in /reservations endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/reservations", status_code=201)
async def create_reservation(reservation: ReservationCreate):
    """
    Create a new reservation provided host, event, and room details.
    """
    try:
        current_database.create_reservation(
            host_name=reservation.host.name,
            host_email=reservation.host.email,
            host_role=reservation.host.role,
            event_title=reservation.event.title,
            event_description=reservation.event.description,
            event_requirement=reservation.event.requirement,
            event_guests=reservation.event.numberParticipant,
            event_location=reservation.event.location,
            event_start=reservation.event.startTime,
            event_end=reservation.event.endTime,
            room_id=reservation.roomId,
            status=reservation.reservation_status
        )
        return {"message": "Reservation created successfully"}

    except DatabaseError as e:
        # Check if it's a validation error passed from the DB
        if "Validation failed" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(
            status_code=500, detail="Failed to create reservation")


@app.put("/reservations/{reservation_id}")
async def update_reservation(reservation_id: int, reservation: ReservationUpdate):
    """
    Update an existing reservation. Only provided fields will be updated.
    """
    try:
        # Extract fields if they exist, else None
        h_name = reservation.host.name if reservation.host else None
        h_email = reservation.host.email if reservation.host else None
        h_role = reservation.host.role if reservation.host else None

        e_title = reservation.event.title if reservation.event else None
        e_desc = reservation.event.description if reservation.event else None
        e_req = reservation.event.requirement if reservation.event else None
        e_guests = reservation.event.numberParticipant if reservation.event else None
        e_loc = reservation.event.location if reservation.event else None
        e_start = reservation.event.startTime if reservation.event else None
        e_end = reservation.event.endTime if reservation.event else None

        current_database.update_reservation(
            reservation_id=reservation_id,
            host_name=h_name,
            host_email=h_email,
            host_role=h_role,
            event_title=e_title,
            event_description=e_desc,
            event_requirement=e_req,
            event_guests=e_guests,
            event_location=e_loc,
            event_start=e_start,
            event_end=e_end,
            room_id=reservation.roomId,
            status=reservation.reservation_status
        )
        return {"message": "Reservation updated successfully"}

    except DatabaseError as e:
        if "Validation failed" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(
            status_code=500, detail="Failed to update reservation")


@app.delete("/reservations/{reservation_id}", status_code=204)
async def delete_reservation(reservation_id: int):
    """
    Delete a reservation by ID.
    """
    try:
        current_database.delete_reservation(reservation_id)
        return None  # 204 response has no body

    except DatabaseError as e:
        if "required" in str(e).lower():
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(
            status_code=500, detail=f"Failed to delete reservation: {e}")


# To run this server
# 1. Verify your terminal is currently referencing this file path (use cd .\Backend\main.py if not).
# 2. Run this command:
# uvicorn main:app
