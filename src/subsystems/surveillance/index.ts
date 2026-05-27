/**
 * OCTANE v6 - Surveillance subsystem
 * Codename: SENTINEL
 */

import type {
  MapViewState,
  NodeStatus,
  ServerNode,
  ServerRegion,
  SurveillanceAlert,
  SurveillanceSnapshot,
} from '../../types/index.js';

const DEFAULT_MAP_STATE: MapViewState = {
  mode: '2D',
  center: [20, 0],
  zoom: 3,
  bearing: 0,
  pitch: 0,
  activeLayers: ['TRAFFIC', 'WEATHER', 'SERVERS'],
  baseLayer: 'DARK',
};

const SERVER_DEFS: Array<Omit<ServerNode, 'lastHeartbeat' | 'requestsPerMin' | 'uptimePercent'>> = [
  { id: 'us-east-1', name: 'US-EAST-1', country: 'United States', region: 'Virginia, USA', lat: 38.9, lng: -77.0, status: 'NOMINAL', latencyMs: 8, loadPercent: 62, connections: ['ca-central', 'eu-west-1', 'sa-east-1'] },
  { id: 'us-west-1', name: 'US-WEST-1', country: 'United States', region: 'California, USA', lat: 37.7, lng: -122.4, status: 'NOMINAL', latencyMs: 12, loadPercent: 48, connections: ['us-east-1', 'ap-east-1'] },
  { id: 'eu-west-1', name: 'EU-WEST-1', country: 'Ireland', region: 'Dublin, Ireland', lat: 53.3, lng: -6.3, status: 'NOMINAL', latencyMs: 22, loadPercent: 71, connections: ['uk-south-1', 'eu-central', 'eu-north-1'] },
  { id: 'eu-central', name: 'EU-CENTRAL', country: 'Germany', region: 'Frankfurt, Germany', lat: 50.1, lng: 8.7, status: 'NOMINAL', latencyMs: 19, loadPercent: 55, connections: ['eu-west-1', 'me-south-1'] },
  { id: 'ap-east-1', name: 'AP-EAST-1', country: 'Japan', region: 'Tokyo, Japan', lat: 35.7, lng: 139.7, status: 'NOMINAL', latencyMs: 88, loadPercent: 44, connections: ['ap-south-1', 'us-west-1'] },
  { id: 'ap-south-1', name: 'AP-SOUTH-1', country: 'Singapore', region: 'Singapore', lat: 1.35, lng: 103.8, status: 'NOMINAL', latencyMs: 95, loadPercent: 39, connections: ['ap-east-1', 'ap-india-1', 'ap-aus-1'] },
  { id: 'ap-aus-1', name: 'AP-AUS-1', country: 'Australia', region: 'Sydney, Australia', lat: -33.8, lng: 151.2, status: 'DEGRADED', latencyMs: 142, loadPercent: 88, connections: ['ap-south-1'] },
  { id: 'sa-east-1', name: 'SA-EAST-1', country: 'Brazil', region: 'Sao Paulo, Brazil', lat: -23.5, lng: -46.6, status: 'NOMINAL', latencyMs: 110, loadPercent: 31, connections: ['us-east-1', 'af-south-1'] },
  { id: 'af-south-1', name: 'AF-SOUTH-1', country: 'South Africa', region: 'Johannesburg, SA', lat: -26.2, lng: 28.0, status: 'NOMINAL', latencyMs: 180, loadPercent: 22, connections: ['eu-west-1', 'me-south-1'] },
  { id: 'me-south-1', name: 'ME-SOUTH-1', country: 'Bahrain', region: 'Manama, Bahrain', lat: 26.0, lng: 50.5, status: 'NOMINAL', latencyMs: 55, loadPercent: 35, connections: ['eu-central', 'ap-india-1'] },
  { id: 'ca-central', name: 'CA-CENTRAL', country: 'Canada', region: 'Toronto, Canada', lat: 43.7, lng: -79.4, status: 'NOMINAL', latencyMs: 14, loadPercent: 57, connections: ['us-east-1'] },
  { id: 'eu-north-1', name: 'EU-NORTH-1', country: 'Sweden', region: 'Stockholm, Sweden', lat: 59.3, lng: 18.1, status: 'NOMINAL', latencyMs: 28, loadPercent: 41, connections: ['eu-west-1'] },
  { id: 'ap-india-1', name: 'AP-INDIA-1', country: 'India', region: 'Mumbai, India', lat: 19.1, lng: 72.9, status: 'NOMINAL', latencyMs: 78, loadPercent: 66, connections: ['me-south-1', 'ap-south-1'] },
  { id: 'uk-south-1', name: 'UK-SOUTH-1', country: 'United Kingdom', region: 'London, UK', lat: 51.5, lng: -0.12, status: 'NOMINAL', latencyMs: 16, loadPercent: 73, connections: ['eu-west-1', 'eu-central'] },
];

