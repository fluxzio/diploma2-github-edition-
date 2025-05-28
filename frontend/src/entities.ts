export interface UserI {
	id: number;
	username: string;
	email: string;
	first_name: string;
	last_name: string;
	is_staff: boolean;
	is_superuser: boolean;
	date_joined: string;
}