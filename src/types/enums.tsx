export enum AuthStatusEnum {
  loading = 'loading',
  authenticated = 'authenticated',
  unauthenticated = 'unauthenticated',
}

export enum PagesEnum {
  home = '/',
  login = '/login',
  verifyRequest = 'verify-request'
}

export enum UnitEnum {
  kg = 'kg',
  unit = 'uni.',
  grams = 'g.',
}

export enum StatusEnum {
  all = 'all',
  inCart = 'inCart',
  outOfCart = 'outOfCart',
}

export enum PrettyStatusEnum {
  all = 'Todos(as)',
  inCart = 'No carrinho',
  outOfCart = 'Fora do carrinho',
}

export enum LocalStorageEnum {
  products = 'products',
}

export enum AddOrEditProductTypeEnum {
  add = 'add',
  edit = 'edit',
}
