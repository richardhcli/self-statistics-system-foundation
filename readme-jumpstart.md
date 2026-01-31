# Jumpstart Guide: Running the Application

Follow these steps to get the application running locally for development and testing.

## 1. Install Dependencies

First, you need to install the necessary Node.js packages defined in `package.json`. Open your terminal in the project's root directory and run:

```bash
npm install
```

This command will download and install all the required libraries, including Vite, which is used to build and serve the application.

## 2. Start the Development Server

Once the dependencies are installed, you can start the local development server. Run the following command:

```bash
npm run dev
```

This will start the Vite development server. You will see output in your terminal indicating that the server is running, along with the local URL where you can access the application.

## 3. View the Application

Open your web browser and navigate to the address shown in your terminal. It will typically be:

[http://localhost:3000](http://localhost:3000)

You should now see the Journal & Graph AI application running in your browser.

# Edge cases: 
The issue was the ampersand in the folder name, which breaks npm’s default Windows cmd script runner. I added a project-level npm setting to run scripts with PowerShell instead.

Added /.npmrc to set script-shell to Windows PowerShell.
You can run npm run dev again and it should start normally. If you want a permanent OS‑level fix without this setting, rename the project folder to remove &.

