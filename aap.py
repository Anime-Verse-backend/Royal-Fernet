import time 
import random

print("hola hora es: ", time.strftime("%H:%M:%S"))


nombre = input("¿Cuál es tu nombre? ")
random_number = random.randint(1, 100)

def calcular(nombre, random_number):
    nombre = input("¿Cuál es tu nombre? ")
    random_number = random.randint(1, 100)
    print("{nombre} es un {random_number} gey")
    
calcular(nombre, random_number)