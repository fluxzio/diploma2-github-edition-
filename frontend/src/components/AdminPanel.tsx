import { useState, useEffect } from "react";
import {
	Box,
	Container,
	Typography,
	Tabs,
	Tab,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	Paper,
	Button,
	Alert,
	Tooltip,
} from "@mui/material";
import { api } from "../api";
import { useSession } from "../providers/useSession";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface User {
	id: number;
	username: string;
	email: string;
	is_staff: boolean;
	is_superuser: boolean;
	date_joined: string;
}

interface FileOwner {
	id: number;
	username: string;
	email: string;
}

interface File {
	id: number;
	name: string;
	owner: string | FileOwner;
	size: number;
	created_at: string;
  updated_at: string;
	is_public: boolean;
}

const renderOwner = (owner: string | FileOwner) => {
	if (typeof owner === "object" && owner !== null) {
		return owner.username;
	}
	return owner || "-";
};

const AdminPanel = () => {
	const [users, setUsers] = useState<User[]>([]);
	const [files, setFiles] = useState<File[]>([]);
	const [error, setError] = useState("");
	const [tab, setTab] = useState(0);
	const { user: currentUser } = useSession();

	useEffect(() => {
		fetchUsers();
		fetchFiles();
	}, []);

	const fetchUsers = async () => {
		try {
			const res = await api.get("/api/users/");
			setUsers(res.data);
		} catch {
			setError("Ошибка при загрузке пользователей.");
		}
	};

	const fetchFiles = async () => {
		try {
			const res = await api.get("/api/files/");
			setFiles(res.data);
		} catch {
			setError("Ошибка при загрузке файлов.");
		}
	};

	const handleToggleStaff = async (userId: number, isStaff: boolean) => {
		try {
			await api.patch(`/api/users/${userId}/`, { is_staff: !isStaff });
			fetchUsers();
		} catch {
			setError("Не удалось изменить роль пользователя.");
		}
	};

	const handleDeleteUser = async (userId: number) => {
		if (!window.confirm("Удалить пользователя?")) return;
		try {
			await api.delete(`/api/users/${userId}/`);
			fetchUsers();
		} catch {
			setError("Не удалось удалить пользователя.");
		}
	};

	const handleDeleteFile = async (fileId: number) => {
		if (!window.confirm("Удалить файл?")) return;
		try {
			await api.delete(`/api/files/${fileId}/`);
			fetchFiles();
		} catch {
			setError("Не удалось удалить файл.");
		}
	};

	const formatDate = (date: string) => {
		try {
			return format(new Date(date), "dd.MM.yyyy HH:mm", { locale: ru });
		} catch {
			return date || "-";
		}
	};
  
	const formatSize = (bytes: number) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		const sizes = ["B", "KB", "MB", "GB"];
		return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
	};

	// Правила удаления (строго по бизнес-логике)
	const canDeleteUser = (target: User): boolean => {
		if (!currentUser) return false;
		if (target.id === currentUser.id) return false; // нельзя удалить себя
		if (target.is_staff) {
			// никто, кроме суперюзера, не может удалить админа
			if (currentUser.is_superuser) return true;
			return false;
		}
		return true;
	};

	return (
		<Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
			<Typography variant="h4" fontWeight={600} gutterBottom>
				Панель администратора
			</Typography>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			<Tabs
				value={tab}
				onChange={(_, newValue) => setTab(newValue)}
				sx={{ mb: 3 }}
			>
				<Tab label="Пользователи" />
				<Tab label="Файлы" />
			</Tabs>

			{tab === 0 && (
				<Paper>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Имя</TableCell>
								<TableCell>Email</TableCell>
								<TableCell>Роль</TableCell>
								<TableCell>Дата регистрации</TableCell>
								<TableCell align="right">Действия</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user.id}>
									<TableCell>{user.username}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										{user.is_superuser
											? "Superuser"
											: user.is_staff
											? "Admin"
											: "User"}
									</TableCell>
									<TableCell>
										{formatDate(user.date_joined)}
									</TableCell>
									<TableCell align="right">
										<Button
											variant="outlined"
											size="small"
											color={
												user.is_staff
													? "secondary"
													: "primary"
											}
											onClick={() =>
												handleToggleStaff(
													user.id,
													user.is_staff
												)
											}
											sx={{ mr: 1 }}
											disabled={
												user.id === currentUser?.id
											} // нельзя менять себе роль
										>
											{user.is_staff
												? "Сделать User"
												: "Сделать Admin"}
										</Button>
										<Tooltip
											title={
												user.id === currentUser?.id
													? "Вы не можете удалить самого себя"
													: user.is_staff
													? "Нельзя удалить пользователя с правами администратора"
													: ""
											}
										>
											<span>
												<Button
													variant="outlined"
													size="small"
													color="error"
													disabled={
														!canDeleteUser(user)
													}
													onClick={() =>
														canDeleteUser(user) &&
														handleDeleteUser(
															user.id
														)
													}
												>
													Удалить
												</Button>
											</span>
										</Tooltip>
									</TableCell>
								</TableRow>
							))}
							{users.length === 0 && (
								<TableRow>
									<TableCell colSpan={5} align="center">
										Нет пользователей
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</Paper>
			)}

			{tab === 1 && (
				<Paper>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Название</TableCell>
								<TableCell>Владелец</TableCell>
								<TableCell>Размер</TableCell>
								<TableCell>Дата загрузки</TableCell>
								<TableCell>Статус</TableCell>
								<TableCell align="right">Действия</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{files.map((file) => (
								<TableRow key={file.id}>
									<TableCell>{file.name}</TableCell>
									<TableCell>
										{renderOwner(file.owner)}
									</TableCell>
									<TableCell>
										{formatSize(file.size)}
									</TableCell>
									<TableCell>
										{formatDate(file.created_at)}
									</TableCell>
									<TableCell>
										{file.is_public
											? "Публичный"
											: "Приватный"}
									</TableCell>
									<TableCell align="right">
										<Button
											variant="outlined"
											size="small"
											color="error"
											onClick={() =>
												handleDeleteFile(file.id)
											}
										>
											Удалить
										</Button>
									</TableCell>
								</TableRow>
							))}
							{files.length === 0 && (
								<TableRow>
									<TableCell colSpan={6} align="center">
										Нет файлов
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</Paper>
			)}
		</Container>
	);
};

export default AdminPanel;
