<template>
  <div class="app-root">
    <!-- Header Bar -->
    <header class="header">
      <div class="brand">
        <div class="logo-icon"></div>
        <div>
          <div class="brand-title">Binance Monitor P2P</div>
          <div class="brand-subtitle">Monitor de Precios & Cron Histórico (VES / USDT)</div>
        </div>
      </div>

      <div class="header-actions">
        <div class="live-badge">
          <div class="pulse-dot"></div>
          <span>CRON ACTIVO</span>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="container">
      <!-- Controls Bar -->
      <section class="controls-bar">
        <div class="controls-group">
          <span style="font-size: 13px; color: var(--text-secondary); margin-right: 8px; font-weight: 600;">Período:</span>
          <div class="btn-group">
            <button
              v-for="h in [1, 6, 12, 24, 48]"
              :key="h"
              class="btn-tab"
              :class="{ active: periodHours === h }"
              @click="changePeriod(h)"
            >
              {{ h }}h
            </button>
          </div>
        </div>

        <div class="controls-group" style="display: flex; gap: 12px; align-items: center;">
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">Auto Recarga:</span>
          <div class="btn-group">
            <button
              v-for="sec in [0, 10, 30]"
              :key="sec"
              class="btn-tab"
              :class="{ active: autoRefreshSeconds === sec }"
              @click="setAutoRefresh(sec)"
            >
              {{ sec === 0 ? 'Off' : `${sec}s` }}
            </button>
          </div>

          <button class="btn-action" :disabled="loading" @click="fetchData">
            <RefreshCwIcon :class="{ spin: loading }" :size="16" />
            <span>Actualizar</span>
          </button>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="loading && historyData.length === 0" class="loading-box">
        <div class="spinner"></div>
        <span>Cargando datos del repositorio...</span>
      </div>

      <!-- Error Banner -->
      <div v-else-if="error" class="metric-card" style="border-color: var(--color-red);">
        <div style="color: var(--color-red); font-weight: 600;">⚠️ Error al conectar con la API</div>
        <div style="font-size: 13px; color: var(--text-secondary);">{{ error }}</div>
      </div>

      <template v-else>
        <!-- Metrics Overview Grid -->
        <section class="metrics-grid">
          <div class="metric-card">
            <span class="metric-label">Precio Mínimo Actual</span>
            <span class="metric-value highlight-green">Bs. {{ formatNumber(latestMetrics.minPrice) }}</span>
            <span class="metric-sub">Mejor oferta de compra en mercado</span>
          </div>

          <div class="metric-card">
            <span class="metric-label">Precio Promedio</span>
            <span class="metric-value highlight-gold">Bs. {{ formatNumber(latestMetrics.avgPrice) }}</span>
            <span class="metric-sub">Promedio de ofertas activas</span>
          </div>

          <div class="metric-card">
            <span class="metric-label">Precio Máximo</span>
            <span class="metric-value">Bs. {{ formatNumber(latestMetrics.maxPrice) }}</span>
            <span class="metric-sub">Toque superior en ordenes</span>
          </div>

          <div class="metric-card">
            <span class="metric-label">Ofertas / Snapshots</span>
            <span class="metric-value">{{ latestMetrics.offerCount }} <span style="font-size: 14px; font-weight: 400; color: var(--text-secondary)">ofertas</span></span>
            <span class="metric-sub">{{ historyData.length }} capturas en {{ periodHours }}h</span>
          </div>
        </section>

        <!-- Chart Card -->
        <section class="chart-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Evolución Temporal de Precios P2P (Bs / USDT)</h2>
              <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                Tendencia histórica recolectada por el Cron en los últimos snapshots
              </p>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </section>

        <!-- Latest Offers Data Table -->
        <section class="table-card">
          <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 class="card-title">Último Snapshot de Ofertas (P2P Binance)</h2>
              <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                Capturado a las: {{ latestMetrics.formattedTimestamp }}
              </p>
            </div>
            <div class="table-controls">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar por comerciante o pago..."
                class="search-input"
              />
            </div>
          </div>

          <div class="table-wrapper">
            <table class="binance-table">
              <thead>
                <tr>
                  <th>Comerciante</th>
                  <th>Precio (Bs)</th>
                  <th>Disponible (USDT)</th>
                  <th>Límites de Orden</th>
                  <th>Órdenes / Completado</th>
                  <th>Métodos de Pago</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in filteredOffers" :key="idx">
                  <td>
                    <div style="font-weight: 600;">
                      {{ item.advertiser?.nickName || 'Anónimo' }}
                      <span v-if="item.advertiser?.userType === 'merchant'" class="badge-tag badge-pro">PRO</span>
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted)">
                      ID: {{ item.advertiser?.userNo?.substring(0, 10) }}...
                    </div>
                  </td>
                  <td>
                    <span class="price-text">Bs. {{ item.adv?.price }}</span>
                  </td>
                  <td>
                    <span style="font-weight: 600;">{{ item.adv?.surplusAmount }}</span> USDT
                  </td>
                  <td>
                    <span style="font-size: 12px; color: var(--text-secondary);">
                      Bs. {{ item.adv?.minSingleTransAmount }} - Bs. {{ item.adv?.maxSingleTransAmount }}
                    </span>
                  </td>
                  <td>
                    <div style="font-weight: 500;">
                      {{ item.advertiser?.monthOrderCount || 0 }} órdenes
                    </div>
                    <div style="font-size: 11px; color: var(--color-green)">
                      {{ ((item.advertiser?.monthFinishRate || 0) * 100).toFixed(1) }}% éxito
                    </div>
                  </td>
                  <td>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                      <span
                        v-for="(method, mIdx) in (item.adv?.tradeMethods || [])"
                        :key="mIdx"
                        class="badge-tag"
                      >
                        {{ method.tradeMethodName || method.identifier }}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredOffers.length === 0">
                  <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    No se encontraron ofertas que coincidan con la búsqueda.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { RefreshCw as RefreshCwIcon } from 'lucide-vue-next';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
} from 'chart.js';

