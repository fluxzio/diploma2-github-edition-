import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import FileManager from "./components/FileManager";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import { useSession } from "./providers/useSession";
import ResetPassword from "./components/ResetPassword";
import VerifyToken from "./components/VerifyToken";
import SetNewPassword from "./components/SetNewPassword";

const drawerWidth = 240;

const theme = createTheme({
	palette: {
		mode: "light",
		primary: { main: "#4f46e5" },
		secondary: { main: "#ec4899" },
		background: { default: "#f9fafb" },
	},
	typography: {
		fontFamily: "Inter, Roboto, sans-serif",
	},
	shape: { borderRadius: 12 },
	components: {
		MuiButton: {
			styleOverrides: {
				root: { textTransform: "none", fontWeight: 500 },
			},
		},
		MuiPaper: {
			styleOverrides: { root: { padding: "1rem" } },
		},
	},
});

const App = () => {
	const { isAuthenticated } = useSession();
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Box sx={{ display: "flex" }}>
				{isAuthenticated && <Navbar />}
				<Box
					component="main"
					sx={{
						flexGrow: 1,
						pl: isAuthenticated
							? { xs: 0, sm: `${drawerWidth}px` }
							: 0,
						p: 3,
					}}
				>
					<Routes>
						<Route
							path="/"
							element={<Navigate to="/dashboard" replace />}
						/>
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute>
									<Dashboard />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/profile"
							element={
								<ProtectedRoute>
									<Profile />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/files"
							element={
								<ProtectedRoute>
									<FileManager />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/admin"
							element={
								<ProtectedRoute adminOnly>
									<AdminPanel />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/reset-password"
							element={<ResetPassword />}
						/>
						<Route
							path="/verify-reset-token"
							element={<VerifyToken />}
						/>
						<Route
							path="/set-new-password"
							element={<SetNewPassword />}
						/>
					</Routes>
				</Box>
			</Box>
		</ThemeProvider>
	);
};

export default App;
