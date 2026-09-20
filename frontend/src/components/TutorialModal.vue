<template>
  <div class="settings-overlay" @click.self="$emit('close')">
    <section class="settings-panel tutorial-panel" role="dialog">
      <header class="settings-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="tutorial-icon-badge">
            <HelpCircleIcon :size="22" />
          </div>
          <div>
            <h2 class="card-title">Tutorial y Guía del Usuario</h2>
            <p class="settings-subtitle">Aprende a utilizar el monitor P2P de Binance y entiende cada uno de sus campos.</p>
          </div>
        </div>
        <button class="btn-tab" type="button" @click="$emit('close')">Cerrar</button>
      </header>

      <!-- Tutorial Navigation Tabs -->
      <nav class="btn-group" style="padding: 2px;">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="btn-tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- TAB 1: Visión General -->
      <div v-if="activeTab === 'overview'" class="tutorial-content">
        <div class="tutorial-card">
          <div class="tutorial-card-header">
            <ZapIcon :size="18" class="text-gold" />
            <h3>⚡ Módulo 1: Ofertas al Instante</h3>
          </div>
          <p>
            Realiza consultas directas y en tiempo real a la API oficial de Binance P2P. Es ideal cuando deseas verificar precios, comerciantes disponibles o métodos de pago al momento sin guardar registros en disco.
          </p>
        </div>

        <div class="tutorial-card">
          <div class="tutorial-card-header">
            <TrendingUpIcon :size="18" class="text-green" />
            <h3>📊 Módulo 2: Monitoreo & Gráficas</h3>
          </div>
          <p>
            Permite crear tareas automáticas periódicas (Crons) que consultan el mercado a intervalos configurables (ej. cada 60s). Almacena snapshots con historial auditado, cálculo de precios mínimos/promedios/máximos y gráficas de tendencia.
          </p>
        </div>
      </div>

      <!-- TAB 2: Explicación de Campos -->
      <div v-else-if="activeTab === 'fields'" class="tutorial-content">
        <div class="fields-guide-list">
          <div v-for="field in fieldsList" :key="field.title" class="field-guide-item">
            <div class="field-guide-title">
              <span class="field-badge">{{ field.badge }}</span>
              <h4>{{ field.title }}</h4>
            </div>
            <p class="field-guide-desc">{{ field.description }}</p>
            <div v-if="field.tip" class="field-guide-tip">
              💡 <strong>Tip:</strong> {{ field.tip }}
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: Consejos & Tips -->
      <div v-else-if="activeTab === 'tips'" class="tutorial-content">
        <div class="tutorial-card border-gold">
          <h3>⚡ Optimización de Búsqueda de Montos</h3>
          <p>
            Cuando buscas ofertas pequeñas (ej. 500 Bs), los primeros resultados de Binance P2P suelen ser comerciantes de alto volumen con mínimos de 10,000 Bs o más. 
          </p>
          <p style="margin-top: 8px;">
            Al configurar <strong>Monto API</strong> en 500 Bs, el sistema le indica directamente a la API de Binance que devuelva solo ofertas que acepten operaciones por esa cantidad, garantizando respuestas instantáneas.
          </p>
        </div>

        <div class="tutorial-card">
          <h3>🛡️ Auditoría Transparente</h3>
          <p>
            En la sección de monitoreo, cada snapshot incluye un botón de <strong>Detalles del Snapshot</strong> donde puedes ver la URL de solicitud exacta enviada a Binance P2P, la carga útil JSON (payload) y la respuesta bruta con código HTTP.
          </p>
        </div>
      </div>

      <footer class="settings-actions" style="margin-top: auto; justify-content: flex-end;">
        <button class="btn-action" type="button" @click="$emit('close')">Entendido</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  HelpCircle as HelpCircleIcon,
  Zap as ZapIcon,
  TrendingUp as TrendingUpIcon,
} from 'lucide-vue-next';

defineEmits<{
  close: [];
}>();

const activeTab = ref<'overview' | 'fields' | 'tips'>('overview');

const tabs = [
  { id: 'overview', label: 'Visión General' },
  { id: 'fields', label: 'Guía de Campos' },
  { id: 'tips', label: 'Consejos & Tips' },
];

const fieldsList = [
  {
    badge: 'Fiat',
    title: 'Moneda Fiat',
    description: 'Moneda de curso legal utilizada en la transacción (ej. VES para Bolívares venezolanos, COP para Pesos colombianos, ARS, USD, EUR).',
    tip: 'Utiliza siempre el código ISO oficial de 3 letras en mayúsculas.',
  },
  {
    badge: 'Asset',
    title: 'Criptoactivo (Asset)',
    description: 'Criptomoneda a monitorear o comerciar en la plataforma P2P (ej. USDT, BTC, ETH, FDUSD, BNB).',
    tip: 'USDT es el activo de mayor volumen en la mayoría de mercados P2P.',
  },
  {
    badge: 'Operación',
    title: 'Tipo de Operación (BUY / SELL)',
    description: 'BUY representa ofertas de usuarios que están vendiendo cripto (tú compras). SELL representa ofertas de usuarios que están comprando cripto (tú vendes).',
  },
  {
    badge: 'Monto API',
    title: 'Monto a comprar',
    description: 'Monto exacto a comprar enviado en la consulta a la API de Binance P2P. Puedes seleccionar si la cantidad ingresada corresponde a la Moneda Fiat (ej. VES) o al Criptoactivo (ej. USDT).',
    tip: 'Si seleccionas Cripto (USDT), el sistema filtra por los límites mínimos y máximos en cripto de cada oferta y estima la conversión correspondiente.',
  },
  {
    badge: 'Bancos',
    title: 'Métodos de Pago',
    description: 'Lista de bancos o plataformas de pago permitidas en el anuncio (ej. Banesco, Banco de Venezuela, Pago Móvil, Provincial, Mercantil).',
    tip: 'Puedes seleccionar múltiples bancos para ver ofertas que acepten cualquiera de ellos.',
  },
  {
    badge: 'Filas',
    title: 'Ofertas por Consulta',
    description: 'Número de anuncios P2P que se recuperan por cada consulta realizada (valor entre 1 y 100).',
  },
  {
    badge: 'Frecuencia',
    title: 'Frecuencia del Cron',
    description: 'Tiempo en segundos entre cada ejecución automática de la rutina de monitoreo (mínimo 5s, máximo 3600s).',
  },
  {
    badge: 'Retención',
    title: 'Retención de Snapshots',
    description: 'Número de horas que se conservarán los registros históricos y auditorías en el servidor antes de ser depurados automáticamente.',
  },
];
</script>

<style scoped>
.tutorial-panel {
  width: min(640px, 100%);
}

.tutorial-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(240, 185, 11, 0.15);
  color: var(--accent-binance);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(240, 185, 11, 0.3);
}

.tutorial-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
}

.tutorial-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tutorial-card.border-gold {
  border-color: rgba(240, 185, 11, 0.4);
}

.tutorial-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tutorial-card-header h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.text-gold {
  color: var(--accent-binance);
}

.text-green {
  color: var(--color-green);
}

.fields-guide-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 4px;
}

.field-guide-item {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-guide-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-guide-title h4 {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.field-badge {
  background: rgba(240, 185, 11, 0.15);
  color: var(--accent-binance);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(240, 185, 11, 0.25);
}

.field-guide-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.field-guide-tip {
  font-size: 11px;
  color: var(--text-primary);
  background: rgba(14, 203, 129, 0.1);
  border: 1px solid rgba(14, 203, 129, 0.2);
  padding: 6px 10px;
  border-radius: 4px;
  margin-top: 4px;
}
</style>
