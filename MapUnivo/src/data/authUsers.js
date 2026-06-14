export const AUTH_USERS = [
  {
    username: 'estudiante',
    password: '1234',
    name: 'Bremond Hernandez',
    role: 'Estudiante',
    access: 'normal',
    initials: 'BH',
    carnet: 'IS-2021-001',
  },
  {
    username: 'docente',
    password: 'pass',
    name: 'Kevin Guardado',
    role: 'Docente',
    access: 'normal',
    initials: 'KG',
    carnet: 'DOC-042',
  },
  {
    username: 'admin',
    password: 'admin',
    name: 'Lenin Hernandez',
    role: 'Administrador',
    access: 'admin',
    initials: 'LH',
    carnet: 'ADM-001',
  },
]

export const AUTH_ROLE_LABELS = {
  normal: 'Usuario normal',
  admin: 'Administrador',
}
