import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Alert,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  TableContainer,
} from "@mui/material";
import {
  CloudUpload,
  CloudDownload,
  Delete,
  Lock,
  Public,
} from "@mui/icons-material";
import { api } from "../api";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { UserI } from "../entities";

interface FileData {
  id: number;
  name: string;
  created_at: string;
  owner: UserI;
  file: File;
  is_encrypted: boolean;
  size?: number;
}

const FileManager = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await api.get("/api/files/");
      setFiles(response.data);
    } catch {
      setError("Не удалось загрузить файлы.");
    }
  };

  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes || bytes <= 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd.MM.yyyy HH:mm:ss", { locale: ru });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Выберите файл для загрузки.");
      return;
    }

    setError("");
    setSuccess("");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("is_public", String(isPublic));

    try {
      await api.post("/api/files/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Файл успешно загружен.");
      setSelectedFile(null);
      setIsPublic(false);
      fetchFiles();
    } catch {
      setError("Ошибка при загрузке файла.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const response = await api.get(`/api/files/${id}/download/`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        files.find((f) => f.id === id)?.name || "file"
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError("Ошибка при скачивании.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Удалить файл?")) return;

    try {
      await api.delete(`/api/files/${id}/`);
      setSuccess("Файл удалён.");
      fetchFiles();
    } catch {
      setError("Ошибка при удалении.");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Менеджер файлов
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Upload form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Загрузить файл
        </Typography>
        <form onSubmit={handleUpload}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant="contained"
                component="label"
                fullWidth
                startIcon={<CloudUpload />}
              >
                Выбрать файл
                <input
                  type="file"
                  hidden
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </Button>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Файл: {selectedFile.name}
                </Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? <CircularProgress size={20} /> : "Загрузить"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* File list */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ваши файлы
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Размер</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>
                    {file.size ? formatFileSize(file.size) : "—"}
                  </TableCell>
                  <TableCell>{formatDate(file.created_at)}</TableCell>
                  <TableCell align="right">
                    <Button
                      onClick={() => handleDownload(file.id)}
                      size="small"
                      color="primary"
                      startIcon={<CloudDownload />}
                    >
                      Скачать
                    </Button>
                    <Button
                      onClick={() => handleDelete(file.id)}
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                    >
                      Удалить
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {files.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Файлы не найдены
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default FileManager;
