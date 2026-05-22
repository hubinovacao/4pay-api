export type UserRole = 'super' | 'comerciante';

export interface JwtUser {
  sub: string;
  email: string;
  role: UserRole;
  comercianteId: string | null;
}

export interface MaquininhaPrincipal {
  type: 'maquininha';
  maquininhaId: string;
  comercianteId: string;
}
