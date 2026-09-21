import { AuditSnapshot } from './audit-snapshot.domain.js';

/**
 * Resultado del cálculo de métricas sobre un conjunto de snapshots de auditoría.
 */
export interface MonitorMetricsResult {
  /** Precio mínimo observado en todo el período histórico */
  historicalMinPrice: number;
  /** Precio promedio observado en todo el período histórico */
  historicalAvgPrice: number;
  /** Precio máximo observado en todo el período histórico */
  historicalMaxPrice: number;
  /** Precio mínimo del snapshot más reciente */
  currentMinPrice: number;
  /** Precio promedio del snapshot más reciente */
  currentAvgPrice: number;
  /** Precio máximo del snapshot más reciente */
  currentMaxPrice: number;
  /** Cantidad total de ofertas no promocionadas en el período */
  offerCount: number;
  /** Cantidad de anuncios promocionados detectados y excluidos del cálculo */
  promotedCount: number;
  /** Timestamp ISO del snapshot más reciente, o null si no hay snapshots */
  latestTimestamp: string | null;
}

/**
 * Objeto de Dominio responsable de calcular métricas de precio sobre
 * un conjunto de snapshots de auditoría.
 *
 * Regla de negocio: los anuncios promocionados (isPromoted === true)
 * se excluyen de todos los cálculos de precio pero se contabilizan
 * en `promotedCount`.
 */
export class MonitorMetrics {
  /**
   * Calcula las métricas sobre los snapshots provistos.
   * Los snapshots se ordenan cronológicamente internamente.
   *
   * @param snapshots Lista de AuditSnapshot del período a evaluar
   */
  static calculate(snapshots: AuditSnapshot[]): MonitorMetricsResult {
    if (snapshots.length === 0) {
      return {
        historicalMinPrice: 0,
        historicalAvgPrice: 0,
        historicalMaxPrice: 0,
        currentMinPrice: 0,
        currentAvgPrice: 0,
        currentMaxPrice: 0,
        offerCount: 0,
        promotedCount: 0,
        latestTimestamp: null,
      };
    }

    // Ordenar cronológicamente para identificar el snapshot más reciente
    const sorted = [...snapshots].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const latestSnapshot = sorted[sorted.length - 1];

    let historicalMinPrice = Infinity;
    let historicalMaxPrice = -Infinity;
    let totalPriceSum = 0;
    let totalOffersCount = 0;

    let currentMinPrice = Infinity;
    let currentMaxPrice = -Infinity;
    let currentTotalPriceSum = 0;
    let currentOffersCount = 0;

    let promotedCount = 0;

    for (const snap of sorted) {
      const isLatest = snap === latestSnapshot;

      for (const offer of snap.records ?? []) {
        if (offer.isPromoted) {
          promotedCount += 1;
          continue; // Excluir de los cálculos de precio
        }

        const price = offer.price;
        if (!Number.isFinite(price) || price <= 0) continue;

        if (price < historicalMinPrice) historicalMinPrice = price;
        if (price > historicalMaxPrice) historicalMaxPrice = price;
        totalPriceSum += price;
        totalOffersCount += 1;

        if (isLatest) {
          if (price < currentMinPrice) currentMinPrice = price;
          if (price > currentMaxPrice) currentMaxPrice = price;
          currentTotalPriceSum += price;
          currentOffersCount += 1;
        }
      }
    }

    return {
      historicalMinPrice:
        historicalMinPrice === Infinity ? 0 : historicalMinPrice,
      historicalAvgPrice:
        totalOffersCount > 0 ? totalPriceSum / totalOffersCount : 0,
      historicalMaxPrice:
        historicalMaxPrice === -Infinity ? 0 : historicalMaxPrice,
      currentMinPrice: currentMinPrice === Infinity ? 0 : currentMinPrice,
      currentAvgPrice:
        currentOffersCount > 0 ? currentTotalPriceSum / currentOffersCount : 0,
      currentMaxPrice: currentMaxPrice === -Infinity ? 0 : currentMaxPrice,
      offerCount: totalOffersCount,
      promotedCount,
      latestTimestamp: latestSnapshot.timestamp,
    };
  }
}
