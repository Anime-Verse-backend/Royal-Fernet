# Guía de Conexión de Base de Datos para Despliegue en Render

Esta guía te ayudará a conectar tu backend de Python (Flask) a una base de datos externa (como Aiven, o una base de datos de Render) cuando lo despliegues como un "Web Service" en Render.

## 1. Creación del Web Service en Render

1.  Ve a tu Dashboard de Render y haz clic en **"New"** > **"Web Service"**.
2.  Conecta tu repositorio de GitHub donde se encuentra este proyecto.
3.  Render detectará que es una aplicación de Python. Dale un nombre a tu servicio (ej. `royal-fernet-backend`).

## 2. Configuración de Comandos

En la configuración del servicio, asegúrate de establecer los siguientes comandos:

- **Build Command (Comando de Construcción)**:

  ```bash
  bash build.sh
  ```

  _Esto es crucial. Le dice a Render que ejecute nuestro script `build.sh`, el cual primero instala las dependencias (`pip install ...`) y luego inicializa la base de datos (`python init_db.py`) antes de intentar iniciar el servidor._

- **Start Command (Comando de Inicio)**:
  ```bash
  gunicorn --worker-tmp-dir /dev/shm app:app
  ```
  _Esto inicia tu aplicación usando Gunicorn, un servidor de producción robusto para aplicaciones Python, tal como Render lo recomienda._

## 3. Configuración de Variables de Entorno

Esta es la parte más importante. En la sección **"Environment"** de la configuración de tu servicio en Render, añade las siguientes variables:

- `DB_HOST`: La dirección (host) de tu servidor de base de datos.
- `DB_USER`: El nombre de usuario para tu base de datos.
- `DB_PASSWORD`: La contraseña para tu base de datos.
- `DB_NAME`: El nombre de la base de datos que quieres usar.
- `DB_PORT`: El puerto en el que tu base de datos está escuchando.
- `PYTHON_VERSION`: Asegúrate de que coincida con la versión que estás usando (ej. `3.9.9`).

- `FRONTEND_URL`: La URL completa de tu frontend desplegado en Vercel.

  - _Ejemplo_: `https://tu-proyecto.vercel.app`

- `API_BASE_URL`: La URL completa de este backend en Render. Render te la proporciona.
  - _Ejemplo_: `https://royal-fernet-backend.onrender.com`

**Si usas una base de datos de Aiven o una externa que requiere SSL:**

Nuestro código ya está preparado para usar una conexión segura. El siguiente paso es decirle a Render cómo encontrar el archivo de certificado `ca.pem`.

## 4. Añadir el Certificado `ca.pem` como un "Secret File"

Como tu base de datos necesita un certificado SSL para la conexión, no puedes simplemente subir el archivo `ca.pem` al repositorio. La forma correcta de manejar esto en Render es usando **"Secret Files"**.

1.  En la configuración de tu servicio en Render, ve a la pestaña **"Environment"**.
2.  Desplázate hacia abajo hasta la sección **"Secret Files"**.
3.  Haz clic en **"Add Secret File"**.
4.  **Filename / Path**: Escribe `backend/ca.pem`.
    _Es muy importante que la ruta sea exactamente esa, para que la aplicación lo encuentre en `backend/ca.pem`._
5.  **Contents**: Abre tu archivo `ca.pem` local, copia todo su contenido (incluyendo `-----BEGIN CERTIFICATE-----` y `-----END CERTIFICATE-----`) y pégalo en este campo.
6.  Haz clic en **"Create Secret File"**.

## 5. Despliegue Final

Una vez que hayas configurado los comandos, las variables de entorno y el archivo secreto, haz clic en **"Create Web Service"** o **"Manual Deploy"** para iniciar el despliegue.

Render seguirá los pasos:

1.  Clonará tu repositorio.
2.  Creará el archivo `backend/ca.pem` con el contenido que pegaste.
3.  Ejecutará `bash build.sh`, que instalará las dependencias y preparará la base de datos.
4.  Ejecutará `gunicorn...` para iniciar tu aplicación.

¡Y listo! Tu backend estará en línea, seguro y conectado a tu base de datos.
