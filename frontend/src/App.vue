<template>
  <div class="app-root">
    <!-- Header Bar -->
    <header class="header">
      <div class="brand">
        <div class="logo-icon"></div>
        <div>
          <div class="brand-title">Binance Monitor P2P</div>
          <div class="brand-subtitle">Plataforma de Monitoreo & Consulta al Instante</div>
        </div>
      </div>

      <!-- Main Module Navigation Tabs -->
      <div class="header-actions">
        <div class="btn-group" style="padding: 2px;">
          <button
            class="btn-tab"
            :class="{ active: currentTab === 'live' }"
            type="button"
            @click="currentTab = 'live'"
          >
            ⚡ Ofertas al Instante
          </button>
          <button
            class="btn-tab"
            :class="{ active: currentTab === 'monitoring' }"
            type="button"
            @click="currentTab = 'monitoring'"
          >
            📊 Monitoreo & Gráficas
          </button>
        </div>

        <button
          class="btn-help"
          type="button"
          @click="showTutorialModal = true"
          title="Abrir Tutorial y Guía del Usuario"
        >
          <HelpCircleIcon :size="16" />
          <span>Tutorial</span>
        </button>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="container">
      <!-- ========================================================================= -->
      <!-- TAB 1: OFERTAS AL INSTANTE (MODULE 2)                                      -->
      <!-- ========================================================================= -->
      <template v-if="currentTab === 'live'">
        <section class="controls-bar" style="flex-direction: column; align-items: stretch; gap: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 16px; font-weight: 700; color: var(--text-primary);">Consulta de Ofertas P2P en Tiempo Real</h2>
              <p style="font-size: 12px; color: var(--text-secondary);">
                Obtén el listado de ofertas en el instante actual sin generar historial ni guardar en disco.
              </p>
            </div>

            <div style="display: flex; gap: 12px; align-items: center;">
              <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">Auto Recarga:</span>
              <div class="btn-group">
                <button
                  v-for="sec in [0, 10, 30]"
                  :key="sec"
                  class="btn-tab"
                  :class="{ active: liveAutoRefreshSeconds === sec }"
                  @click="setLiveAutoRefresh(sec)"
                >
                  {{ sec === 0 ? 'Off' : `${sec}s` }}
                </button>
              </div>

              <button class="btn-action" :disabled="liveLoading" @click="fetchLiveOffers">
                <RefreshCwIcon :class="{ spin: liveLoading }" :size="16" />
                <span>Consultar Ofertas Ahora</span>
              </button>
            </div>
          </div>

          <!-- Live Filters Bar -->
          <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; background: var(--bg-tertiary); padding: 12px; border-radius: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">
                Fiat:
                <span class="tooltip-wrapper">
                  <span class="tooltip-icon">?</span>
                  <span class="tooltip-text">Moneda local Fiat a consultar (ej. VES, COP, ARS).</span>
                </span>
              </span>
              <input v-model="liveFilters.fiat" class="search-input" style="width: 80px;" type="text" />
            </div>

            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">
                Asset:
                <span class="tooltip-wrapper">
                  <span class="tooltip-icon">?</span>
                  <span class="tooltip-text">Criptoactivo P2P (ej. USDT, BTC, ETH).</span>
                </span>
              </span>
              <input v-model="liveFilters.asset" class="search-input" style="width: 80px;" type="text" />
            </div>

            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">
                Operación:
                <span class="tooltip-wrapper">
                  <span class="tooltip-icon">?</span>
                  <span class="tooltip-text">BUY (comprar a vendedores) o SELL (vender a compradores).</span>
                </span>
              </span>
              <select v-model="liveFilters.tradeType" class="search-input" style="width: 100px;">
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">
                Filas:
                <span class="tooltip-wrapper">
                  <span class="tooltip-icon">?</span>
                  <span class="tooltip-text">Número de ofertas a recuperar por consulta.</span>
                </span>
              </span>
              <input v-model.number="liveFilters.rows" class="search-input" style="width: 70px;" type="number" min="1" max="100" />
            </div>

            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">
                Monto a comprar:
                <span class="tooltip-wrapper">
                  <span class="tooltip-icon">?</span>
                  <span class="tooltip-text">Monto exacto a comprar enviado a Binance P2P para pre-filtrar anuncios que soporten la operación en la moneda seleccionada (Fiat o Cripto).</span>
                </span>
              </span>
              <input v-model.number="liveFilters.transAmount" class="search-input" style="width: 85px;" type="number" placeholder="Ej. 5000" />
              <select v-model="liveFilters.transAmountUnit" class="search-input" style="width: 75px;">
                <option value="FIAT">{{ liveFilters.fiat || 'VES' }}</option>
                <option value="ASSET">{{ liveFilters.asset || 'USDT' }}</option>
              </select>
            </div>

            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; flex: 1;">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">
                Bancos:
                <span class="tooltip-wrapper">
                  <span class="tooltip-icon">?</span>
                  <span class="tooltip-text">Métodos de pago aceptados en la oferta.</span>
                </span>
              </span>
              <button
                v-for="b in livePayTypesCatalog"
                :key="b.id"
                class="paytype-chip"
                :class="{ active: liveFilters.payTypes.includes(b.id) }"
                @click="toggleLivePayType(b.id)"
              >
                {{ b.label }}
              </button>
            </div>
          </div>
        </section>

        <!-- Live Loading State -->
        <div v-if="liveLoading && liveOffers.length === 0" class="loading-box">
          <div class="spinner"></div>
          <span>Consultando Binance P2P en tiempo real...</span>
        </div>

        <!-- Live Offers Data Table -->
        <section v-else class="table-card">
          <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 class="card-title">Ofertas P2P Binance al Instante</h2>
              <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                Consultadas a las: {{ liveFetchedAt ? new Date(liveFetchedAt).toLocaleTimeString() : 'N/A' }} | Duración de Petición: {{ liveDurationMs }} ms
              </p>
            </div>
            <div class="table-controls">
              <input
                v-model="liveSearchQuery"
                type="text"
                placeholder="Filtrar por comerciante o pago..."
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
                <tr v-for="(item, idx) in filteredLiveOffers" :key="idx">
                  <td>
                    <div style="font-weight: 600;">
                      {{ item.advertiser?.nickName || 'Anónimo' }}
                      <span v-if="item.advertiser?.userType === 'merchant'" class="badge-tag badge-pro">PRO</span>
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
                <tr v-if="filteredLiveOffers.length === 0">
                  <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    No se encontraron ofertas que coincidan con los filtros.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>

      <!-- ========================================================================= -->
      <!-- TAB 2: MONITOREO & GRÁFICAS (MODULE 1)                                     -->
      <!-- ========================================================================= -->
      <template v-else-if="currentTab === 'monitoring'">
        <!-- Monitor Control & Selection Bar -->
        <section class="controls-bar">
          <div class="controls-group" style="align-items: center; gap: 12px; flex-wrap: wrap;">
            <span style="font-size: 13px; color: var(--text-secondary); font-weight: 700;">Monitor Activo:</span>
            <div class="btn-group">
              <button
                v-for="m in monitorsList"
                :key="m.id"
                class="btn-tab"
                :class="{ active: selectedMonitorId === m.id }"
                @click="selectMonitor(m.id)"
              >
                {{ m.name }}
                <span :style="{ color: m.enabled ? 'var(--color-green)' : 'var(--color-red)' }">●</span>
              </button>
            </div>

            <button class="btn-tab" style="border: 1px dashed var(--border-color);" @click="openCreateMonitorModal">
              + Nuevo Monitor
            </button>
          </div>

          <div v-if="selectedMonitor" class="controls-group" style="gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">Auto Recarga:</span>
              <div class="btn-group">
                <button class="btn-tab" :class="{ active: autoRefreshMode === 'off' }" @click="setAutoRefreshMode('off')">Off</button>
                <button class="btn-tab" :class="{ active: autoRefreshMode === 'auto' }" @click="setAutoRefreshMode('auto')">
                  Automática <span style="opacity: 0.7; font-size: 11px;">({{ selectedMonitor ? Math.round(selectedMonitor.cronIntervalMs / 1000) : '?' }}s)</span>
                </button>
                <button class="btn-tab" :class="{ active: autoRefreshMode === 'custom' }" @click="setAutoRefreshMode('custom')">Personalizada</button>
              </div>
              <!-- Custom interval input, shown only in custom mode -->
              <div v-if="autoRefreshMode === 'custom'" style="display: flex; align-items: center; gap: 4px;">
                <input
                  v-model.number="customRefreshSeconds"
                  type="number" min="5" max="3600"
                  class="search-input"
                  style="width: 70px; padding: 4px 8px;"
                  @change="applyCustomRefresh"
                />
                <span style="font-size: 12px; color: var(--text-secondary);">seg</span>
              </div>
              <div v-if="autoRefreshMode !== 'off'" class="live-badge" style="font-size: 11px; padding: 2px 8px;">
                <div class="pulse-dot"></div>
                <span>cada {{ monitorAutoRefreshSeconds }}s</span>
              </div>
            </div>
            <button class="btn-tab" @click="openEditMonitorModal(selectedMonitor)">Editar</button>
            <button class="btn-tab" style="color: var(--color-red);" @click="deleteSelectedMonitor">Eliminar</button>
            <button class="btn-action" :disabled="monitoringLoading" @click="triggerCollectionNow">
              <RefreshCwIcon :class="{ spin: monitoringLoading }" :size="16" />
              <span>Actualizar Ahora</span>
            </button>
          </div>
        </section>

        <!-- No Monitor Selected State -->
        <div v-if="monitorsList.length === 0" class="loading-box">
          <span>No hay monitores configurados. Crea uno nuevo para comenzar a recolectar snapshots.</span>
          <button class="btn-action" @click="openCreateMonitorModal">+ Crear Primer Monitor</button>
        </div>

        <template v-else-if="selectedMonitor">
          <!-- Metrics Overview Grid -->
          <section class="metrics-grid">
            <div class="metric-card">
              <span class="metric-label">Precio Mínimo Actual</span>
              <span class="metric-value highlight-green">Bs. {{ formatNumber(monitorMetrics.minPrice) }}</span>
              <span class="metric-sub">Mejor precio capturado por este cron</span>
            </div>

            <div class="metric-card">
              <span class="metric-label">Precio Promedio</span>
              <span class="metric-value highlight-gold">Bs. {{ formatNumber(monitorMetrics.avgPrice) }}</span>
              <span class="metric-sub">Promedio en snapshots del período</span>
            </div>

            <div class="metric-card">
              <span class="metric-label">Precio Máximo</span>
              <span class="metric-value">Bs. {{ formatNumber(monitorMetrics.maxPrice) }}</span>
              <span class="metric-sub">Toque superior en el período</span>
            </div>

            <div class="metric-card">
              <span class="metric-label">Snapshots / Auditoría</span>
              <span class="metric-value">{{ monitorSnapshots.length }} <span style="font-size: 14px; color: var(--text-secondary)">snapshots</span></span>
              <span class="metric-sub">Frecuencia: {{ selectedMonitor.cronIntervalMs / 1000 }}s | Retención: {{ selectedMonitor.retentionPolicy?.retentionHours }}h</span>
            </div>
          </section>

          <!-- Chart Card -->
          <section class="chart-card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Evolución de Precios P2P - {{ selectedMonitor.name }}</h2>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  Tendencia histórica de snapshots auditados en las últimas {{ periodHours }} horas
                </p>
              </div>
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
            <div class="chart-wrapper">
              <canvas ref="chartCanvas" style="cursor: pointer;" title="Haz click en un punto para ver el snapshot"></canvas>
            </div>
          </section>

          <!-- Audit Trail & Snapshots Data Table -->
          <section class="table-card">
            <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
              <div>
                <h2 class="card-title">Historial de Snapshots &amp; Auditoría de Peticiones</h2>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  Cada rutina guarda el resultado y traza completa de las peticiones HTTP realizadas
                </p>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 12px; color: var(--text-secondary);">Orden:</span>
                  <div class="btn-group">
                    <button
                      class="btn-tab"
                      :class="{ active: snapshotSortOrder === 'desc' }"
                      @click="snapshotSortOrder = 'desc'"
                      title="Más recientes primero"
                    >
                      Descendente ⬇
                    </button>
                    <button
                      class="btn-tab"
                      :class="{ active: snapshotSortOrder === 'asc' }"
                      @click="snapshotSortOrder = 'asc'"
                      title="Más antiguos primero"
                    >
                      Ascendente ⬆
                    </button>
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 12px; color: var(--text-secondary);">Filas por página:</span>
                  <div class="btn-group">
                    <button
                      v-for="size in [10, 25, 50]"
                      :key="size"
                      class="btn-tab"
                      :class="{ active: snapshotPageSize === size }"
                      @click="setPageSize(size)"
                    >{{ size }}</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="binance-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ID Snapshot</th>
                    <th style="cursor: pointer; user-select: none;" @click="toggleSort('timestamp')" title="Ordenar por fecha">
                      Fecha / Hora
                      <span v-if="snapshotSortField === 'timestamp'">{{ snapshotSortOrder === 'asc' ? '▲' : '▼' }}</span>
                    </th>
                    <th>Estado Petición</th>
                    <th style="cursor: pointer; user-select: none;" @click="toggleSort('httpStatus')" title="Ordenar por código HTTP">
                      Código HTTP
                      <span v-if="snapshotSortField === 'httpStatus'">{{ snapshotSortOrder === 'asc' ? '▲' : '▼' }}</span>
                    </th>
                    <th style="cursor: pointer; user-select: none;" @click="toggleSort('executionDurationMs')" title="Ordenar por duración">
                      Duración
                      <span v-if="snapshotSortField === 'executionDurationMs'">{{ snapshotSortOrder === 'asc' ? '▲' : '▼' }}</span>
                    </th>
                    <th style="cursor: pointer; user-select: none;" @click="toggleSort('offers')" title="Ordenar por ofertas">
                      Ofertas
                      <span v-if="snapshotSortField === 'offers'">{{ snapshotSortOrder === 'asc' ? '▲' : '▼' }}</span>
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(snap, idx) in paginatedSnapshots" :key="snap.id">
                    <td style="color: var(--text-muted); width: 36px;">
                      {{ (snapshotPage - 1) * snapshotPageSize + idx + 1 }}
                    </td>
                    <td><code style="font-size: 12px;">{{ snap.id.substring(0, 8) }}…</code></td>
                    <td style="white-space: nowrap;">{{ new Date(snap.timestamp).toLocaleString() }}</td>
                    <td>
                      <span
                        class="badge-tag"
                        :style="{
                          color: snap.status === 'SUCCESS' ? 'var(--color-green)' : 'var(--color-red)',
                          borderColor: snap.status === 'SUCCESS' ? 'var(--color-green)' : 'var(--color-red)'
                        }"
                      >
                        {{ snap.status === 'SUCCESS' ? '✓ OK' : '⚠ FAIL' }}
                      </span>
                    </td>
                    <td>
                      <span class="badge-tag"
                        :style="{ color: (snap.auditTrail?.httpStatus || 200) < 400 ? 'var(--color-green)' : 'var(--color-red)' }"
                      >{{ snap.auditTrail?.httpStatus || 200 }}</span>
                    </td>
                    <td style="white-space: nowrap;">{{ snap.executionDurationMs }} ms</td>
                    <td><strong style="color: var(--accent-binance);">{{ snap.records?.length || 0 }}</strong></td>
                    <td>
                      <div style="display: flex; gap: 6px;">
                        <button class="btn-tab" style="padding: 4px 8px; font-size: 12px;" @click="inspectAuditSnapshot(snap)">
                          🔍 Ver
                        </button>
                        <button
                          class="btn-tab"
                          style="padding: 4px 8px; font-size: 12px; color: var(--color-red); border-color: rgba(246,70,93,0.4);"
                          :title="'Eliminar snapshot ' + snap.id.substring(0,8)"
                          @click="deleteSnapshotInline(snap)"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="sortedSnapshots.length === 0">
                    <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 32px;">
                      No hay snapshots almacenados para este monitor en las últimas {{ periodHours }} horas.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Controls -->
            <div v-if="snapshotTotalPages > 1" class="pagination-bar">
              <span class="pagination-info">
                Mostrando {{ (snapshotPage - 1) * snapshotPageSize + 1 }}–{{ Math.min(snapshotPage * snapshotPageSize, sortedSnapshots.length) }}
                de <strong>{{ sortedSnapshots.length }}</strong> snapshots
              </span>

              <div class="pagination-controls">
                <button class="page-btn" :disabled="snapshotPage === 1" @click="snapshotPage = 1" title="Primera página">
                  ««
                </button>
                <button class="page-btn" :disabled="snapshotPage === 1" @click="snapshotPage--" title="Página anterior">
                  ‹
                </button>

                <template v-for="p in visiblePages" :key="p">
                  <span v-if="p === '...'" class="page-ellipsis">…</span>
                  <button
                    v-else
                    class="page-btn"
                    :class="{ active: snapshotPage === p }"
                    @click="snapshotPage = (p as number)"
                  >{{ p }}</button>
                </template>

                <button class="page-btn" :disabled="snapshotPage === snapshotTotalPages" @click="snapshotPage++" title="Página siguiente">
                  ›
                </button>
                <button class="page-btn" :disabled="snapshotPage === snapshotTotalPages" @click="snapshotPage = snapshotTotalPages" title="Última página">
                  »»
                </button>
              </div>
            </div>
          </section>
        </template>
      </template>
    </main>

    <!-- Modals -->
    <MonitorModal
      v-if="showMonitorModal"
      :monitor="editingMonitor"
      @close="showMonitorModal = false"
      @saved="onMonitorSaved"
    />

    <AuditDetailModal
      v-if="selectedAuditSnapshot"
      :snapshot="selectedAuditSnapshot"
      @close="selectedAuditSnapshot = null"
      @deleted="onSnapshotDeleted"
    />

    <TutorialModal
      v-if="showTutorialModal"
      @close="showTutorialModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { RefreshCw as RefreshCwIcon, HelpCircle as HelpCircleIcon } from 'lucide-vue-next';
