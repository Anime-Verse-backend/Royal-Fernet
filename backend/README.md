# Royal-Fernet Backend

This directory contains the Python Flask backend for the Royal-Fernet application. It provides the API that the Next.js frontend consumes.

## Setup Instructions

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
    Open the `.env` file in this directory. Set your MySQL `DB_USER` (usually `root`) and `DB_PASSWORD`.

5.  **Initialize the Database:**
    Run the following command **once** to create the `royal` database and all the necessary tables.
    ```bash
    python init_db.py
    ```
    This will print a success message if everything is set up correctly.

### Running the Server

To start the Flask API server, run:

```bash
flask --app app run --port 5000
```

The server will now be running at `http://127.0.0.1:5000`. The Next.js frontend is already configured to proxy requests to this address.
