
export interface ConsumptionItem {
  id: string;
  name: string;
  price: number;
  count: number;
  icon: string;
  color: string;
  category: 'drink' | 'food' | 'other';
}

export type ViewState = 'dashboard' | 'counter' | 'recap' | 'add-item';

export interface AppState {
  items: ConsumptionItem[];
  currentSessionId: string;
}
