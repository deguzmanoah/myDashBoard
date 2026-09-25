'use server';

import { redirect } from 'next/navigation';
import { authenticatedRequest } from '@/lib/api';

export interface ApiCustomerRanking {
  customer_name: string;
  last_branch_charged: string;
  last_date_charged: string;
  total_spent: number;
  total_sessions: number;
}

export interface ApiCustomerOverview {
  limit: number;
  branch_id: number | null;
  start_date: string | null;
  end_date: string | null;
  customer_summary: {
    total_customers: number;
    new_customers: number;
    active_charging: number;
  };
  customer_ranking_list: ApiCustomerRanking[];
}

export async function getCustomerOverview(
  startDate?: string,
  endDate?: string,
  branchId?: string,
  sortBy?: 'total_spent' | 'total_sessions',
) {
  try {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.set('start_date', startDate);
    if (endDate) searchParams.set('end_date', endDate);
    if (branchId) searchParams.set('branch_id', branchId);
    if (sortBy) searchParams.set('sort_by', sortBy);

    const response = await authenticatedRequest<ApiCustomerOverview>(
      `/dashboard/customers?${searchParams}`,
      { method: 'GET' },
    );

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data ?? null;
  } catch (error) {
    console.error('Fetch customer overview error:', error);
    throw error;
  }
}

export interface ApiKwhSlot {
  period_start: string;
  kwh: number;
}

export interface ApiChargerPerformance {
  branch_id: number[] | null;
  start_date: string | null;
  end_date: string | null;
  charger_summary: {
    total_chargers: number;
    total_guns: number;
    in_use_chargers: number;
    in_use_percent: number;
    in_use_guns: number;
    in_use_guns_percent: number;
    available_chargers: number;
    available_percent: number;
    available_guns: number;
    available_guns_percent: number;
    offline_chargers: number;
    offline_percent: number;
  };
  kwh_consumption_graph: ApiKwhSlot[];
}

export async function getChargerPerformance(
  startDate?: string,
  endDate?: string,
  branchId?: string,
) {
  try {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.set('start_date', startDate);
    if (endDate) searchParams.set('end_date', endDate);
    if (branchId) searchParams.set('branch_id', branchId);

    const response = await authenticatedRequest<ApiChargerPerformance>(
      `/dashboard/chargers?${searchParams}`,
      { method: 'GET' },
    );

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data ?? null;
  } catch (error) {
    console.error('Fetch charger performance error:', error);
    throw error;
  }
}

export interface ApiBranchStat {
  branch_id: number;
  station_name: string;
  kwh: number;
  revenue: number;
  sessions: number;
}

export interface ApiBranchPerformance {
  limit: number;
  start_date: string | null;
  end_date: string | null;
  branch_summary: {
    total_energy_kwh: number;
    total_branches: number;
    total_sessions: number;
    total_revenue: number;
    total_customers?: number;
  };
  branch_revenue_graph: ApiBranchStat[];
}

export async function getBranchPerformance(
  startDate?: string,
  endDate?: string,
  branchIds?: string[],
) {
  try {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.set('start_date', startDate);
    if (endDate) searchParams.set('end_date', endDate);
    if (branchIds?.length) branchIds.forEach((id) => searchParams.append('branch_id', id));

    const response = await authenticatedRequest<ApiBranchPerformance>(
      `/dashboard/branches?${searchParams}`,
      { method: 'GET' },
    );

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data ?? null;
  } catch (error) {
    console.error('Fetch branch performance error:', error);
    throw error;
  }
}
