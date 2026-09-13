import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { api, clearAuthToken } from '../../../src/api/client';

const REFRESH_INTERVAL = 30_000;
const DEFAULT_CENTER = { latitude: 9.787, longitude: 125.4928 };
const hasValidCoordinates = (item) => {
  const latitude = Number(item?.latitude);
  const longitude = Number(item?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};
const MAP_HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{width:100%;height:100%;min-height:260px;margin:0;background:#e8eee9}.leaflet-container{font-family:Arial,sans-serif}.pin{width:30px;height:30px;border:3px solid #fff;border-radius:50% 50% 50% 0;box-shadow:0 2px 7px #0005;transform:rotate(-45deg)}.pin span{display:block;color:#fff;font-size:13px;line-height:24px;text-align:center;transform:rotate(45deg)}</style>
</head><body><div id="map"></div>
<script>
 function post(message){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(message));}
 function mapError(message){post({type:'mapError',message:String(message||'Unknown map error')});}
 window.onerror=function(message,source,line,column,error){mapError(error&&error.message?error.message:message);return false;};
 window.addEventListener('unhandledrejection',function(event){mapError(event.reason&&event.reason.message?event.reason.message:event.reason);});
</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="mapError('Leaflet failed to load from the CDN')"></script>
<script>
document.addEventListener('DOMContentLoaded',function(){
 try {
  if(!window.L)throw new Error('Leaflet is unavailable');
  var map=L.map('map').setView([9.7870,125.4928],13),markers={},zones={},routeLayer=null,initialized=false;
  var cluster=typeof L.markerClusterGroup==='function'?L.markerClusterGroup({showCoverageOnHover:false}):L.layerGroup();
  cluster.addTo(map);
  var colors={active:'#17843f',on_break:'#d99a08',offline:'#dc2626',maintenance:'#2563eb'};
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:19}).addTo(map);
  function valid(lat,lng){return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180;}
  function icon(status){var color=colors[status]||'#6b7280';return L.divIcon({className:'',html:'<div class="pin" style="background:'+color+'"><span>&#128666;</span></div>',iconSize:[30,30],iconAnchor:[15,30]});}
  window.updateTrucks=function(payload){
   var seen={};(payload.trucks||[]).forEach(function(truck){var lat=Number(truck.latitude),lng=Number(truck.longitude);if(!valid(lat,lng))return;
    seen[truck.id]=true;if(markers[truck.id])markers[truck.id].setLatLng([lat,lng]).setIcon(icon(truck.status));else{markers[truck.id]=L.marker([lat,lng],{icon:icon(truck.status)});cluster.addLayer(markers[truck.id]);}
    markers[truck.id].bindTooltip(String(truck.code||''),{direction:'top',offset:[0,-25]});
   });Object.keys(markers).forEach(function(id){if(!seen[id]){cluster.removeLayer(markers[id]);delete markers[id];}});
   var center=payload.center||{};var centerLat=Number(center.latitude),centerLng=Number(center.longitude);if(!initialized&&valid(centerLat,centerLng)){map.setView([centerLat,centerLng],Number(payload.zoom)||13);initialized=true;}
  };
  window.updateZones=function(items,selected){var seen={};(items||[]).forEach(function(zone,index){var lat=Number(zone.latitude),lng=Number(zone.longitude);if(!valid(lat,lng))return;
   seen[zone.id]=true;var color='hsl('+((index*60)%360)+',70%,45%)';if(!zones[zone.id])zones[zone.id]=L.circle([lat,lng],{radius:600,color:color,fillColor:color,weight:1}).addTo(map);
   var active=String(zone.id)===String(selected);zones[zone.id].setStyle({fillOpacity:active ? 0.3 : 0.1,opacity:active ? 0.6 : 0.3});
  });Object.keys(zones).forEach(function(id){if(!seen[id]){map.removeLayer(zones[id]);delete zones[id];}});if(selected&&zones[selected])map.setView(zones[selected].getLatLng(),14);};
  window.focusTruck=function(id){if(markers[id]){map.setView(markers[id].getLatLng(),15);markers[id].openTooltip();}};
  window.showRoute=function(points){if(routeLayer)map.removeLayer(routeLayer);var validPoints=(points||[]).map(function(p){return[Number(p.latitude),Number(p.longitude)];}).filter(function(p){return valid(p[0],p[1]);});if(!validPoints.length)return;routeLayer=L.polyline(validPoints,{color:'#2563eb',weight:4,opacity:.7}).addTo(map);map.fitBounds(routeLayer.getBounds(),{padding:[30,30]});};
  setTimeout(function(){map.invalidateSize();post({type:'map_ready'});},0);
 } catch(error){mapError(error&&error.message?error.message:error);}
});
</script></body></html>`;

const STATUS_COLORS = {
  active: { background: '#dcfce7', text: '#15803d' },
  on_break: { background: '#fef3c7', text: '#a16207' },
  offline: { background: '#fee2e2', text: '#b91c1c' },
  maintenance: { background: '#dbeafe', text: '#1d4ed8' },
};

export default function TrackerScreen() {
  const router = useRouter();
  const webView = useRef(null);
  const [trucks, setTrucks] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [countdown, setCountdown] = useState(30);
  const [routeLoading, setRouteLoading] = useState(null);
  const [mapConfig, setMapConfig] = useState({ center: DEFAULT_CENTER, zoom: 13 });
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [mapKey, setMapKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadTrucks = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    setError(null);
    try {
      const { data } = await api.get('/trucks');
      setTrucks(Array.isArray(data.trucks) ? data.trucks : []);
      setZones(Array.isArray(data.zones) ? data.zones : []);
      setMapConfig({ center: data.map?.center ?? DEFAULT_CENTER, zoom: data.map?.zoom ?? 13 });
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await clearAuthToken();
        router.replace('/login');
      } else setError('Unable to load truck locations. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(30);
    }
  }, [router]);

  useFocusEffect(useCallback(() => {
    loadTrucks();
    setCountdown(REFRESH_INTERVAL / 1000);
    const pollingInterval = setInterval(loadTrucks, REFRESH_INTERVAL);
    const countdownInterval = setInterval(() => setCountdown((seconds) => seconds <= 1 ? REFRESH_INTERVAL / 1000 : seconds - 1), 1000);
    return () => {
      clearInterval(pollingInterval);
      clearInterval(countdownInterval);
    };
  }, [loadTrucks]));

  useEffect(() => {
    if (!mapReady) return;
    const validTrucks = trucks.filter(hasValidCoordinates).map((truck) => ({ ...truck, latitude: Number(truck.latitude), longitude: Number(truck.longitude) }));
    const validZones = zones.filter(hasValidCoordinates).map((zone) => ({ ...zone, latitude: Number(zone.latitude), longitude: Number(zone.longitude) }));
    const center = hasValidCoordinates(mapConfig.center) ? mapConfig.center : DEFAULT_CENTER;
    webView.current?.injectJavaScript(`window.updateTrucks(${JSON.stringify({ trucks: validTrucks, center, zoom: mapConfig.zoom })});true;`);
    webView.current?.injectJavaScript(`window.updateZones(${JSON.stringify(validZones)},${JSON.stringify(selectedZone)});true;`);
  }, [mapReady, mapConfig, selectedZone, trucks, zones]);

  useEffect(() => {
    if (mapReady || mapError) return undefined;
    const timeout = setTimeout(() => setMapError('Leaflet did not initialize within 15 seconds.'), 15_000);
    return () => clearTimeout(timeout);
  }, [mapError, mapKey, mapReady]);

  const statuses = useMemo(() => [...new Set(trucks.map((truck) => truck.status))], [trucks]);
  const filteredTrucks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return trucks.filter((truck) => (status === 'all' || truck.status === status) && (!term || [truck.code, truck.driver, truck.route].some((value) => String(value ?? '').toLowerCase().includes(term))));
  }, [search, status, trucks]);
  const activeCount = trucks.filter((truck) => truck.status === 'active').length;

  const showRoute = async (truck) => {
    setRouteLoading(truck.id);
    try {
      const { data } = await api.get(`/trucks/${truck.id}/route-history`);
      const points = Array.isArray(data.locations) ? data.locations : [];
      webView.current?.injectJavaScript(`window.showRoute(${JSON.stringify(points)});true;`);
    } catch {
      setError('Unable to load this truck’s route history.');
    } finally { setRouteLoading(null); }
  };

  const focusTruck = (truck) => {
    if (truck.latitude == null || truck.longitude == null) return;
    webView.current?.injectJavaScript(`window.focusTruck(${JSON.stringify(truck.id)});true;`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTrucks({ refresh: true })} colors={['#17843f']} />}>
      <Text style={styles.title}>Truck Tracker</Text>
      <Text style={styles.subtitle}>View garbage trucks and their latest reported locations.</Text>
      <View style={styles.summary}><View><Text style={styles.summaryLabel}>ACTIVE TRUCKS</Text><Text style={styles.summaryCount}>{activeCount}</Text></View><FontAwesome5 name="truck-moving" color="#17843f" size={30} /></View>
      <TextInput style={styles.search} value={search} onChangeText={setSearch} placeholder="Search by truck, driver, route..." />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {['all', ...statuses].map((value) => <TouchableOpacity key={value} style={[styles.chip, status === value && styles.chipActive]} onPress={() => setStatus(value)}><Text style={[styles.chipText, status === value && styles.chipTextActive]}>{value === 'all' ? 'All statuses' : value.replace('_', ' ')}</Text></TouchableOpacity>)}
      </ScrollView>
      {zones.length ? <><Text style={styles.zoneLabel}>Highlight a service zone</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <TouchableOpacity style={[styles.chip, selectedZone == null && styles.chipActive]} onPress={() => setSelectedZone(null)}><Text style={[styles.chipText, selectedZone == null && styles.chipTextActive]}>Clear</Text></TouchableOpacity>
        {zones.map((zone) => <TouchableOpacity key={zone.id} style={[styles.chip, selectedZone === zone.id && styles.chipActive]} onPress={() => setSelectedZone(zone.id)}><Text style={[styles.chipText, selectedZone === zone.id && styles.chipTextActive]}>{zone.name}</Text></TouchableOpacity>)}
      </ScrollView></> : null}
      <View style={styles.liveRow}><Text style={styles.liveText}>● Live updating · Refresh in {countdown}s</Text><TouchableOpacity onPress={() => loadTrucks({ refresh: true })}><Text style={styles.refreshButton}>Refresh now</Text></TouchableOpacity></View>
      <View style={styles.mapFrame}>
        <WebView key={mapKey} ref={webView} style={styles.map} source={{ html: MAP_HTML, baseUrl: 'https://localhost/' }} originWhitelist={['https://*']} javaScriptEnabled domStorageEnabled nestedScrollEnabled
          onMessage={(event) => { try { const message = JSON.parse(event.nativeEvent.data); if (message.type === 'map_ready') { setMapReady(true); setMapError(null); } else if (message.type === 'mapError') { setMapReady(false); setMapError(message.message || 'Unknown map error'); } } catch { setMapError('The map returned an unreadable error.'); } }}
          onError={(event) => { setMapReady(false); setMapError(event.nativeEvent.description || 'The map WebView could not load.'); }} />
        {!mapReady && !mapError ? <View style={styles.mapState}><ActivityIndicator color="#17843f" /><Text style={styles.mapStateText}>Loading map...</Text></View> : null}
        {mapError ? <View style={styles.mapState}><Text style={styles.mapStateText}>Map unavailable: {mapError}</Text><TouchableOpacity style={styles.mapRetry} onPress={() => { setMapError(null); setMapReady(false); setMapKey((key) => key + 1); }}><Text style={styles.mapRetryText}>Retry Map</Text></TouchableOpacity></View> : null}
      </View>
      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Active Trucks</Text><Text style={styles.refreshNote}>{filteredTrucks.length} shown · {trucks.length} total</Text></View>
      {loading ? <ActivityIndicator color="#17843f" size="large" /> : null}
      {error ? <View style={styles.stateCard}><Text style={styles.stateText}>{error}</Text></View> : null}
      {!loading && !error && trucks.length === 0 ? <View style={styles.stateCard}><Text style={styles.stateText}>No trucks are available.</Text></View> : null}
      {!loading && !error && trucks.length > 0 && filteredTrucks.length === 0 ? <View style={styles.stateCard}><Text style={styles.stateText}>No trucks match your filters.</Text></View> : null}
      {filteredTrucks.map((truck) => {
        const badge = STATUS_COLORS[truck.status] ?? { background: '#f3f4f6', text: '#4b5563' };
        const located = truck.latitude != null && truck.longitude != null;
        return (
          <TouchableOpacity key={truck.id} style={styles.truckCard} activeOpacity={located ? 0.75 : 1} onPress={() => focusTruck(truck)}>
            <View style={styles.truckHeader}>
              <View style={styles.truckIcon}><FontAwesome5 name="truck" color="#fff" size={17} /></View>
              <View style={styles.truckHeading}><Text style={styles.truckCode}>{truck.code}</Text><Text style={styles.driver}>{truck.driver || 'Driver not assigned'}</Text></View>
              <View style={[styles.badge, { backgroundColor: badge.background }]}><Text style={[styles.badgeText, { color: badge.text }]}>{truck.formatted_status}</Text></View>
            </View>
            <Text style={styles.route}><FontAwesome5 name="route" size={12} /> {truck.route || 'Route not assigned'}</Text>
            <Text style={located ? styles.onMap : styles.noLocation}><FontAwesome5 name="map-marker-alt" size={12} /> {located ? 'On map' : 'No location'}</Text>
            <Text style={styles.updated}>Last updated: {truck.last_updated_human || 'Never'}</Text>
            {located ? <View style={styles.actions}><TouchableOpacity style={styles.action} onPress={() => focusTruck(truck)}><Text style={styles.actionText}>Focus</Text></TouchableOpacity><TouchableOpacity style={styles.action} disabled={routeLoading === truck.id} onPress={() => showRoute(truck)}><Text style={styles.routeAction}>{routeLoading === truck.id ? 'Loading...' : 'Route'}</Text></TouchableOpacity></View> : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f7' }, content: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' }, subtitle: { marginTop: 7, marginBottom: 18, fontSize: 15, lineHeight: 21, color: '#667085' },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#d7eadc', backgroundColor: '#fff', marginBottom: 14 }, summaryLabel: { color: '#667085', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }, summaryCount: { color: '#17843f', fontSize: 28, fontWeight: '800', marginTop: 2 },
  search: { height: 48, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 24, backgroundColor: '#fff', paddingHorizontal: 16, color: '#111827' }, chips: { gap: 8, paddingVertical: 11 }, chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' }, chipActive: { backgroundColor: '#17843f', borderColor: '#17843f' }, chipText: { color: '#59635e', fontSize: 12, textTransform: 'capitalize' }, chipTextActive: { color: '#fff', fontWeight: '700' }, zoneLabel: { color: '#374151', fontSize: 13, fontWeight: '700', marginTop: 4 },
  liveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 10 }, liveText: { color: '#17843f', fontSize: 12 }, refreshButton: { color: '#17843f', fontSize: 12, fontWeight: '700' },
  mapFrame: { height: 260, borderRadius: 16, overflow: 'hidden', backgroundColor: '#e8eee9', borderWidth: 1, borderColor: '#dce4df', marginBottom: 24 }, map: { flex: 1, backgroundColor: '#e8eee9' },
  mapState: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e8eee9' }, mapStateText: { color: '#52665a', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  mapRetry: { marginTop: 4, borderWidth: 1, borderColor: '#17843f', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }, mapRetryText: { color: '#17843f', fontSize: 12, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' }, refreshNote: { fontSize: 11, color: '#8a9390' },
  truckCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e9e7', marginBottom: 13 }, truckHeader: { flexDirection: 'row', alignItems: 'center' }, truckIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#17843f', alignItems: 'center', justifyContent: 'center' },
  truckHeading: { flex: 1, marginLeft: 10 }, truckCode: { fontSize: 16, fontWeight: '800', color: '#111827' }, driver: { fontSize: 12, color: '#667085', marginTop: 2 }, badge: { borderRadius: 16, paddingHorizontal: 9, paddingVertical: 5 }, badgeText: { fontSize: 11, fontWeight: '700' },
  route: { color: '#4b5563', fontSize: 13, marginTop: 13 }, onMap: { color: '#17843f', fontSize: 12, marginTop: 8 }, updated: { color: '#8a9390', fontSize: 11, marginTop: 5 }, noLocation: { color: '#9a3412', fontSize: 12, marginTop: 8 }, actions: { flexDirection: 'row', gap: 9, marginTop: 12 }, action: { flex: 1, height: 38, borderWidth: 1, borderColor: '#d9dedb', borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, actionText: { color: '#17843f', fontWeight: '700', fontSize: 12 }, routeAction: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  stateCard: { padding: 20, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', marginBottom: 13 }, stateText: { color: '#667085', textAlign: 'center' },
});
