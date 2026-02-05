import mysql.connector
from mysql.connector.connection import MySQLConnection


class DatabaseObject():

    def __init__(self, host, port, userName, passWord, database):
        self.port = port
        self.host = host
        self.userName = userName
        self.passWord = passWord
        self.database = database
        self.__mySQLConnectionInstance = None

    def CreateMySQLConnectorInstance(self):
    
        try:
            currentDatabaseInstance = mysql.connector.connect(
                host=self.host,
                user=self.userName,
                password=self.passWord,
                port=self.port,
                database =self.database
            )

            print("success")
            self.__mySQLConnectionInstance = currentDatabaseInstance
        except mysql.connector.Error as error:
            print("could not connect")


    def GetRooms(self, roomId: int):

        try:
            cursor = self.__mySQLConnectionInstance.cursor(dictionary=True)

            if(roomId != None):
                query = f'''
                SELECT * from room r where r.room_id  = %s
                '''
                cursor.execute(query, (roomId,))

            else:
                query = 'SELECT * from room r'
                cursor.execute(query)

            rooms = cursor.fetchall()
            cursor.close()

            return rooms
        except mysql.connector.Error as error:
            return error

    
    
    def GetReservations(self):
        try:
            cursor = self.__mySQLConnectionInstance.cursor(dictionary=True)

            query = '''
            SELECT
                a.reservation_id,
                b.title, description, requirement, numberParticipant, location, startTime, endTime,
                c.name, email, role
            FROM reservation a
	        inner join event b
            on a.eventId = b.event_id
	        inner join host c
            on a.hostId = c.host_id
            '''

            cursor.execute(query)
            reservations = cursor.fetchall()
            cursor.close()

            return reservations
        except mysql.connector.Error as error:
            return error
    
    
    def GetHosts(self, hostId: int):
        try:
            cursor = self.__mySQLConnectionInstance.cursor(dictionary=True)

            if(hostId != None):
                query = f'''
                SELECT * FROM host h
                WHERE h.host_id = %s
                '''
                cursor.execute(query, (hostId,))
                hosts = cursor.fetchall()
            else:
                query = f'''
                SELECT * FROM host h
                '''

                cursor.execute(query)
                hosts = cursor.fetchall()
            
            cursor.close()
            return hosts
        except mysql.connector.Error as error:
            return error





        

