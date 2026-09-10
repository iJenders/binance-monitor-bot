<template>
  <div class="settings-overlay" @click.self="$emit('close')">
    <section class="settings-panel" role="dialog" aria-labelledby="settings-title">
      <header class="settings-header">
        <div>
          <h2 id="settings-title" class="card-title">Configuración del monitor</h2>
          <p class="settings-subtitle">Filtros de banco, recolección y persistencia. Los cambios aplican de inmediato.</p>
        </div>
        <button class="btn-tab" type="button" @click="$emit('close')">Cerrar</button>
      </header>

      <div v-if="loading" class="loading-box">
        <div class="spinner"></div>
        <span>Cargando configuración...</span>
      </div>

      <form v-else class="settings-form" @submit.prevent="save">
        <div class="settings-grid">
          <label class="form-field">
            <span>Intervalo del cron (segundos)</span>
            <input v-model.number="form.cronIntervalSec" class="search-input form-input" type="number" min="5" max="3600" />
          </label>
          <label class="form-field">
            <span>Cantidad de ofertas</span>
            <input v-model.number="form.offersRows" class="search-input form-input" type="number" min="1" max="100" />
          </label>
          <label class="form-field">
            <span>Retención del historial (horas)</span>
            <input v-model.number="form.retentionHours" class="search-input form-input" type="number" min="0" max="8760" />
            <small>0 desactiva la depuración de snapshots antiguos.</small>
          </label>
          <label class="form-field">
            <span>Archivo de persistencia</span>
            <input v-model="form.dataFilePath" class="search-input form-input" type="text" />
          </label>
        </div>

        <div class="form-field">
          <span>Bancos / métodos de pago</span>
          <p class="settings-hint">Si no eliges ninguno, se recolectan todos. El filtro se envía a Binance como <code>payTypes</code>.</p>
          <div class="paytype-grid">
            <button
              v-for="item in catalog"
              :key="item.id"
              type="button"
              class="paytype-chip"
              :class="{ active: form.payTypes.includes(item.id) }"
              @click="togglePayType(item.id)"
            >
              {{ item.label }}
            </button>
          </div>
          <div class="custom-paytype">
            <input v-model="customPayType" class="search-input form-input" type="text" placeholder="Identificador extra (ej. PagoMovil)" />
            <button class="btn-tab" type="button" @click="addCustomPayType">Añadir</button>
          </div>
          <div v-if="unknownPayTypes.length" class="selected-extra">
            <span v-for="id in unknownPayTypes" :key="id" class="badge-tag">
              {{ id }}
              <button type="button" class="chip-remove" @click="togglePayType(id)">×</button>
            </span>
          </div>
        </div>

        <p v-if="error" class="settings-error">{{ error }}</p>
        <p v-if="success" class="settings-success">{{ success }}</p>

        <div class="settings-actions">
          <button class="btn-action" type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar y recolectar' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

interface PayTypeCatalogItem {
  id: string;
  label: string;
}

interface AppSettings {
  cronIntervalMs: number;
  offersRows: number;
  payTypes: string[];
  retentionHours: number;
  dataFilePath: string;
}

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const catalog = ref<PayTypeCatalogItem[]>([]);
const customPayType = ref('');

const form = reactive({
  cronIntervalSec: 60,
  offersRows: 20,
  payTypes: [] as string[],
  retentionHours: 48,
  dataFilePath: 'data/advertising_history.jsonl',
});

const catalogIds = computed(() => new Set(catalog.value.map((item) => item.id)));
const unknownPayTypes = computed(() => form.payTypes.filter((id) => !catalogIds.value.has(id)));

const togglePayType = (id: string) => {
  const index = form.payTypes.indexOf(id);
  if (index >= 0) {
    form.payTypes.splice(index, 1);
  } else {
    form.payTypes.push(id);
  }
};

const addCustomPayType = () => {
  const value = customPayType.value.trim();
  if (!value) return;
  if (!form.payTypes.includes(value)) {
    form.payTypes.push(value);
  }
  customPayType.value = '';
};

const load = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch('/api/v1/settings');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = json.data as AppSettings;
    catalog.value = json.catalog ?? [];
    form.cronIntervalSec = Math.round((data.cronIntervalMs || 60000) / 1000);
    form.offersRows = data.offersRows;
    form.payTypes = [...(data.payTypes || [])];
    form.retentionHours = data.retentionHours;
    form.dataFilePath = data.dataFilePath;
  } catch (err: any) {
    error.value = err.message || 'No se pudo cargar la configuración';
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  saving.value = true;
  error.value = null;
  success.value = null;
  try {
    const res = await fetch('/api/v1/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cronIntervalMs: Math.round(form.cronIntervalSec * 1000),
        offersRows: form.offersRows,
        payTypes: form.payTypes,
        retentionHours: form.retentionHours,
        dataFilePath: form.dataFilePath,
      }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(payload?.message || `HTTP ${res.status}`);
    }
    await fetch('/api/v1/advertising/collect', { method: 'POST' });
    success.value = 'Configuración guardada. Se disparó una recolección con los nuevos parámetros.';
    emit('saved');
  } catch (err: any) {
    error.value = err.message || 'No se pudo guardar la configuración';
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>
