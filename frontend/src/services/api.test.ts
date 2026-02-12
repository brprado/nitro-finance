import { describe, it, expect } from 'vitest';
import {
  authApi,
  usersApi,
  companiesApi,
  departmentsApi,
  categoriesApi,
  expensesApi,
  validationsApi,
  alertsApi,
  dashboardApi,
} from './api';

describe('API services', () => {
  it('authApi expõe login e getCurrentUser', () => {
    expect(typeof authApi.login).toBe('function');
    expect(typeof authApi.getCurrentUser).toBe('function');
  });

  it('usersApi expõe CRUD', () => {
    expect(typeof usersApi.getAll).toBe('function');
    expect(typeof usersApi.getById).toBe('function');
    expect(typeof usersApi.create).toBe('function');
    expect(typeof usersApi.update).toBe('function');
    expect(typeof usersApi.delete).toBe('function');
  });

  it('companiesApi expõe CRUD', () => {
    expect(typeof companiesApi.getAll).toBe('function');
    expect(typeof companiesApi.getById).toBe('function');
    expect(typeof companiesApi.create).toBe('function');
    expect(typeof companiesApi.update).toBe('function');
    expect(typeof companiesApi.delete).toBe('function');
  });

  it('departmentsApi expõe CRUD e getAll com filtro opcional', () => {
    expect(typeof departmentsApi.getAll).toBe('function');
    expect(typeof departmentsApi.getById).toBe('function');
    expect(typeof departmentsApi.create).toBe('function');
    expect(typeof departmentsApi.update).toBe('function');
    expect(typeof departmentsApi.delete).toBe('function');
  });

  it('categoriesApi expõe CRUD', () => {
    expect(typeof categoriesApi.getAll).toBe('function');
    expect(typeof categoriesApi.getById).toBe('function');
    expect(typeof categoriesApi.create).toBe('function');
    expect(typeof categoriesApi.update).toBe('function');
    expect(typeof categoriesApi.delete).toBe('function');
  });

  it('expensesApi expõe CRUD e getAll com filtros', () => {
    expect(typeof expensesApi.getAll).toBe('function');
    expect(typeof expensesApi.getById).toBe('function');
    expect(typeof expensesApi.create).toBe('function');
    expect(typeof expensesApi.update).toBe('function');
    expect(typeof expensesApi.delete).toBe('function');
  });

  it('validationsApi expõe getPending, approve, reject', () => {
    expect(typeof validationsApi.getPending).toBe('function');
    expect(typeof validationsApi.approve).toBe('function');
    expect(typeof validationsApi.reject).toBe('function');
  });

  it('alertsApi expõe getMyAlerts e markAsRead', () => {
    expect(typeof alertsApi.getMyAlerts).toBe('function');
    expect(typeof alertsApi.markAsRead).toBe('function');
  });

  it('dashboardApi expõe getStats, getRecentExpenses, getRecentAlerts', () => {
    expect(typeof dashboardApi.getStats).toBe('function');
    expect(typeof dashboardApi.getRecentExpenses).toBe('function');
    expect(typeof dashboardApi.getRecentAlerts).toBe('function');
  });
});