// Registrar componentes de Chart.js
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
);

interface TradeMethod {
  tradeMethodName?: string;
  identifier?: string;
}

interface Adv {
  advNo?: string;
  price?: string;
  surplusAmount?: string;
  minSingleTransAmount?: string;
  maxSingleTransAmount?: string;
  tradeMethods?: TradeMethod[];
}

interface Advertiser {
  userNo?: string;
  nickName?: string;
  userType?: string;
  monthOrderCount?: number;
  monthFinishRate?: number;
}

interface AdvertisingItem {
  adv?: Adv;
  advertiser?: Advertiser;
}

interface AdvertisingSnapshot {
  id: string;
  timestamp: string;
  records: AdvertisingItem[];
}

// Estados reactivos
const periodHours = ref<number>(24);
const autoRefreshSeconds = ref<number>(10);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const historyData = ref<AdvertisingSnapshot[]>([]);
const searchQuery = ref<string>('');

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

// Cargar datos de la API
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`/api/v1/advertising/history?hours=${periodHours.value}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      historyData.value = json.data;
      await nextTick();
      renderChart();
    } else {
      throw new Error('Respuesta inválida del servidor');
    }
  } catch (err: any) {
    error.value = err.message || 'Error de conexión con el backend';
  } finally {
    loading.value = false;
  }
};

const changePeriod = (h: number) => {
  periodHours.value = h;
  fetchData();
};

const setAutoRefresh = (sec: number) => {
  autoRefreshSeconds.value = sec;
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  if (sec > 0) {
    autoRefreshTimer = setInterval(fetchData, sec * 1000);
  }
};

// Métricas calculadas para la tarjeta superior
const latestMetrics = computed(() => {
  if (historyData.value.length === 0) {
    return { minPrice: 0, avgPrice: 0, maxPrice: 0, offerCount: 0, formattedTimestamp: '--' };
  }

  const latest = historyData.value[historyData.value.length - 1];
  const prices = (latest.records || [])
    .map((item) => parseFloat(item.adv?.price || '0'))
    .filter((p) => p > 0);

  if (prices.length === 0) {
    return { minPrice: 0, avgPrice: 0, maxPrice: 0, offerCount: 0, formattedTimestamp: '--' };
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  const date = new Date(latest.timestamp);
  const formattedTimestamp = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    minPrice,
    avgPrice,
    maxPrice,
    offerCount: latest.records?.length || 0,
    formattedTimestamp,
  };
});

// Ofertas del último snapshot para la tabla
const latestOffers = computed<AdvertisingItem[]>(() => {
  if (historyData.value.length === 0) return [];
  const latest = historyData.value[historyData.value.length - 1];
  return latest.records || [];
});

const filteredOffers = computed(() => {
  if (!searchQuery.value.trim()) return latestOffers.value;
  const q = searchQuery.value.toLowerCase();
  return latestOffers.value.filter((item) => {
    const nick = item.advertiser?.nickName?.toLowerCase() || '';
    const methods = (item.adv?.tradeMethods || []).map((m) => (m.tradeMethodName || '').toLowerCase()).join(' ');
    return nick.includes(q) || methods.includes(q);
  });
});

const formatNumber = (num: number) => {
  return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Renderizado del Gráfico de Chart.js
const renderChart = () => {
  if (!chartCanvas.value) return;

  const labels: string[] = [];
  const minPrices: number[] = [];
  const avgPrices: number[] = [];
  const maxPrices: number[] = [];

  historyData.value.forEach((snapshot) => {
    const d = new Date(snapshot.timestamp);
    labels.push(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    const prices = (snapshot.records || [])
      .map((item) => parseFloat(item.adv?.price || '0'))
      .filter((p) => p > 0);

    if (prices.length > 0) {
      minPrices.push(Math.min(...prices));
      maxPrices.push(Math.max(...prices));
      avgPrices.push(prices.reduce((a, b) => a + b, 0) / prices.length);
    } else {
      minPrices.push(0);
      avgPrices.push(0);
      maxPrices.push(0);
    }
  });

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Precio Mínimo (Bs)',
          data: minPrices,
          borderColor: '#0ECB81',
          backgroundColor: 'rgba(14, 203, 129, 0.1)',
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: 'Precio Promedio (Bs)',
          data: avgPrices,
          borderColor: '#F0B90B',
          borderWidth: 2,
          borderDash: [4, 4],
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: 'Precio Máximo (Bs)',
          data: maxPrices,
          borderColor: '#F6465D',
          borderWidth: 1.5,
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: '#EAECEF',
            font: { family: 'IBM Plex Sans', size: 12 },
          },
        },
        tooltip: {
          backgroundColor: '#181A20',
          titleColor: '#F0B90B',
          bodyColor: '#EAECEF',
          borderColor: '#2B313A',
          borderWidth: 1,
          padding: 12,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(43, 49, 58, 0.5)' },
          ticks: { color: '#848E9C', font: { family: 'IBM Plex Sans' } },
        },
        y: {
          grid: { color: 'rgba(43, 49, 58, 0.5)' },
          ticks: { color: '#848E9C', font: { family: 'IBM Plex Sans' } },
        },
      },
    },
  });
};

onMounted(() => {
  fetchData();
  setAutoRefresh(autoRefreshSeconds.value);
});

onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
  }
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<style scoped>
.spin {
  animation: spin 1s linear infinite;
}
</style>