const SERVER_BASELINE = new Map(SERVER_DEFS.map((node) => [node.id, node]));

const LIVE_TELEMETRY_REFRESH_MS = 2_000;
const EXTERNAL_ALERT_REFRESH_MS = 5 * 60_000;
const EXTERNAL_ALERT_FETCH_TIMEOUT_MS = 6_500;

type UsgsFeature = {
  id?: string
  properties?: {
    mag?: number | null
    place?: string
    time?: number
    title?: string
  }
  geometry?: {
    coordinates?: number[]
  }
}

type UsgsFeed = {
  features?: UsgsFeature[]
}

type EonetEvent = {
  id?: string
  title?: string
  categories?: Array<{ id?: string | number; title?: string }>
  geometry?: Array<{
    date?: string
    coordinates?: number[]
  }>
}

type EonetFeed = {
  events?: EonetEvent[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function wrapLongitude(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

function midpointLongitude(a: number, b: number): number {
  let end = b;
  const delta = end - a;
  if (Math.abs(delta) > 180) {
    end += delta > 0 ? -360 : 360;
  }
  return wrapLongitude((a + end) / 2);
}

function resolveEonetType(category: string): SurveillanceAlert['type'] {
  const normalized = category.trim().toLowerCase();
  if (normalized.includes('storm') || normalized.includes('flood') || normalized.includes('wildfire') || normalized.includes('cyclone') || normalized.includes('volcano')) {
    return 'WEATHER';
  }
  if (normalized.includes('earthquake') || normalized.includes('landslide')) return 'SERVICE';
  return 'GEOPOLITICAL';
}

function resolveEonetSeverity(category: string): SurveillanceAlert['severity'] {
  const normalized = category.trim().toLowerCase();
  if (normalized.includes('volcano') || normalized.includes('earthquake') || normalized.includes('wildfire')) return 'CRITICAL';
  if (normalized.includes('storm') || normalized.includes('flood') || normalized.includes('landslide')) return 'WARNING';
  return 'INFO';
}

function resolveEarthquakeSeverity(magnitude: number): SurveillanceAlert['severity'] {
  if (magnitude >= 6.5) return 'EMERGENCY';
  if (magnitude >= 5.5) return 'CRITICAL';
  if (magnitude >= 4.5) return 'WARNING';
  return 'INFO';
}

export class SurveillanceSystem {
  private nodes = new Map<ServerRegion, ServerNode>();
  private alerts: SurveillanceAlert[] = [];
  private mapState: MapViewState = DEFAULT_MAP_STATE;
  private lastTelemetryRefreshAt = 0;
  private externalAlertsCache: SurveillanceAlert[] = [];
  private externalAlertsFetchedAt = 0;
  private externalAlertsInFlight: Promise<void> | null = null;

  constructor() {
    this.initializeNodes();
    this.ensureExternalAlertsFresh();
  }

  private async fetchJsonWithTimeout<T>(url: string): Promise<T | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXTERNAL_ALERT_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          'user-agent': 'octane-surveillance/6.0',
        },
      });
      if (!response.ok) return null;
      return await response.json() as T;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchUsgsEarthquakeAlerts(): Promise<SurveillanceAlert[]> {
    const payload = await this.fetchJsonWithTimeout<UsgsFeed>('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
    if (!payload?.features?.length) return [];

    const alerts: SurveillanceAlert[] = [];
    payload.features.slice(0, 20).forEach((feature) => {
      const coordinates = feature.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return;

      const lng = Number(coordinates[0]);
      const lat = Number(coordinates[1]);
      const depthKm = Number(coordinates[2] ?? 10);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const magnitude = Number(feature.properties?.mag ?? 0);
      const place = feature.properties?.place?.trim() || 'Unspecified location';
      const timestamp = Number(feature.properties?.time ?? Date.now());
      const id = feature.id ? `usgs-${feature.id}` : `usgs-${Math.round(timestamp)}-${Math.round(lat * 100)}`;

      alerts.push({
        id,
        type: 'SERVICE',
        severity: resolveEarthquakeSeverity(Number.isFinite(magnitude) ? magnitude : 0),
        title: `USGS Earthquake M${(Number.isFinite(magnitude) ? magnitude : 0).toFixed(1)} · ${place}`,
        description: `USGS confirmed seismic event. Depth ${Math.max(0, depthKm).toFixed(1)} km.`,
        location: {
          lat,
          lng,
          radius: Math.round(clamp(85_000 + (Math.max(0, magnitude) * 42_000), 90_000, 420_000)),
        },
        timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
        resolved: false,
      });
    });

    return alerts;
  }

  private async fetchEonetAlerts(): Promise<SurveillanceAlert[]> {
    const payload = await this.fetchJsonWithTimeout<EonetFeed>('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=30');
    if (!payload?.events?.length) return [];

    const alerts: SurveillanceAlert[] = [];
    payload.events.forEach((event) => {
      const latestGeometry = event.geometry?.at(-1);
      const coordinates = latestGeometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return;

      const lng = Number(coordinates[0]);
      const lat = Number(coordinates[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const primaryCategory = event.categories?.[0]?.title ?? 'Natural Event';
      const categoryLabel = primaryCategory.trim() || 'Natural Event';
      const timestamp = latestGeometry?.date ? new Date(latestGeometry.date).getTime() : Date.now();
      const id = event.id ? `eonet-${event.id}` : `eonet-${Math.round(timestamp)}-${Math.round(lng * 100)}`;

      alerts.push({
        id,
        type: resolveEonetType(categoryLabel),
        severity: resolveEonetSeverity(categoryLabel),
        title: `NASA EONET · ${event.title ?? categoryLabel}`,
        description: `Open natural event (${categoryLabel}) tracked by NASA EONET.`,
        location: {
          lat,
          lng,
          radius: 210_000,
        },
        timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
        resolved: false,
      });
    });

    return alerts;
  }

  private ensureExternalAlertsFresh(): void {
    const now = Date.now();
    if (this.externalAlertsInFlight) return;
    if ((now - this.externalAlertsFetchedAt) < EXTERNAL_ALERT_REFRESH_MS) return;

    this.externalAlertsInFlight = (async () => {
      const [usgsResult, eonetResult] = await Promise.allSettled([
        this.fetchUsgsEarthquakeAlerts(),
        this.fetchEonetAlerts(),
      ]);

      const next = [
        ...(usgsResult.status === 'fulfilled' ? usgsResult.value : []),
        ...(eonetResult.status === 'fulfilled' ? eonetResult.value : []),
      ]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 48);

      this.externalAlertsCache = next;
      this.externalAlertsFetchedAt = Date.now();
    })().finally(() => {
      this.externalAlertsInFlight = null;
    });
  }

  private initializeNodes(): void {
    const baseNow = Date.now();
    SERVER_DEFS.forEach((definition) => {
      this.nodes.set(definition.id, {
        ...definition,
        requestsPerMin: 20_000 + Math.floor(Math.random() * 30_000),
        uptimePercent: definition.status === 'NOMINAL' ? 99.9 : 97.2,
        lastHeartbeat: baseNow,
      });
    });
  }

  private refreshLiveTelemetry(): void {
    const now = Date.now();
    if (now - this.lastTelemetryRefreshAt < LIVE_TELEMETRY_REFRESH_MS) return;
    this.lastTelemetryRefreshAt = now;

    this.nodes.forEach((node, id) => {
      const baseline = SERVER_BASELINE.get(id);
      if (!baseline) return;

      const wave = Math.sin((now / 42_000) + (baseline.lat / 12) + (baseline.lng / 30));
      const pulse = Math.cos((now / 73_000) + (baseline.lng / 18));
      const statusLoadBoost = node.status === 'DEGRADED' ? 12 : node.status === 'CRITICAL' ? 24 : node.status === 'OFFLINE' ? 35 : 0;
      const statusLatencyBoost = node.status === 'DEGRADED' ? 18 : node.status === 'CRITICAL' ? 46 : node.status === 'OFFLINE' ? 90 : 0;

      node.loadPercent = clamp(Math.round(baseline.loadPercent + (wave * 9) + (pulse * 4) + statusLoadBoost), 1, 99);
      node.latencyMs = clamp(Math.round(baseline.latencyMs + (wave * 10) + (node.loadPercent * 0.48) + statusLatencyBoost), 6, 340);
      node.requestsPerMin = Math.round(clamp(16_000 + (node.loadPercent * 460) + (Math.max(0, pulse) * 4_500), 7_500, 94_000));
      node.uptimePercent = clamp(
        Number((node.status === 'NOMINAL' ? 99.8 : node.status === 'DEGRADED' ? 98.4 : node.status === 'CRITICAL' ? 96.2 : 91.5).toFixed(1)),
        90,
        99.99,
      );
      node.lastHeartbeat = now - Math.round((1 - Math.max(0, pulse)) * (node.status === 'CRITICAL' ? 140_000 : 45_000));

      this.nodes.set(id, node);
    });
  }

  private severityFromPressure(pressure: number): SurveillanceAlert['severity'] {
    if (pressure >= 0.94) return 'EMERGENCY';
    if (pressure >= 0.78) return 'CRITICAL';
    if (pressure >= 0.56) return 'WARNING';
    return 'INFO';
  }

  private createDerivedAlert(
    id: string,
    type: SurveillanceAlert['type'],
    severity: SurveillanceAlert['severity'],
    title: string,
    description: string,
    location: { lat: number; lng: number; radius: number },
    serverId?: ServerRegion,
  ): SurveillanceAlert {
    return {
      id,
      type,
      severity,
      title,
      description,
      location,
      serverId,
      timestamp: Date.now(),
      resolved: false,
    };
  }

  private getDerivedAlerts(): SurveillanceAlert[] {
    const now = Date.now();
    const nodes = Array.from(this.nodes.values());
    const derivedAlerts: SurveillanceAlert[] = [];
    for (const node of nodes) {
      const utilization = clamp((node.loadPercent / 100) * 0.56 + (node.latencyMs / 260) * 0.44, 0, 1);

      if (node.status === 'CRITICAL' || node.status === 'OFFLINE') {
        const id = `derived-node-critical-${node.id}`;
        derivedAlerts.push(this.createDerivedAlert(
          id,
          'SERVICE',
          node.status === 'OFFLINE' ? 'EMERGENCY' : 'CRITICAL',
          `${node.name} service disruption`,
          `${node.region} node is in ${node.status.toLowerCase()} state with elevated infrastructure risk.`,
          { lat: node.lat, lng: node.lng, radius: 180_000 },
          node.id,
        ));
      }

      if (node.loadPercent >= 84 || node.latencyMs >= 140) {
        const pressure = clamp(utilization + (node.loadPercent >= 90 ? 0.2 : 0), 0, 1);
        const id = `derived-node-traffic-${node.id}`;
        derivedAlerts.push(this.createDerivedAlert(
          id,
          'TRAFFIC',
          this.severityFromPressure(pressure),
          `${node.region} traffic saturation`,
          `Live throughput is elevated at ${node.requestsPerMin.toLocaleString()} rpm with ${node.latencyMs} ms latency.`,
          { lat: node.lat, lng: node.lng, radius: 160_000 },
          node.id,
        ));
      }

      const heartbeatAge = now - node.lastHeartbeat;
      if (heartbeatAge >= 95_000) {
        const pressure = clamp((heartbeatAge - 95_000) / 140_000, 0, 1);
        const id = `derived-node-heartbeat-${node.id}`;
        derivedAlerts.push(this.createDerivedAlert(
          id,
          'SERVICE',
          this.severityFromPressure(0.52 + pressure * 0.4),
          `${node.region} service heartbeat drift`,
          `Signal heartbeat is delayed by ${Math.round(heartbeatAge / 1000)} seconds.`,
          { lat: node.lat, lng: node.lng, radius: 140_000 },
          node.id,
        ));
      }
    }

    const visitedEdges = new Set<string>();
    for (const node of nodes) {
      for (const targetId of node.connections) {
        const target = this.nodes.get(targetId);
        if (!target) continue;

        const edgeId = node.id < target.id ? `${node.id}|${target.id}` : `${target.id}|${node.id}`;
        if (visitedEdges.has(edgeId)) continue;
        visitedEdges.add(edgeId);

        const avgLoad = (node.loadPercent + target.loadPercent) / 2;
        const avgLatency = (node.latencyMs + target.latencyMs) / 2;
        const pressure = clamp((avgLoad / 100) * 0.52 + (avgLatency / 240) * 0.48, 0, 1);

        if (pressure < 0.62) continue;

        const id = `derived-route-pressure-${edgeId}`;
        derivedAlerts.push(this.createDerivedAlert(
          id,
          'TRAFFIC',
          this.severityFromPressure(pressure),
          `${node.name} ↔ ${target.name} route pressure`,
          `Inter-region route utilization at ${Math.round(avgLoad)}% with ${Math.round(avgLatency)} ms average latency.`,
          {
            lat: (node.lat + target.lat) / 2,
            lng: midpointLongitude(node.lng, target.lng),
            radius: 210_000,
          },
          node.id,
        ));
      }
    }

    return derivedAlerts;
  }

  getSnapshot(): SurveillanceSnapshot {
    this.refreshLiveTelemetry();
    const nodes = Array.from(this.nodes.values());
    const totalNodes = nodes.length;
    const totalLatency = nodes.reduce((sum, node) => sum + node.latencyMs, 0);

    return {
      timestamp: Date.now(),
      totalNodes,
      onlineNodes: nodes.filter((node) => node.status === 'NOMINAL').length,
      degradedNodes: nodes.filter((node) => node.status === 'DEGRADED').length,
      criticalNodes: nodes.filter((node) => node.status === 'CRITICAL').length,
      offlineNodes: nodes.filter((node) => node.status === 'OFFLINE').length,
      globalLatencyMs: totalNodes > 0 ? Math.round(totalLatency / totalNodes) : 0,
      totalRequestsPerMin: nodes.reduce((sum, node) => sum + node.requestsPerMin, 0),
      activeAlerts: this.getUnifiedAlerts(true).length,
      mapState: this.mapState,
    };
  }

  getNode(id: ServerRegion): ServerNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): ServerNode[] {
    this.refreshLiveTelemetry();
    return Array.from(this.nodes.values());
  }

  setNodeStatus(id: ServerRegion, status: NodeStatus): void {
    const node = this.nodes.get(id);
    if (!node) return;

    node.status = status;
    node.lastHeartbeat = Date.now();
    this.nodes.set(id, node);
  }

  addAlert(alert: Omit<SurveillanceAlert, 'id' | 'timestamp' | 'resolved'>): string {
    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.alerts.push({ ...alert, id, timestamp: Date.now(), resolved: false });
    return id;
  }

  resolveAlert(id: string): boolean {
    const alert = this.alerts.find((entry) => entry.id === id);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = Date.now();
    return true;
  }

  getAlerts(onlyActive = true): SurveillanceAlert[] {
    return onlyActive ? this.alerts.filter((alert) => !alert.resolved) : [...this.alerts];
  }

  getUnifiedAlerts(onlyActive = true): SurveillanceAlert[] {
    this.refreshLiveTelemetry();
    this.ensureExternalAlertsFresh();
    const manualAlerts = this.getAlerts(onlyActive);
    const derivedAlerts = this.getDerivedAlerts();
    const externalAlerts = onlyActive
      ? this.externalAlertsCache.filter((alert) => !alert.resolved)
      : [...this.externalAlertsCache];

    return [...manualAlerts, ...derivedAlerts, ...externalAlerts]
      .sort((a, b) => {
        const rank = { EMERGENCY: 4, CRITICAL: 3, WARNING: 2, INFO: 1 };
        return (rank[b.severity] - rank[a.severity]) || (b.timestamp - a.timestamp);
      });
  }

  updateMapState(partial: Partial<MapViewState>): void {
    this.mapState = { ...this.mapState, ...partial };
  }

  heartbeat(id: ServerRegion): void {
    const node = this.nodes.get(id);
    if (!node) return;

    node.lastHeartbeat = Date.now();
    node.loadPercent = Math.min(99, Math.max(1, node.loadPercent + Math.round((Math.random() - 0.5) * 5)));
    this.nodes.set(id, node);
  }
}

export default SurveillanceSystem;