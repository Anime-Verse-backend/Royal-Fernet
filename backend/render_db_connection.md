# Guía de Conexión de Base de Datos para Despliegue en Render

Esta guía te ayudará a conectar tu backend de Python (Flask) a una base de datos externa cuando lo despliegues como un "Web Service" en Render.

## 1. Creación del Web Service en Render

1.  Ve a tu Dashboard de Render y haz clic en **"New"** > **"Web Service"**.
2.  Conecta tu repositorio de GitHub donde se encuentra este proyecto.
3.  Render detectará que es una aplicación de Python. Dale un nombre a tu servicio (ej. `royal-fernet-backend`).

## 2. Configuración de Comandos (¡MUY IMPORTANTE!)

En la configuración del servicio (`Settings` > `Build & Deploy`), asegúrate de establecer los siguientes comandos **EXACTAMENTE** como se muestra a continuación.

- **Build Command (Comando de Construcción)**:

  ```bash
  bash build.sh
  ```

  _Esto le dice a Render que, para construir, debe ejecutar nuestro script. El script primero instalará las dependencias y luego preparará la base de datos._

- **Start Command (Comando de Inicio)**:
  ```bash
  gunicorn --worker-tmp-dir /dev/shm app:app
  ```
  _Este es el comando que inicia tu servidor de producción Gunicorn y lo mantiene activo. Se ejecuta DESPUÉS del comando de construcción. El límite de tamaño de las peticiones ahora se gestiona dentro del código de Flask (`app.py`), que es el enfoque correcto._

## 3. Configuración de Variables de Entorno

En la sección **"Environment"** de la configuración de tu servicio en Render, añade las siguientes variables:

- `DATABASE_URL`: La **"Internal Connection String"** que te proporciona tu base de datos de PostgreSQL en Render. Es una URL larga que empieza con `postgres://`.
- `PYTHON_VERSION`: `3.11.9` (Para asegurar la compatibilidad de las librerías).
- `FRONTEND_URL`: La URL completa de tu frontend desplegado (ej. `https://tu-proyecto.vercel.app`).
- `API_BASE_URL`: La URL completa de este backend en Render. Render te la proporciona (ej. `https://royal-fernet-backend.onrender.com`).

**NO necesitas** las variables `DB_HOST`, `DB_USER`, etc., por separado si ya estás usando `DATABASE_URL`.

## 4. Despliegue Final

Una vez que hayas configurado los comandos y las variables de entorno, haz clic en **"Save Changes"**. Render debería iniciar un nuevo despliegue. Si no lo hace, puedes forzarlo desde la pestaña **"Deploys"** haciendo clic en **"Deploy latest commit"**.

¡Y listo! Tu backend estará en línea, seguro y conectado.
