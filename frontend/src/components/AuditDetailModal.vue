<template>
  <div class="settings-overlay" @click.self="$emit('close')">
    <section class="settings-panel audit-panel" role="dialog">
      <!-- Header -->
      <header class="settings-header">
        <div>
          <h2 class="card-title">Auditoría de Snapshot</h2>
          <p class="settings-subtitle">
            ID: <code style="color: var(--accent-binance);">{{ snapshot?.id }}</code>
            &nbsp;|&nbsp; Monitor: <strong>{{ snapshot?.monitorName }}</strong>
          </p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
          <!-- Delete button with two-step confirmation -->
          <button
            v-if="!deleteConfirming"
            class="btn-danger"
            type="button"
            :disabled="deleting"
            @click="deleteConfirming = true"
          >
            🗑 Eliminar
          </button>
          <template v-else>
            <span style="font-size: 12px; color: var(--color-red); font-weight: 600; white-space: nowrap;">¿Confirmar?</span>
            <button
              class="btn-danger btn-danger--confirm"
              type="button"
              :disabled="deleting"
              @click="confirmDelete"
            >
              {{ deleting ? 'Eliminando…' : 'Sí, eliminar' }}
            </button>
            <button
              class="btn-tab"
              type="button"
              :disabled="deleting"
              @click="deleteConfirming = false"
            >
              Cancelar
            </button>
          </template>
          <button class="btn-tab" type="button" @click="$emit('close')">✕ Cerrar</button>
        </div>
      </header>

      <p v-if="deleteError" style="color: var(--color-red); font-size: 13px; padding: 0 0 8px;">
        Error al eliminar: {{ deleteError }}
      </p>

      <div class="audit-body">
        <!-- Status Banner -->
        <div
          class="metric-card"
          :style="{ borderColor: snapshot?.status === 'SUCCESS' ? 'var(--color-green)' : 'var(--color-red)' }"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div
              style="font-weight: 700; font-size: 15px;"
              :style="{ color: snapshot?.status === 'SUCCESS' ? 'var(--color-green)' : 'var(--color-red)' }"
            >
              {{ snapshot?.status === 'SUCCESS' ? '✓ PETICIÓN EXITOSA' : '⚠️ PETICIÓN FALLIDA' }}
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <span class="badge-tag">Duración: {{ snapshot?.executionDurationMs }} ms</span>
              <span class="badge-tag">{{ new Date(snapshot?.timestamp).toLocaleString() }}</span>
            </div>
          </div>
          <p v-if="snapshot?.errorMessage" style="color: var(--color-red); font-size: 13px; margin-top: 6px;">
            Error: {{ snapshot.errorMessage }}
          </p>
        </div>

        <!-- Two-col: HTTP details + Payload -->
        <div class="audit-cols">
          <!-- HTTP Details -->
          <div class="table-card" style="padding: 16px; flex: 1; min-width: 0;">
            <h3 class="audit-section-title">Detalles de la Petición HTTP</h3>
            <dl class="audit-dl">
              <dt>Método</dt>
              <dd><span class="badge-tag">POST</span></dd>

              <dt>URL Binance P2P</dt>
              <dd><code class="audit-code">{{ snapshot?.auditTrail?.requestUrl }}</code></dd>

              <dt>Código HTTP</dt>
              <dd>
                <span
                  class="badge-tag"
                  :style="{ color: (snapshot?.auditTrail?.httpStatus || 200) < 400 ? 'var(--color-green)' : 'var(--color-red)',
                            borderColor: (snapshot?.auditTrail?.httpStatus || 200) < 400 ? 'var(--color-green)' : 'var(--color-red)' }"
                >{{ snapshot?.auditTrail?.httpStatus || 200 }}</span>
              </dd>

              <dt>Ofertas devueltas</dt>
              <dd><strong style="color: var(--accent-binance); font-size: 16px;">{{ snapshot?.auditTrail?.recordsCount ?? records.length }}</strong></dd>

              <dt>Duración</dt>
              <dd>{{ snapshot?.executionDurationMs }} ms</dd>
            </dl>
          </div>

          <!-- Payload JSON -->
          <div class="table-card" style="padding: 16px; flex: 1; min-width: 0;">
            <h3 class="audit-section-title">Payload JSON Enviado</h3>
            <pre class="audit-json">{{ JSON.stringify(snapshot?.auditTrail?.requestPayload, null, 2) }}</pre>
          </div>
        </div>

        <!-- Mean / StdDev Chart -->
        <div class="table-card" style="padding: 16px;">
          <h3 class="audit-section-title">Distribución de Precios (Media y Desviación)</h3>
          <div style="position: relative; height: 250px; width: 100%;">
            <canvas ref="modalChartCanvas"></canvas>
          </div>
        </div>

        <!-- Offers Table -->
        <div class="table-card" style="padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
            <h3 class="audit-section-title" style="margin: 0;">
              Ofertas Capturadas
              <span class="badge-tag" style="margin-left: 6px; font-size: 11px;">{{ filteredRecords.length }} de {{ records.length }}</span>
            </h3>
            <input
              v-model="offersSearch"
              type="text"
              placeholder="Filtrar comerciante o banco..."
              class="search-input"
              style="width: 220px;"
            />
          </div>

          <div class="table-wrapper">
            <table class="binance-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Comerciante</th>
                  <th>Precio (Bs)</th>
                  <th>Disponible (USDT)</th>
                  <th>Límites</th>
                  <th>Métodos de Pago</th>
                  <th>Órdenes / Éxito</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in filteredRecords" :key="idx">
                  <td style="color: var(--text-muted); width: 32px;">{{ idx + 1 }}</td>
                  <td>
                    <div style="font-weight: 600; white-space: nowrap;">
                      {{ item.advertiser?.nickName || 'Anónimo' }}
                      <span
                        v-if="item.advertiser?.isProMerchant"
                        class="badge-tag badge-pro"
                        style="margin-left: 4px;"
                      >PRO</span>
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted);">
                      ID: {{ item.advertiser?.userNo?.substring(0, 10) }}…
                    </div>
                  </td>
                  <td>
                    <span class="price-text">Bs. {{ item.price }}</span>
                  </td>
                  <td style="font-weight: 600;">
                    {{ item.availableAmount }} <span style="color: var(--text-muted); font-size: 11px;">USDT</span>
                  </td>
                  <td style="font-size: 12px; color: var(--text-secondary); white-space: nowrap;">
                    Bs. {{ item.minTransAmount }}
                    <span style="color: var(--text-muted);">–</span>
                    {{ item.maxTransAmount }}
                  </td>
                  <td>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                      <span
                        v-for="(m, mIdx) in (item.paymentMethods || [])"
                        :key="mIdx"
                        class="badge-tag"
                      >{{ m.name }}</span>
                    </div>
                  </td>
                  <td style="white-space: nowrap;">
                    <div style="font-size: 12px;">{{ item.advertiser?.totalOrders || 0 }} órd.</div>
                    <div style="font-size: 11px; color: var(--color-green);">
                      {{ ((item.advertiser?.monthlyCompletionRate || 0) * 100).toFixed(1) }}%
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredRecords.length === 0">
                  <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">
                    {{ records.length === 0 ? 'No se capturaron ofertas en este snapshot.' : 'Sin resultados para el filtro aplicado.' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

const props = defineProps<{
  snapshot: any;
}>();

const emit = defineEmits<{
  close: [];
  deleted: [snapshotId: string];
}>();

const offersSearch = ref('');
const deleteConfirming = ref(false);
const deleting = ref(false);
const deleteError = ref<string | null>(null);

const records = computed<any[]>(() => props.snapshot?.records || []);

const filteredRecords = computed(() => {
  const q = offersSearch.value.toLowerCase().trim();
  if (!q) return records.value;
  return records.value.filter((item: any) => {
    const nick = (item.advertiser?.nickName || '').toLowerCase();
    const methods = (item.paymentMethods || [])
      .map((m: any) => (m.name || '').toLowerCase())
      .join(' ');
    return nick.includes(q) || methods.includes(q);
  });
});

const confirmDelete = async () => {
  if (!props.snapshot?.id || !props.snapshot?.monitorId) return;
  deleting.value = true;
  deleteError.value = null;
  try {
    const res = await fetch(
      `/api/v1/monitors/${props.snapshot.monitorId}/snapshots/${props.snapshot.id}`,
      { method: 'DELETE' },
    );
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Error ${res.status}`);
    }
    emit('deleted', props.snapshot.id);
    emit('close');
  } catch (err: any) {
    deleteError.value = err.message || 'Error desconocido.';
    deleteConfirming.value = false;
  } finally {
    deleting.value = false;
  }
};

const modalChartCanvas = ref<HTMLCanvasElement | null>(null);
let modalChartInstance: Chart | null = null;

const renderModalChart = () => {
  if (!modalChartCanvas.value) return;

  const existingChart = Chart.getChart(modalChartCanvas.value);
  if (existingChart) existingChart.destroy();
  if (modalChartInstance) modalChartInstance = null;

  const allRecords = records.value;
  const regularRecords = allRecords.filter((r: any) => !r.isPromoted);
  
  const prices = regularRecords
    .map((r: any) => typeof r.price === 'number' ? r.price : parseFloat(r.price))
    .filter((p: number) => !isNaN(p) && p > 0)
    .sort((a: number, b: number) => a - b);

  if (prices.length === 0) return;

  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  const upperStdDev = avg + stdDev;
  const lowerStdDev = avg - stdDev;
  const labels = prices.map((_, i) => `Oferta ${i + 1}`);

  modalChartInstance = new Chart(modalChartCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Precio (Bs)',
          data: prices,
          backgroundColor: '#3b82f6',
          borderRadius: 2,
        },
        {
          label: 'Media',
          data: Array(prices.length).fill(avg),
          type: 'line',
          borderColor: '#f0b90b',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
        {
          label: '+1 Desviación (σ)',
          data: Array(prices.length).fill(upperStdDev),
          type: 'line',
          borderColor: 'rgba(246, 70, 93, 0.8)',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
        {
          label: '-1 Desviación (σ)',
          data: Array(prices.length).fill(lowerStdDev),
          type: 'line',
          borderColor: 'rgba(14, 203, 129, 0.8)',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        }
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#eaecef' } },
        tooltip: {
          backgroundColor: '#181a20',
          titleColor: '#848e9c',
          bodyColor: '#ffffff',
          callbacks: {
            label: (ctx: any) => ` ${ctx.dataset.label}: Bs. ${Number(ctx.parsed.y).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
          },
        },
      },
      scales: {
        x: { display: false },
        y: {
          grid: { color: '#2b313a' },
          ticks: { color: '#848e9c' },
          min: Math.max(0, lowerStdDev - stdDev),
          max: upperStdDev + stdDev,
        },
      },
    },
  });
};

