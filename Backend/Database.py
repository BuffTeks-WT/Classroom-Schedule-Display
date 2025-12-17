import mysql.connector
from mysql.connector.connection import MySQLConnection


    

class Database():

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
    
    def GetReservations(self):
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

