import { useState, useEffect } from "react";
import {
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
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface User {
	id: number;
	username: string;
	email: string;
	is_staff: boolean;
	is_superuser: boolean;
	role?: string;
	date_joined: string;
}

interface FileOwner {
	id: number;
	username: string;
	email: string;
	is_staff: boolean;
	is_superuser: boolean;
	role?: string;
}

interface File {
	id: number;
	name: string;
	owner: FileOwner;
	size: number;
	upload_date: string;
	is_public: boolean;
}

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

const renderOwner = (owner: FileOwner) => {
	if (owner) {
		return owner.username;
	}
	return "-";
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

	// Правила удаления файла
	const canDeleteFile = (file: File, currentUser: User): boolean => {
		if (!currentUser || !file.owner) return false;

		// Всегда можно удалить свой файл
		if (file.owner.id === currentUser.id) return true;

		// Суперюзер может всё
		if (currentUser.is_superuser) return true;

		// Админ
		if (currentUser.is_staff) {
			// нельзя удалять файлы других админов
			if (file.owner.is_staff && file.owner.id !== currentUser.id)
				return false;
			return true;
		}

		// Персонал (менеджер)
		if (currentUser.role === "manager") {
			// нельзя удалять файлы админов и других сотрудников
			if (file.owner.is_staff) return false;
			if (
				file.owner.role === "manager" &&
				file.owner.id !== currentUser.id
			)
				return false;
			return true;
		}

		// Обычный пользователь — только свои файлы
		return false;
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
											: user.role === "manager"
											? "Персонал"
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
											}
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
														user.id ===
															currentUser?.id ||
														(user.is_staff &&
															!currentUser?.is_superuser)
													}
													onClick={() =>
														user.id !==
															currentUser?.id &&
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
										{formatDate(file.upload_date)}
									</TableCell>
									<TableCell>
										{file.is_public
											? "Публичный"
											: "Приватный"}
									</TableCell>
									<TableCell align="right">
										<Tooltip
											title={
												file.owner.id ===
												currentUser?.id
													? "Вы можете удалить свой файл"
													: file.owner.is_staff
													? "Нельзя удалить файл администратора"
													: file.owner.role ===
													  "manager"
													? "Нельзя удалить файл персонала"
													: ""
											}
										>
											<span>
												<Button
													variant="outlined"
													size="small"
													color="error"
													disabled={
														!canDeleteFile(
															file,
															currentUser!
														)
													}
													onClick={() =>
														canDeleteFile(
															file,
															currentUser!
														) &&
														handleDeleteFile(
															file.id
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
