<template>
  <div class="settings-overlay" @click.self="$emit('close')">
    <section class="settings-panel" role="dialog">
      <header class="settings-header">
        <div>
          <h2 class="card-title">{{ isEditing ? 'Editar Monitor Cron' : 'Nuevo Monitor Cron' }}</h2>
          <p class="settings-subtitle">Configura los filtros de búsqueda, frecuencia de ejecución y política de retención.</p>
        </div>
        <button class="btn-tab" type="button" @click="$emit('close')">Cerrar</button>
      </header>

      <form class="settings-form" @submit.prevent="save">
        <label class="form-field">
          <span>Nombre del Monitor *</span>
          <input v-model="form.name" class="search-input form-input" type="text" placeholder="Ej. Monitor Banesco Express" required />
        </label>

        <div class="settings-grid">
          <label class="form-field">
            <span>Frecuencia del Cron (segundos) *</span>
            <input v-model.number="form.cronIntervalSec" class="search-input form-input" type="number" min="5" max="3600" required />
          </label>

          <label class="form-field">
            <span>Retención de Snapshots (horas)</span>
            <input v-model.number="form.retentionHours" class="search-input form-input" type="number" min="1" max="720" required />
            <small>Horas antes de purgar registros viejos.</small>
          </label>

          <label class="form-field">
            <span>Moneda Fiat</span>
            <input v-model="form.queryFilter.fiat" class="search-input form-input" type="text" placeholder="VES" />
          </label>

          <label class="form-field">
            <span>Criptoactivo (Asset)</span>
            <input v-model="form.queryFilter.asset" class="search-input form-input" type="text" placeholder="USDT" />
          </label>

          <label class="form-field">
            <span>Tipo de Operación</span>
            <select v-model="form.queryFilter.tradeType" class="search-input form-input">
              <option value="BUY">BUY (Comprar)</option>
              <option value="SELL">SELL (Vender)</option>
            </select>
          </label>

          <label class="form-field">
            <span>Ofertas por Consulta</span>
            <input v-model.number="form.queryFilter.rows" class="search-input form-input" type="number" min="1" max="100" />
          </label>
        </div>

        <div class="form-field">
          <span>Métodos de Pago (Bancos)</span>
          <p class="settings-hint">Selecciona uno o varios bancos para filtrar las ofertas de este cron.</p>
          <div class="paytype-grid">
            <button
              v-for="item in catalog"
              :key="item.id"
              type="button"
              class="paytype-chip"
              :class="{ active: form.queryFilter.payTypes.includes(item.id) }"
              @click="togglePayType(item.id)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="form-field">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-primary);">
            <input v-model="form.enabled" type="checkbox" style="width: 18px; height: 18px; accent-color: var(--accent-binance);" />
            <span>Activar ejecución automática de este Cron</span>
          </label>
        </div>

        <p v-if="error" class="settings-error">{{ error }}</p>

        <div class="settings-actions" style="gap: 12px;">
          <button class="btn-tab" type="button" @click="$emit('close')">Cancelar</button>
          <button class="btn-action" type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Monitor') }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';

const props = defineProps<{
  monitor?: any;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);
const error = ref<string | null>(null);
const catalog = ref<Array<{ id: string; label: string }>>([]);

const isEditing = computed(() => Boolean(props.monitor?.id));

const form = reactive({
  name: props.monitor?.name || '',
  enabled: props.monitor?.enabled ?? true,
  cronIntervalSec: props.monitor?.cronIntervalMs ? Math.round(props.monitor.cronIntervalMs / 1000) : 60,
  retentionHours: props.monitor?.retentionPolicy?.retentionHours || 48,
  queryFilter: {
    fiat: props.monitor?.queryFilter?.fiat || 'VES',
    asset: props.monitor?.queryFilter?.asset || 'USDT',
    tradeType: props.monitor?.queryFilter?.tradeType || 'BUY',
    payTypes: [...(props.monitor?.queryFilter?.payTypes || [])],
    rows: props.monitor?.queryFilter?.rows || 20,
  },
});

const togglePayType = (id: string) => {
  const idx = form.queryFilter.payTypes.indexOf(id);
  if (idx >= 0) {
    form.queryFilter.payTypes.splice(idx, 1);
  } else {
    form.queryFilter.payTypes.push(id);
  }
};

const fetchCatalog = async () => {
  try {
    const res = await fetch('/api/v1/monitors/catalog/pay-types');
    if (res.ok) {
      const json = await res.json();
      catalog.value = json.data || [];
    }
  } catch {
    // Ignorar si falla el catálogo
  }
};

const save = async () => {
  saving.value = true;
  error.value = null;

  try {
    const payload = {
      name: form.name,
      enabled: form.enabled,
      cronIntervalMs: Math.round(form.cronIntervalSec * 1000),
      retentionPolicy: { retentionHours: form.retentionHours },
      queryFilter: form.queryFilter,
    };

    const url = isEditing.value ? `/api/v1/monitors/${props.monitor.id}` : '/api/v1/monitors';
    const method = isEditing.value ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Error ${res.status}`);
    }

    emit('saved');
    emit('close');
  } catch (err: any) {
    error.value = err.message || 'Error al guardar el monitor.';
  } finally {
    saving.value = false;
  }
};

onMounted(fetchCatalog);
</script>
