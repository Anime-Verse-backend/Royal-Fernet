# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## How to Reconstruct this Project Locally

This project includes a bundling system to help you download the code.

1.  Create an empty folder on your local machine.
2.  Copy the entire content of the `project_bundle.json` file from this project and save it as `project_bundle.json` inside your new folder.
3.  Copy the entire content of the `reconstruct.js` file from this project and save it as `reconstruct.js` inside the same folder.
4.  Open your terminal, navigate into your new folder, and run the following command:
    ```bash
    node reconstruct.js
    ```
5.  This script will recreate all the project files and folders. Once it's done, you can follow the normal setup instructions (run `npm install`, configure the backend, etc.).
