import type { CrudConfig } from './CrudPage';

const questFields: CrudConfig['fields'] = [
  { key: 'title_ar', label: 'Title (AR)', type: 'text', required: true },
  { key: 'title_en', label: 'Title (EN)', type: 'text', required: true },
  { key: 'description_ar', label: 'Description (AR)', type: 'textarea' },
  { key: 'description_en', label: 'Description (EN)', type: 'textarea' },
  { key: 'category', label: 'Category', type: 'text', default: 'general' },
  { key: 'difficulty', label: 'Difficulty', type: 'text', default: 'easy', hint: 'easy | medium | hard | legendary' },
  { key: 'estimated_minutes', label: 'Estimated Minutes', type: 'number', default: 10 },
  { key: 'xp_reward', label: 'XP Reward', type: 'number', default: 0 },
  { key: 'gold_reward', label: 'Gold Reward', type: 'number', default: 0 },
  { key: 'warning_ar', label: 'Warning (AR)', type: 'text' },
  { key: 'warning_en', label: 'Warning (EN)', type: 'text' },
  { key: 'steps', label: 'Steps (JSON array)', type: 'json', default: '[]', hint: '[{"title":"","description":"","duration":0,"reps":0,"order":1,"optional":false}]' },
  { key: 'rewards', label: 'Rewards (JSON)', type: 'json', default: '{}', hint: '{"xp":0,"gold":0,"items":[],"custom":{}}' },
  { key: 'is_active', label: 'Active', type: 'boolean', default: true },
];

const questColumns: CrudConfig['listColumns'] = [
  { key: 'title_en', label: 'Title' },
  { key: 'category', label: 'Category' },
  { key: 'difficulty', label: 'Difficulty' },
  { key: 'xp_reward', label: 'XP' },
  { key: 'gold_reward', label: 'Gold' },
  { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'ON' : 'OFF') },
];

export const mainQuestsConfig: CrudConfig = {
  table: 'main_quests',
  title: 'Main Quests',
  fields: questFields,
  listColumns: questColumns,
  toggleField: 'is_active',
};

export const sideQuestsConfig: CrudConfig = {
  table: 'side_quests',
  title: 'Side Quests',
  fields: questFields,
  listColumns: questColumns,
  toggleField: 'is_active',
};

export const grandQuestsConfig: CrudConfig = {
  table: 'grand_quests',
  title: 'Grand Quests',
  toggleField: 'is_active',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'banner', label: 'Banner URL', type: 'text' },
    { key: 'image', label: 'Image URL', type: 'text' },
    { key: 'start_date', label: 'Start Date', type: 'date', required: true },
    { key: 'end_date', label: 'End Date', type: 'date', required: true },
    { key: 'rewards', label: 'Rewards (JSON)', type: 'json', default: '{}' },
    { key: 'priority', label: 'Priority', type: 'number', default: 0 },
    { key: 'visibility', label: 'Visibility', type: 'text', default: 'public' },
    { key: 'is_active', label: 'Active', type: 'boolean', default: true },
  ],
  listColumns: [
    { key: 'name', label: 'Name' },
    { key: 'start_date', label: 'Start' },
    { key: 'end_date', label: 'End' },
    { key: 'priority', label: 'Priority' },
    { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'ON' : 'OFF') },
  ],
};

export const adminGatesConfig: CrudConfig = {
  table: 'admin_gates',
  title: 'Gates',
  toggleField: 'enabled',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'rank', label: 'Rank', type: 'text', default: 'E' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'image', label: 'Image URL', type: 'text' },
    { key: 'background', label: 'Background URL', type: 'text' },
    { key: 'rewards', label: 'Rewards (JSON)', type: 'json', default: '{}' },
    { key: 'required_level', label: 'Required Level', type: 'number', default: 1 },
    { key: 'cooldown_minutes', label: 'Cooldown (minutes)', type: 'number', default: 0 },
    { key: 'drops', label: 'Drops (JSON array)', type: 'json', default: '[]' },
    { key: 'difficulty', label: 'Difficulty', type: 'text', default: 'normal' },
    { key: 'open_time', label: 'Open Time', type: 'date' },
    { key: 'close_time', label: 'Close Time', type: 'date' },
    { key: 'enabled', label: 'Enabled', type: 'boolean', default: true },
  ],
  listColumns: [
    { key: 'name', label: 'Name' },
    { key: 'rank', label: 'Rank' },
    { key: 'difficulty', label: 'Difficulty' },
    { key: 'required_level', label: 'Req Lv' },
    { key: 'enabled', label: 'Enabled', render: (r) => (r.enabled ? 'ON' : 'OFF') },
  ],
};

const itemFields: CrudConfig['fields'] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'rarity', label: 'Rarity', type: 'text', default: 'common' },
  { key: 'category', label: 'Category', type: 'text', default: 'misc' },
  { key: 'image', label: 'Image URL', type: 'text' },
  { key: 'effect', label: 'Effect (JSON)', type: 'json', default: '{}' },
  { key: 'duration', label: 'Duration (sec)', type: 'number' },
  { key: 'stackable', label: 'Stackable', type: 'boolean', default: true },
  { key: 'sell_price', label: 'Sell Price', type: 'number', default: 0 },
  { key: 'buy_price', label: 'Buy Price', type: 'number', default: 0 },
  { key: 'tradable', label: 'Tradable', type: 'boolean', default: true },
  { key: 'drop_rate', label: 'Drop Rate', type: 'number', default: 0 },
  { key: 'is_active', label: 'Active', type: 'boolean', default: true },
];

const itemColumns: CrudConfig['listColumns'] = [
  { key: 'name', label: 'Name' },
  { key: 'rarity', label: 'Rarity' },
  { key: 'category', label: 'Category' },
  { key: 'buy_price', label: 'Buy' },
  { key: 'sell_price', label: 'Sell' },
  { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'ON' : 'OFF') },
];

export const mainItemsConfig: CrudConfig = {
  table: 'main_items',
  title: 'Main Items',
  fields: itemFields,
  listColumns: itemColumns,
  toggleField: 'is_active',
};

export const sideItemsConfig: CrudConfig = {
  table: 'side_items',
  title: 'Side Items',
  fields: itemFields,
  listColumns: itemColumns,
  toggleField: 'is_active',
};

export const eventsConfig: CrudConfig = {
  table: 'events',
  title: 'Events',
  toggleField: 'enabled',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'banner', label: 'Banner URL', type: 'text' },
    { key: 'image', label: 'Image URL', type: 'text' },
    { key: 'start_date', label: 'Start Date', type: 'date', required: true },
    { key: 'end_date', label: 'End Date', type: 'date', required: true },
    { key: 'rules', label: 'Rules (JSON)', type: 'json', default: '{}' },
    { key: 'rewards', label: 'Rewards (JSON)', type: 'json', default: '{}' },
    { key: 'visibility', label: 'Visibility', type: 'text', default: 'public' },
    { key: 'enabled', label: 'Enabled', type: 'boolean', default: true },
  ],
  listColumns: [
    { key: 'name', label: 'Name' },
    { key: 'start_date', label: 'Start' },
    { key: 'end_date', label: 'End' },
    { key: 'visibility', label: 'Visibility' },
    { key: 'enabled', label: 'Enabled', render: (r) => (r.enabled ? 'ON' : 'OFF') },
  ],
};
