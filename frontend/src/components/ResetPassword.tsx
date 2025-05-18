import React, { useState } from "react";
import {
	Box,
	Button,
	TextField,
	Typography,
	CircularProgress,
	Alert,
} from "@mui/material";
import { api } from "../api";

const ResetPassword: React.FC = () => {
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			await api.post("/api/auth/reset-password/", { email });
			setSubmitted(true);
		} catch (err: any) {
			setError(
				err.response?.data?.error ||
					"Произошла ошибка. Попробуйте позже."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box
			maxWidth={400}
			mx="auto"
			mt={10}
			p={4}
			borderRadius={2}
			boxShadow={3}
			bgcolor="background.paper"
		>
			<Typography variant="h5" fontWeight={600} mb={2}>
				Восстановление пароля
			</Typography>

			{submitted ? (
				<Alert severity="success">
					Инструкция по восстановлению отправлена на ваш email.
				</Alert>
			) : (
				<form onSubmit={handleSubmit}>
					<TextField
						fullWidth
						label="Электронная почта"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
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
						type="submit"
						variant="contained"
						color="primary"
						sx={{ mt: 2 }}
						disabled={loading}
					>
						{loading ? (
							<CircularProgress size={24} />
						) : (
							"Отправить ссылку для сброса"
						)}
					</Button>
				</form>
			)}
		</Box>
	);
};

export default ResetPassword;
