import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CircularProgress, Alert } from "@mui/material";
import { api } from "../api";

const VerifyToken: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [status, setStatus] = useState<"loading" | "valid" | "invalid">(
		"loading"
	);

	useEffect(() => {
		const token = searchParams.get("token");

		if (token) {
			api.post("/api/auth/verify-reset-token/", { token })
				.then(() => {
					setStatus("valid");
					navigate(`/set-new-password?token=${token}`);
				})
				.catch(() => setStatus("invalid"));
		}
	}, [searchParams, navigate]);

	if (status === "loading") return <CircularProgress />;
	if (status === "invalid")
		return (
			<Alert severity="error">
				Недействительный или устаревший токен
			</Alert>
		);

	return null;
};

export default VerifyToken;
