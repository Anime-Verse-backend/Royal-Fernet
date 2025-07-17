# Royal-Fernet Backend

This directory contains the Python Flask backend for the Royal-Fernet application. It provides the API that the Next.js frontend consumes.

## Local Setup Instructions

### Prerequisites

1.  **Python:** Make sure you have Python 3.8+ installed. You can check with `python --version`.
2.  **MySQL:** You need a running MySQL server.

### Installation

1.  **Navigate to this directory:**

    ```bash
    cd backend
    ```

2.  **Create a virtual environment (recommended):**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    Open the `.env` file in this directory. Set your MySQL credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).

5.  **Initialize the Database:**
    Run the following command **once** to create your database and all the necessary tables.
    ```bash
    python init_db.py
    ```
    This will print a success message if everything is set up correctly.

### Running the Server Locally

To start the Flask API server for development, run:

```bash
flask --app app run --port 5000
```

The server will now be running at `http://127.0.0.1:5000`. The Next.js frontend is already configured to proxy requests to this address for local development.

---

## Deployment to Render

### Configuration

When deploying this backend as a "Web Service" on Render, use the following settings:

1.  **Runtime**: `Python 3`
2.  **Build Command**: `bash build.sh`
    - This command executes the `build.sh` script, which installs dependencies and runs the `init_db.py` script to ensure the database is ready before starting.
3.  **Start Command**: `gunicorn --worker-tmp-dir /dev/shm app:app`
    - This uses the Gunicorn production server to run the Flask application.

### Environment Variables

You will need to set the same environment variables in the Render dashboard as you did in your local `.env` file:

- `DB_HOST`: The internal host for your Render PostgreSQL or MySQL database.
- `DB_USER`: The database user.
- `DB_PASSWORD`: The database password.
- `DB_NAME`: The database name.
- `DB_PORT`: The database port.
- `FRONTEND_URL`: The full URL of your deployed Vercel frontend (e.g., `https://your-app-name.vercel.app`).
- `API_BASE_URL`: The full URL of this Render backend service (e.g., `https://royal-fernet-backend.onrender.com`).
