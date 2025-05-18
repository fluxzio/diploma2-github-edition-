import React, { useState } from "react";
import {
	Box,
	Button,
	TextField,
	Typography,
	Alert,
	CircularProgress,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";

const SetNewPassword: React.FC = () => {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");

	const [newPassword, setNewPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			await api.post("/api/auth/set-new-password/", {
				token,
				new_password: newPassword,
			});
			setSuccess(true);
		} catch (err: any) {
			setError("Ошибка при обновлении пароля. Попробуйте позже.");
		} finally {
			setLoading(false);
		}
	};

	if (!token) return <Alert severity="error">Токен не найден в URL</Alert>;

	return (
		<Box
			maxWidth={400}
			mx="auto"
			mt={10}
			p={4}
			boxShadow={3}
			borderRadius={2}
		>
			<Typography variant="h5" fontWeight={600} mb={2}>
				Установка нового пароля
			</Typography>

			{success ? (
				<Alert severity="success">Пароль успешно обновлён</Alert>
			) : (
				<form onSubmit={handleSubmit}>
					<TextField
						fullWidth
						label="Новый пароль"
						type="password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						required
						margin="normal"
					/>

					{error && (
						<Alert severity="error" sx={{ mt: 2 }}>
							{error}
						</Alert>
					)}

					<Button
						fullWidth
						variant="contained"
						type="submit"
						color="primary"
						sx={{ mt: 2 }}
						disabled={loading}
					>
						{loading ? (
							<CircularProgress size={24} />
						) : (
							"Сбросить пароль"
						)}
					</Button>
				</form>
			)}
		</Box>
	);
};

export default SetNewPassword;
