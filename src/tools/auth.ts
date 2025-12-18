import { server } from "../server.js";
import {
  openLoginPage,
  saveLoginState,
  clearLoginState,
  isLoggedIn,
  getStorageStatePath,
} from "../services/article-extractor.js";

// Login tool - opens browser for manual login
server.registerTool(
  "login",
  {
    title: "Login to Medium",
    description:
      "Open a browser window to log in to Medium. After logging in, use 'save_login' to save your session for accessing member-only content.",
    inputSchema: {},
  },
  async () => {
    try {
      const message = await openLoginPage();
      return {
        content: [{ type: "text" as const, text: message }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text" as const, text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// Save login state tool
server.registerTool(
  "save_login",
  {
    title: "Save Login Session",
    description:
      "Save the current login session after completing login in the browser. Must be called after 'login' tool.",
    inputSchema: {},
  },
  async () => {
    try {
      const message = await saveLoginState();
      return {
        content: [{ type: "text" as const, text: message }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text" as const, text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// Logout tool - clears saved login state
server.registerTool(
  "logout",
  {
    title: "Logout from Medium",
    description: "Clear the saved Medium login session.",
    inputSchema: {},
  },
  async () => {
    try {
      const message = await clearLoginState();
      return {
        content: [{ type: "text" as const, text: message }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text" as const, text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// Check login status tool
server.registerTool(
  "login_status",
  {
    title: "Check Login Status",
    description: "Check if you are currently logged in to Medium.",
    inputSchema: {},
  },
  async () => {
    const loggedIn = isLoggedIn();
    const path = getStorageStatePath();

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              loggedIn,
              storagePath: path,
              message: loggedIn
                ? "You are logged in. Member-only content should be accessible."
                : "You are not logged in. Use 'login' to access member-only content.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