import MonitorModal from './components/MonitorModal.vue';
import AuditDetailModal from './components/AuditDetailModal.vue';
import TutorialModal from './components/TutorialModal.vue';
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

const currentTab = ref<'live' | 'monitoring'>('live');
const showTutorialModal = ref(false);

// -----------------------------------------------------------------
// TAB 1: LIVE OFFERS (MODULE 2)
// -----------------------------------------------------------------
const liveLoading = ref(false);
const liveOffers = ref<any[]>([]);
const liveFetchedAt = ref<string | null>(null);
const liveDurationMs = ref<number>(0);
const liveSearchQuery = ref('');
const liveAutoRefreshSeconds = ref(0);
let liveAutoRefreshTimer: ReturnType<typeof setInterval> | null = null;

const livePayTypesCatalog = ref<Array<{ id: string; label: string }>>([
  { id: 'Banesco', label: 'Banesco' },
  { id: 'Mercantil', label: 'Mercantil' },
  { id: 'BancoDeVenezuela', label: 'BDV' },
  { id: 'Provincial', label: 'Provincial' },
  { id: 'PagoMovil', label: 'Pago Móvil' },
]);

const liveFilters = ref({
  fiat: 'VES',
  asset: 'USDT',
  tradeType: 'BUY',
  rows: 20,
  payTypes: ['Banesco', 'PagoMovil'] as string[],
  transAmount: null as number | null,
  transAmountUnit: 'FIAT' as 'FIAT' | 'ASSET',
});

