import os
import logging
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pprint import pformat
from Database import Database, DatabaseError

# --- Configuration ---
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("DB_Test_Suite")


def log_step(step_num, title):
    """Helper to print clear step headers."""
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {title}")
    print(f"{'='*60}")


def run_tests():
    load_dotenv()

    # 1. Environment Check
    required_vars = ['host', 'port', 'usernameDB', 'password', 'database']
    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        logger.error(f"Missing .env variables: {missing}")
        logger.error("Please create a .env file with the connection details.")
        return

    db = Database(
        host=os.getenv('host'),
        port=os.getenv('port'),
        user_name=os.getenv('usernameDB'),
        password=os.getenv('password'),
        database=os.getenv('database')
    )

    reservation_id = None

    try:
        # --- Connection ---
        log_step(1, "Connecting to Database")
        db.connect()
        logger.info("Successfully connected to the MySQL database.")

        # --- Create ---
        log_step(2, "Creating a New Reservation")
        # Use a timestamp to ensure uniqueness for the test run
        test_host_name = f"TestHost_{int(datetime.now().timestamp())}"

        logger.info(
            f"Attempting to create reservation for host: {test_host_name}")

        # FIX: Ensure end time is AFTER start time to satisfy DB constraint
        start_time = datetime.now()
        end_time = start_time + timedelta(hours=3)

        reservation_id = db.create_reservation(
            host_name=test_host_name,
            host_email="test.auto@example.com",
            host_role="Automated Tester",
            event_title="Integration Test Event",
            event_description="This is an automated test event.",
            event_requirement="Projector",
            event_guests=42,
            event_location="Test Room A",
            event_start=start_time,
            event_end=end_time,
            room_id=1,  # Ensure this ID exists in your seeded DB
            status="Pending"
        )

        if not reservation_id:
            logger.error("Failed to acquire a reservation ID. Aborting.")
            return

        logger.info(f"Reservation Created! ID: {reservation_id}")

        # Short sleep to ensure transaction visibility (rarely needed but good for safety)
        time.sleep(0.5)

        # --- Read (Get) ---
        log_step(3, "Retrieving Reservation (Verification)")

        # Test 3a: Get by Host Name
        logger.info(
            f"Searching for reservations by host name: '{test_host_name}'...")
        results_by_name = db.get_reservations(host_name=test_host_name)

        found = False
        for res in results_by_name:
            if res['reservation_id'] == reservation_id:
                logger.info("Found newly created reservation by Host Name.")
                logger.debug(f"Details: {pformat(res)}")
                found = True
                break

        if not found:
            logger.error(
                "Could not find the new reservation by unique host name!")
            # Fallback check by ID
            logger.info("Attempting fallback check by Reservation ID...")
            results_by_id = db.get_reservations(reservation_id=reservation_id)
            if results_by_id:
                logger.info(f"Found by ID! Count: {len(results_by_id)}")
                # If we found it by ID but not by Host Name, that's a specific bug hint
                logger.warning(
                    "BUG HINT: Found by ID but NOT by Host Name filter!")
            else:
                logger.error(
                    "Could not find reservation by ID either. Creation might have rolled back?")
                return

        # --- Update ---
        log_step(4, "Updating Reservation")
        new_title = "UPDATED Test Event Title"
        logger.info(
            f"Updating status to 'Confirmed' and title to '{new_title}'...")

        success = db.update_reservation(
            reservation_id=reservation_id,
            status="Confirmed",
            event_title=new_title
        )

        if success:
            logger.info("Update returned success.")
            # Verify update
            updated_res = db.get_reservations(reservation_id=reservation_id)
            if updated_res and updated_res[0]['event_title'] == new_title:
                logger.info(
                    "Verification: Title was successfully updated in DB.")
            else:
                logger.error(
                    "Verification Failed! Data in DB does not match update.")
        else:
            logger.error("Update operation failed.")

        # --- Delete ---
        log_step(5, "Deleting Reservation (Cleanup)")
        logger.info(f"Deleting reservation ID: {reservation_id}...")

        del_success = db.delete_reservation(reservation_id)
        if del_success:
            logger.info("Delete returned success.")
            # Verify gone
            remaining = db.get_reservations(reservation_id=reservation_id)
            if not remaining:
                logger.info("Verification: Reservation is gone.")
            else:
                logger.error(
                    "Verification Failed! Reservation still exists in DB.")
        else:
            logger.error("Delete operation failed.")

    except DatabaseError as e:
        logger.critical(f"Database Operation Failed: {e}")
    except Exception as e:
        logger.critical(f"Unexpected Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("Starting Backend Database Integration Tests...")
    run_tests()
    print("\nTests Completed.")
