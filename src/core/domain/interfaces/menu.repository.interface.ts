import { Menu } from '../entities/menu.entity';

export const MENU_REPOSITORY = 'MENU_REPOSITORY';

export interface IMenuRepository {
  findAll(): Promise<Menu[]>;
  findAllParent(): Promise<Menu[]>;
  findById(id: number): Promise<Menu>;
  findByPath(path: string): Promise<Menu>;
  create(menu: Partial<Menu>): Promise<Menu>;
  update(id: number, menu: Partial<Menu>): Promise<Menu>;
  delete(id: number): Promise<void>;
  findChildren(parentId: number): Promise<Menu[]>;
}
