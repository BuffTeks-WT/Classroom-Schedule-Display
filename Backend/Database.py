import mysql.connector
from mysql.connector import pooling
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseError(Exception):
    """Custom exception for database operations."""
    pass


class Database:

    def __init__(self, host, port, user_name, password, database, pool_name="app_pool", pool_size=5):
        self.host = host
        self.port = port
        self.user_name = user_name
        self.password = password
        self.database = database
        self.pool_name = pool_name
        self.pool_size = pool_size
        self.connection_pool = None

    def connect(self):
        """Initialize the connection pool."""
        try:
            self.connection_pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name=self.pool_name,
                pool_size=self.pool_size,
                pool_reset_session=True,
                host=self.host,
                port=self.port,
                user=self.user_name,
                password=self.password,
                database=self.database
            )
            logger.info(
                f"Database connection pool '{self.pool_name}' created successfully with size {self.pool_size}")
        except mysql.connector.Error as error:
            logger.error(f"Failed to create database connection pool: {error}")
            raise DatabaseError("Could not establish database connection pool")

    def _get_connection(self):
        """Retrieve a connection from the pool."""
        if not self.connection_pool:
            self.connect()

        try:
            return self.connection_pool.get_connection()
        except mysql.connector.Error as error:
            logger.error(f"Failed to get connection from pool: {error}")
            raise DatabaseError("No database connections available")

    def get_reservations(self, reservation_id=None, start_from=None, end_to=None, host_name=None):
        """
        Get reservations using the sp_get_reservations stored procedure.

        Args:
            reservation_id: Filter by exact reservation ID (optional)
            start_from: Filter events starting from this datetime (optional)
            end_to: Filter events ending before this datetime (optional)
            host_name: Filter by partial host name match (optional)

        Returns:
            List of reservation dictionaries with full details

        Raises:
            DatabaseError: If database operation fails
        """
        connection = None
        cursor = None
        try:
            connection = self._get_connection()
            # Use dictionary=True so rows are dicts
            cursor = connection.cursor(dictionary=True)

            logger.debug(f"Calling sp_get_reservations with params: ID={reservation_id}, Start={start_from}, End={end_to}, Host={host_name}")

            # Call the stored procedure with parameters
            # Note: args must match the SP signature order exactly
            cursor.callproc('sp_get_reservations', [
                            reservation_id, start_from, end_to, host_name])

            # Fetch results from the stored procedure
            # stored_results() returns an iterator for each result set
            reservations = []
            
            # We expect the SP to return one main result set
            for result in cursor.stored_results():
                rows = result.fetchall()
                if rows:
                    reservations.extend(rows)

            logger.info(f"Retrieved {len(reservations)} reservations")
            return reservations

        except mysql.connector.Error as error:
            logger.error(f"Database error in get_reservations: {error}")
            raise DatabaseError("Failed to retrieve reservations")

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def create_reservation(self, host_name, host_email, host_role,
                           event_title, event_description, event_requirement,
                           event_guests, event_location, event_start, event_end,
                           room_id, status):
        """
        Call sp_insert_reservation to create a new reservation.
        Returns the new reservation_id on success.
        """
        connection = None
        cursor = None
        try:
            connection = self._get_connection()
            # Use dictionary=True to access result columns by name
            cursor = connection.cursor(dictionary=True)

            args = [
                host_name, host_email, host_role,
                event_title, event_description, event_requirement,
                event_guests, event_location, event_start, event_end,
                room_id, status
            ]

            logger.debug(f"Calling sp_insert_reservation for host: {host_name}")

            cursor.callproc('sp_insert_reservation', args)
            connection.commit()

            # Retrieve the result set from the stored procedure
            # The SP returns a single row with: message, reservation_id, host_id, event_id
            reservation_id = None
            is_success = False
            error_msg = "Unknown error from stored procedure"

            for result in cursor.stored_results():
                row = result.fetchone()
                if row:
                    # Check for 'message' column which SP returns
                    msg = row.get('message')
                    if msg == 'OK':
                        is_success = True
                        reservation_id = row.get('reservation_id')
                        logger.info(f"SP Returned Success: ResID={reservation_id}, HostID={row.get('host_id')}")
                    elif msg:
                        # If SP returns an error message explicitly
                        error_msg = msg

            if not is_success:
                 # If we didn't get 'OK', throw error
                 logger.error(f"SP failed with message: {error_msg}")
                 raise DatabaseError(f"Creation failed: {error_msg}")

            if not reservation_id:
                raise DatabaseError("Reservation created but no ID returned.")

            logger.info(f"Successfully created reservation {reservation_id} for host {host_name}")
            return reservation_id

        except mysql.connector.Error as error:
            if connection:
                connection.rollback()
            logger.error(f"Database error in create_reservation: {error}")
            if error.sqlstate == '45000':
                raise DatabaseError(f"Validation failed: {error.msg}")
            raise DatabaseError(f"Failed to create reservation: {error}")
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def update_reservation(self, reservation_id,
                           host_name=None, host_email=None, host_role=None,
                           event_title=None, event_description=None, event_requirement=None,
                           event_guests=None, event_location=None, event_start=None, event_end=None,
                           room_id=None, status=None):
        """
        Call sp_edit_reservation to update an existing reservation.
        """
        connection = None
        cursor = None
        try:
            connection = self._get_connection()
            cursor = connection.cursor()

            args = [
                reservation_id,
                host_name, host_email, host_role,
                event_title, event_description, event_requirement,
                event_guests, event_location, event_start, event_end,
                room_id, status
            ]
            
            logger.debug(f"Calling sp_edit_reservation for ResID: {reservation_id}")

            cursor.callproc('sp_edit_reservation', args)
            connection.commit()

            logger.info(f"Updated reservation {reservation_id}")
            return True

        except mysql.connector.Error as error:
            if connection:
                connection.rollback()
            logger.error(f"Database error in update_reservation: {error}")
            if error.sqlstate == '45000':
                raise DatabaseError(f"Validation failed: {error.msg}")
            raise DatabaseError("Failed to update reservation")
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def delete_reservation(self, reservation_id):
        """
        Call sp_delete_reservation to remove a reservation.
        """
        connection = None
        cursor = None
        try:
            connection = self._get_connection()
            cursor = connection.cursor()

            logger.debug(f"Calling sp_delete_reservation for ResID: {reservation_id}")

            cursor.callproc('sp_delete_reservation', [reservation_id])
            connection.commit()

            logger.info(f"Deleted reservation {reservation_id}")
            return True

        except mysql.connector.Error as error:
            if connection:
                connection.rollback()
            logger.error(f"Database error in delete_reservation: {error}")
            if error.sqlstate == '45000':  # Handle 'reservation_id is required' or logic errors
                raise DatabaseError(str(error.msg))
            raise DatabaseError("Failed to delete reservation")
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