const toggleLivePayType = (id: string) => {
  const idx = liveFilters.value.payTypes.indexOf(id);
  if (idx >= 0) {
    liveFilters.value.payTypes.splice(idx, 1);
  } else {
    liveFilters.value.payTypes.push(id);
  }
  fetchLiveOffers();
};

const fetchLiveOffers = async () => {
  liveLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.set('fiat', liveFilters.value.fiat);
    params.set('asset', liveFilters.value.asset);
    params.set('tradeType', liveFilters.value.tradeType);
    params.set('rows', String(liveFilters.value.rows));
    if (liveFilters.value.payTypes.length) {
      params.set('payTypes', liveFilters.value.payTypes.join(','));
    }
    if (liveFilters.value.transAmount) {
      params.set('transAmount', String(liveFilters.value.transAmount));
      params.set('transAmountUnit', liveFilters.value.transAmountUnit);
    }

    const res = await fetch(`/api/v1/live-offers?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    liveOffers.value = json.data?.offers || [];
    liveFetchedAt.value = json.data?.fetchedAt || new Date().toISOString();
    liveDurationMs.value = json.data?.durationMs || 0;
  } catch (err) {
    console.error('Error al consultar ofertas en vivo:', err);
  } finally {
    liveLoading.value = false;
  }
};

const setLiveAutoRefresh = (sec: number) => {
  liveAutoRefreshSeconds.value = sec;
  if (liveAutoRefreshTimer) clearInterval(liveAutoRefreshTimer);
  if (sec > 0) {
    liveAutoRefreshTimer = setInterval(fetchLiveOffers, sec * 1000);
  }
};

const filteredLiveOffers = computed(() => {
  if (!liveSearchQuery.value.trim()) return liveOffers.value;
  const q = liveSearchQuery.value.toLowerCase();
  return liveOffers.value.filter((item) => {
    const nick = item.advertiser?.nickName?.toLowerCase() || '';
    const methods = (item.adv?.tradeMethods || []).map((m: any) => m.tradeMethodName || '').join(' ').toLowerCase();
    return nick.includes(q) || methods.includes(q);
  });
});

// -----------------------------------------------------------------
// TAB 2: MONITORING & CHARTS (MODULE 1)
// -----------------------------------------------------------------
const monitorsList = ref<any[]>([]);
const selectedMonitorId = ref<string | null>(null);
const periodHours = ref(24);
const monitoringLoading = ref(false);
const monitorSnapshots = ref<any[]>([]);
const monitorMetrics = ref({ minPrice: 0, avgPrice: 0, maxPrice: 0, latestPrice: 0, offerCount: 0 });
const monitorAutoRefreshSeconds = ref(0);
const autoRefreshMode = ref<'off' | 'auto' | 'custom'>('auto');
const customRefreshSeconds = ref(30);
let monitorAutoRefreshTimer: ReturnType<typeof setInterval> | null = null;

const showMonitorModal = ref(false);
const editingMonitor = ref<any>(null);
const selectedAuditSnapshot = ref<any>(null);

// Sorting and Pagination state for snapshots table
const snapshotPage = ref(1);
const snapshotPageSize = ref(10);
const snapshotSortField = ref<'timestamp' | 'executionDurationMs' | 'offers' | 'httpStatus'>('timestamp');
const snapshotSortOrder = ref<'asc' | 'desc'>('desc');

const toggleSort = (field: 'timestamp' | 'executionDurationMs' | 'offers' | 'httpStatus') => {
  if (snapshotSortField.value === field) {
    snapshotSortOrder.value = snapshotSortOrder.value === 'desc' ? 'asc' : 'desc';
  } else {
    snapshotSortField.value = field;
    snapshotSortOrder.value = 'desc';
  }
};

const sortedSnapshots = computed(() => {
  const list = [...monitorSnapshots.value];
  const factor = snapshotSortOrder.value === 'asc' ? 1 : -1;
  return list.sort((a, b) => {
    let valA = 0;
    let valB = 0;
    if (snapshotSortField.value === 'timestamp') {
      valA = new Date(a.timestamp).getTime();
      valB = new Date(b.timestamp).getTime();
    } else if (snapshotSortField.value === 'executionDurationMs') {
      valA = a.executionDurationMs || 0;
      valB = b.executionDurationMs || 0;
    } else if (snapshotSortField.value === 'offers') {
      valA = a.records?.length || 0;
      valB = b.records?.length || 0;
    } else if (snapshotSortField.value === 'httpStatus') {
      valA = a.auditTrail?.httpStatus || 200;
      valB = b.auditTrail?.httpStatus || 200;
    }
    return (valA - valB) * factor;
  });
});

const snapshotTotalPages = computed(() =>
  Math.max(1, Math.ceil(sortedSnapshots.value.length / snapshotPageSize.value)),
);

const paginatedSnapshots = computed(() => {
  const start = (snapshotPage.value - 1) * snapshotPageSize.value;
  return sortedSnapshots.value.slice(start, start + snapshotPageSize.value);
});

// Show at most 7 page buttons with ellipsis
const visiblePages = computed(() => {
  const total = snapshotTotalPages.value;
  const current = snapshotPage.value;
  const pages: Array<number | '...'> = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (current > 4) pages.push('...');

  const rangeStart = Math.max(2, current - 2);
  const rangeEnd = Math.min(total - 1, current + 2);
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

  if (current < total - 3) pages.push('...');
  pages.push(total);
  return pages;
});

const setPageSize = (size: number) => {
  snapshotPageSize.value = size;
  snapshotPage.value = 1;
};

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const selectedMonitor = computed(() => monitorsList.value.find((m) => m.id === selectedMonitorId.value));

const fetchMonitors = async () => {
  try {
    const res = await fetch('/api/v1/monitors');
    if (!res.ok) return;
    const json = await res.json();
    monitorsList.value = json.data || [];
    if (monitorsList.value.length > 0 && !selectedMonitorId.value) {
      selectedMonitorId.value = monitorsList.value[0].id;
    }
    if (autoRefreshMode.value !== 'off') {
      setAutoRefreshMode(autoRefreshMode.value);
    }
  } catch (err) {
    console.error('Error al cargar monitores:', err);
  }
};

const selectMonitor = (id: string) => {
  selectedMonitorId.value = id;
  snapshotPage.value = 1;
  fetchMonitorHistory();
  if (autoRefreshMode.value !== 'off') {
    setAutoRefreshMode(autoRefreshMode.value);
  }
};

const fetchMonitorHistory = async () => {
  if (!selectedMonitorId.value) return;
  monitoringLoading.value = true;
  try {
    const res = await fetch(`/api/v1/monitors/${selectedMonitorId.value}/history?hours=${periodHours.value}`);
    if (!res.ok) return;
    const json = await res.json();

    monitorSnapshots.value = json.data?.snapshots || [];
    monitorMetrics.value = json.data?.metrics || { minPrice: 0, avgPrice: 0, maxPrice: 0, latestPrice: 0, offerCount: 0 };
    await nextTick();
    renderChart();
  } catch (err) {
    console.error('Error al cargar historial del monitor:', err);
  } finally {
    monitoringLoading.value = false;
  }
};

const triggerCollectionNow = async () => {
  if (!selectedMonitorId.value) return;
  monitoringLoading.value = true;
  try {
    await fetch(`/api/v1/monitors/${selectedMonitorId.value}/collect`, { method: 'POST' });
    await fetchMonitorHistory();
  } finally {
    monitoringLoading.value = false;
  }
};

const setMonitorAutoRefresh = (sec: number) => {
  monitorAutoRefreshSeconds.value = sec;
  if (monitorAutoRefreshTimer) clearInterval(monitorAutoRefreshTimer);
  monitorAutoRefreshTimer = null;
  if (sec > 0) {
    monitorAutoRefreshTimer = setInterval(() => {
      fetchMonitorHistory();
    }, sec * 1000);
  }
};

const setAutoRefreshMode = (mode: 'off' | 'auto' | 'custom') => {
  autoRefreshMode.value = mode;
  if (mode === 'off') {
    setMonitorAutoRefresh(0);
  } else if (mode === 'auto') {
    const intervalSec = selectedMonitor.value ? Math.round(selectedMonitor.value.cronIntervalMs / 1000) : 60;
    setMonitorAutoRefresh(Math.max(5, intervalSec));
  } else {
    applyCustomRefresh();
  }
};

const applyCustomRefresh = () => {
  const sec = Math.max(5, Math.min(3600, Number(customRefreshSeconds.value) || 30));
  customRefreshSeconds.value = sec;
  setMonitorAutoRefresh(sec);
};

const changePeriod = (h: number) => {
  periodHours.value = h;
  snapshotPage.value = 1;
  fetchMonitorHistory();
};

const openCreateMonitorModal = () => {
  editingMonitor.value = null;
  showMonitorModal.value = true;
};

const openEditMonitorModal = (m: any) => {
  editingMonitor.value = m;
  showMonitorModal.value = true;
};

const deleteSelectedMonitor = async () => {
  if (!selectedMonitorId.value) return;
  if (!confirm(`¿Seguro que deseas eliminar el monitor '${selectedMonitor.value?.name}'?`)) return;

  try {
    await fetch(`/api/v1/monitors/${selectedMonitorId.value}`, { method: 'DELETE' });
    selectedMonitorId.value = null;
    await fetchMonitors();
    if (monitorsList.value.length > 0) {
      selectedMonitorId.value = monitorsList.value[0].id;
      fetchMonitorHistory();
    }
  } catch (err) {
    console.error('Error al eliminar monitor:', err);
  }
};

const onMonitorSaved = async () => {
  await fetchMonitors();
  fetchMonitorHistory();
};

const inspectAuditSnapshot = (snap: any) => {
  selectedAuditSnapshot.value = snap;
};

const onSnapshotDeleted = (snapshotId: string) => {
  const idx = monitorSnapshots.value.findIndex((s: any) => s.id === snapshotId);
  if (idx !== -1) {
    monitorSnapshots.value.splice(idx, 1);
    nextTick(() => renderChart());
  }
  selectedAuditSnapshot.value = null;
};

const deleteSnapshotInline = async (snap: any) => {
  if (!confirm(`¿Eliminar el snapshot ${snap.id.substring(0, 8)}…?\nEsta acción no se puede deshacer.`)) return;
  try {
    const res = await fetch(`/api/v1/monitors/${snap.monitorId}/snapshots/${snap.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(`Error al eliminar: ${err?.message || res.status}`);
      return;
    }
    onSnapshotDeleted(snap.id);
  } catch (e: any) {
    alert(`Error de red: ${e.message}`);
  }
};

