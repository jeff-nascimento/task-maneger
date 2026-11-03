//esse arquivo apenas tipa os dados do usuário, os dados do login do usuário e os dados de register
//register recebe um extends de loginInput porque register vai ter todos os dados de login e adicionar o tipo
//name a mais, então tem name, email e password

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}
