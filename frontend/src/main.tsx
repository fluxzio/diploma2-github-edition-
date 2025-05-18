// main.tsx или index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SessionProvider } from "./providers/useSession";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
	<BrowserRouter>
		<SessionProvider>
			<App />
		</SessionProvider>
	</BrowserRouter>
);