const renderChart = () => {
  if (!chartCanvas.value) return;

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const labels: string[] = [];
  const minPrices: number[] = [];
  const avgPrices: number[] = [];
  const maxPrices: number[] = [];

  for (const snap of monitorSnapshots.value) {
    const timeLabel = new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    labels.push(timeLabel);

    const prices = (snap.records || [])
      .map((r: any) => parseFloat(r.adv?.price))
      .filter((p: number) => !isNaN(p) && p > 0);

    if (prices.length > 0) {
      minPrices.push(Math.min(...prices));
      maxPrices.push(Math.max(...prices));
      avgPrices.push(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);
    } else {
      minPrices.push(0);
      avgPrices.push(0);
      maxPrices.push(0);
    }
  }

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Precio Mínimo (Bs)',
          data: minPrices,
          borderColor: '#0ecb81',
          backgroundColor: 'rgba(14, 203, 129, 0.08)',
          tension: 0.3,
          fill: '+2',
          pointRadius: 4,
          pointHoverRadius: 8,
        },
        {
          label: 'Precio Promedio (Bs)',
          data: avgPrices,
          borderColor: '#f0b90b',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 8,
        },
        {
          label: 'Precio Máximo (Bs)',
          data: maxPrices,
          borderColor: '#f6465d',
          backgroundColor: 'rgba(246, 70, 93, 0.06)',
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      onClick: (_event: any, elements: any[]) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index;
          const snap = monitorSnapshots.value[dataIndex];
          if (snap) {
            selectedAuditSnapshot.value = snap;
          }
        }
      },
      scales: {
        x: { grid: { color: '#2b313a' }, ticks: { color: '#848e9c', maxRotation: 45 } },
        y: {
          grid: { color: '#2b313a' },
          ticks: {
            color: '#848e9c',
            callback: (v: any) => `${Number(v).toLocaleString('es-VE', { minimumFractionDigits: 0 })} Bs`,
          },
        },
      },
      plugins: {
        legend: { labels: { color: '#eaecef', boxWidth: 12 } },
        tooltip: {
          backgroundColor: '#181a20',
          borderColor: '#2b313a',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          titleColor: '#848e9c',
          titleFont: { size: 11, weight: 'normal' },
          titleMarginBottom: 8,
          bodyFont: { size: 14, weight: 'bold' },
          bodySpacing: 6,
          callbacks: {
            label: (ctx: any) => ` ${ctx.dataset.label}: Bs. ${Number(ctx.parsed.y).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            labelTextColor: (ctx: any) => ctx.dataset.borderColor || '#ffffff',
          },
        },
      },
    },
  });
};

const formatNumber = (val: number) => {
  if (!val || isNaN(val)) return '0.00';
  return val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

watch(currentTab, (newTab) => {
  if (newTab === 'live') {
    fetchLiveOffers();
  } else if (newTab === 'monitoring') {
    fetchMonitors().then(() => fetchMonitorHistory());
  }
});

onMounted(() => {
  fetchLiveOffers();
});

onUnmounted(() => {
  if (liveAutoRefreshTimer) clearInterval(liveAutoRefreshTimer);
  if (monitorAutoRefreshTimer) clearInterval(monitorAutoRefreshTimer);
  if (chartInstance) chartInstance.destroy();
});
</script>