watch(records, () => {
  nextTick(() => {
    renderModalChart();
  });
});

onMounted(() => {
  nextTick(() => {
    renderModalChart();
  });
});

onUnmounted(() => {
  if (modalChartInstance) {
    modalChartInstance.destroy();
  }
});
</script>

<style scoped>
.audit-panel {
  width: min(900px, 100%);
}

.audit-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.audit-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 640px) {
  .audit-cols {
    grid-template-columns: 1fr;
  }
}

.audit-section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-binance);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.audit-dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 12px;
  font-size: 13px;
}

.audit-dl dt {
  color: var(--text-secondary);
  font-weight: 600;
  white-space: nowrap;
  padding-top: 2px;
}

.audit-dl dd {
  color: var(--text-primary);
  margin: 0;
  word-break: break-all;
}

.audit-json {
  background: var(--bg-primary);
  padding: 12px;
  border-radius: 6px;
  font-size: 11.5px;
  overflow: auto;
  max-height: 220px;
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
}

.audit-code {
  color: var(--text-primary);
  font-size: 11px;
  word-break: break-all;
}

/* Delete button */
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: var(--border-radius-sm);
  border: 1px solid rgba(246, 70, 93, 0.5);
  background: rgba(246, 70, 93, 0.1);
  color: var(--color-red);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(246, 70, 93, 0.2);
  border-color: var(--color-red);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger--confirm {
  background: rgba(246, 70, 93, 0.25);
  border-color: var(--color-red);
  animation: pulse-red 0.8s ease-in-out infinite alternate;
}

@keyframes pulse-red {
  from { box-shadow: 0 0 0 0 rgba(246, 70, 93, 0); }
  to   { box-shadow: 0 0 0 4px rgba(246, 70, 93, 0.2); }
}
</style>
