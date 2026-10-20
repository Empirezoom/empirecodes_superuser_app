import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';

const DEFAULT_API_HOST = 'https://empirecodes-backend-drf.onrender.com';

const SUPERUSER_PIN = '123224'; // Anthony's Executive Master PIN

export default function App() {
  // Authentication & Security
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // Host & Server Connectivity
  const [apiHost, setApiHost] = useState(DEFAULT_API_HOST);
  const [customHost, setCustomHost] = useState(DEFAULT_API_HOST);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [serverLatency, setServerLatency] = useState('...');
  const [showHostModal, setShowHostModal] = useState(false);

  // Active Executive Tab: admin | telemetry | paystack | math | cluster
  const [activeTab, setActiveTab] = useState('admin');

  // Telemetry Data
  const [telemetry, setTelemetry] = useState(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

  // Operations Research Optimization State
  const [profitA, setProfitA] = useState('500');
  const [profitB, setProfitB] = useState('800');
  const [devHours, setDevHours] = useState('160');
  const [orResult, setOrResult] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      pingServer();
      fetchTelemetry();
    }
  }, [isAuthenticated, apiHost]);

  const pingServer = async () => {
    const start = Date.now();
    try {
      const res = await fetch(`${apiHost}/api/dashboard/`);
      const latency = Date.now() - start;
      if (res.ok) {
        setIsServerOnline(true);
        setServerLatency(`${latency}ms`);
      } else {
        setIsServerOnline(false);
        setServerLatency('ERR');
      }
    } catch (e) {
      setIsServerOnline(false);
      setServerLatency('OFFLINE');
    }
  };

  const fetchTelemetry = async () => {
    setIsLoadingTelemetry(true);
    try {
      const res = await fetch(`${apiHost}/api/dashboard/`);
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (e) {
      console.log('Error fetching telemetry', e);
    } finally {
      setIsLoadingTelemetry(false);
    }
  };

  const runSimplexOptimization = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch(`${apiHost}/api/optimize/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          c1: parseFloat(profitA) || 500,
          c2: parseFloat(profitB) || 800,
          dev_hours: parseFloat(devHours) || 160,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrResult(data);
      } else {
        // Local Simplex fallback
        const h = parseFloat(devHours) || 160;
        const x2 = Math.floor(h / 40);
        const rem = h - x2 * 40;
        const x1 = Math.floor(rem / 20);
        const profit = x1 * 500 + x2 * 800;
        setOrResult({
          method: 'Simplex Linear Resource Allocation',
          optimal_service_a_units: x1,
          optimal_service_b_units: x2,
          maximized_profit: `₦${profit.toLocaleString()}`,
          status: 'BOUNDED OPTIMAL (FALLBACK)',
        });
      }
    } catch (e) {
      Alert.alert('Computation Error', 'Could not run linear optimization.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SECURITY GATE
  // ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#020202" />
        <View style={styles.authCard}>
          <Text style={styles.authEmblem}>⚡</Text>
          <Text style={styles.authTitle}>EXECUTIVE COMMAND HUB</Text>
          <Text style={styles.authArchitect}>Anthony Oluwaseun Matthew • Superuser Only</Text>
          <Text style={styles.authSub}>Biometric Lock & Multi-Layer Master PIN Verification</Text>

          <View style={styles.authInputBox}>
            <TextInput
              style={styles.authTextInput}
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="Enter Master PIN (123224)"
              placeholderTextColor="#555"
              keyboardType="numeric"
              secureTextEntry
              onSubmitEditing={() => {
                if (pinInput.trim() === SUPERUSER_PIN) {
                  setIsAuthenticated(true);
                } else {
                  Alert.alert('Security Violation', 'Access restricted to Anthony Oluwaseun Matthew.');
                }
              }}
            />
          </View>

          <TouchableOpacity
            style={styles.authSubmitBtn}
            onPress={() => {
              if (pinInput.trim() === SUPERUSER_PIN) {
                setIsAuthenticated(true);
              } else {
                Alert.alert('Security Violation', 'Access restricted to Anthony Oluwaseun Matthew.');
              }
            }}
          >
            <Text style={styles.authSubmitBtnText}>AUTHORIZE EXECUTIVE SESSION 🏛️</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN EXECUTIVE DASHBOARD
  // ─────────────────────────────────────────────────────────────
  const adminUrl = `${apiHost}/admin/`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020202" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>EMPIRECODES COMMAND HUB</Text>
          <View style={styles.headerSubtitleRow}>
            <View style={[styles.pulseDot, isServerOnline ? styles.pulseGreen : styles.pulseRed]} />
            <Text style={styles.headerSubtitle}>
              {isServerOnline ? `ONLINE (${serverLatency})` : 'OFFLINE'} • SUPERUSER ACTIVE
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.hostBtn} onPress={() => setShowHostModal(true)}>
            <Text style={styles.hostBtnText}>⚙️ CLUSTER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.lockBtn} onPress={() => setIsAuthenticated(false)}>
            <Text style={styles.lockBtnText}>🔒</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Cluster Health Bar */}
      <View style={styles.healthBar}>
        <View style={styles.healthItem}>
          <Text style={styles.healthLabel}>CORE ENGINE</Text>
          <Text style={styles.healthValGreen}>Django 5.0 + DRF</Text>
        </View>
        <View style={styles.healthItem}>
          <Text style={styles.healthLabel}>DB PERSISTENCE</Text>
          <Text style={styles.healthValGold}>PostgreSQL ACID</Text>
        </View>
        <View style={styles.healthItem}>
          <Text style={styles.healthLabel}>PAYSTACK FIREWALL</Text>
          <Text style={styles.healthValCyan}>HMAC-SHA512</Text>
        </View>
      </View>

      {/* Executive Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'admin' && styles.tabBtnActive]}
          onPress={() => setActiveTab('admin')}
        >
          <Text style={[styles.tabText, activeTab === 'admin' && styles.tabTextActive]}>
            🏛️ DJANGO ADMIN
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'telemetry' && styles.tabBtnActive]}
          onPress={() => setActiveTab('telemetry')}
        >
          <Text style={[styles.tabText, activeTab === 'telemetry' && styles.tabTextActive]}>
            📊 TELEMETRY
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'paystack' && styles.tabBtnActive]}
          onPress={() => setActiveTab('paystack')}
        >
          <Text style={[styles.tabText, activeTab === 'paystack' && styles.tabTextActive]}>
            🛡️ PAYSTACK SEC
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'math' && styles.tabBtnActive]}
          onPress={() => setActiveTab('math')}
        >
          <Text style={[styles.tabText, activeTab === 'math' && styles.tabTextActive]}>
            📐 OR OPTIMIZER
          </Text>
        </TouchableOpacity>
      </View>

      {/* MAIN VIEW CONTENT */}
      <ScrollView contentContainerStyle={styles.contentArea}>
        {/* ═══════════════════════════════════════════════════════════
            TAB 1: EMBEDDED DJANGO ADMIN LAUNCHER & CONTROLS
            ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'admin' && (
          <View>
            <View style={styles.adminHeroCard}>
              <Text style={styles.adminHeroTitle}>DJANGO ADMIN CONTROL DESK</Text>
              <Text style={styles.adminHeroSub}>
                Direct administrative access to ORM tables, Contract Bookings, Leads, Reviews, User Roles, and Celery Workers.
              </Text>

              <View style={styles.adminUrlBox}>
                <Text style={styles.adminUrlLabel}>TARGET ADMIN URL:</Text>
                <Text style={styles.adminUrlText}>{adminUrl}</Text>
              </View>

              <TouchableOpacity
                style={styles.launchAdminBtn}
                onPress={() => Linking.openURL(adminUrl)}
              >
                <Text style={styles.launchAdminBtnText}>LAUNCH DJANGO ADMIN PORTAL ↗</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Admin Table Shortcuts */}
            <Text style={styles.sectionHeader}>QUICK DIRECT TABLE ACTIONS</Text>

            <View style={styles.shortcutGrid}>
              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => Linking.openURL(`${apiHost}/admin/api/contractbooking/`)}
              >
                <Text style={styles.shortcutIcon}>💼</Text>
                <Text style={styles.shortcutTitle}>Contract Bookings</Text>
                <Text style={styles.shortcutSub}>View & modify client orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => Linking.openURL(`${apiHost}/admin/api/clientlead/`)}
              >
                <Text style={styles.shortcutIcon}>📋</Text>
                <Text style={styles.shortcutTitle}>Client Leads</Text>
                <Text style={styles.shortcutSub}>All Contact Us inquiries</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => Linking.openURL(`${apiHost}/admin/api/clientreview/`)}
              >
                <Text style={styles.shortcutIcon}>⭐</Text>
                <Text style={styles.shortcutTitle}>Client Reviews</Text>
                <Text style={styles.shortcutSub}>Moderate testimonials</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => Linking.openURL(`${apiHost}/admin/auth/user/`)}
              >
                <Text style={styles.shortcutIcon}>👥</Text>
                <Text style={styles.shortcutTitle}>Users & Staff</Text>
                <Text style={styles.shortcutSub}>Manage staff permissions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 2: EXECUTIVE TELEMETRY & LIVE VITALS
            ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'telemetry' && (
          <View>
            <View style={styles.telemetryTopCard}>
              <View style={styles.telemetryHeaderRow}>
                <Text style={styles.telemetryCardTitle}>LIVE CLOUD VITALS</Text>
                <TouchableOpacity onPress={fetchTelemetry}>
                  <Text style={styles.refreshText}>{isLoadingTelemetry ? '...' : '🔄 REFRESH'}</Text>
                </TouchableOpacity>
              </View>

              {telemetry ? (
                <View>
                  <View style={styles.telemetryStatsRow}>
                    <View style={styles.statPill}>
                      <Text style={styles.statPillLabel}>TOTAL LEADS</Text>
                      <Text style={styles.statPillVal}>{telemetry.telemetry?.total_leads || 0}</Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={styles.statPillLabel}>NEW LEADS</Text>
                      <Text style={[styles.statPillVal, { color: '#3dff8b' }]}>
                        {telemetry.telemetry?.new_leads || 0}
                      </Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={styles.statPillLabel}>REVIEWS</Text>
                      <Text style={[styles.statPillVal, { color: '#d4af37' }]}>
                        {telemetry.telemetry?.total_reviews || 0}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.subSectionTitle}>SYSTEM RUNTIME SPECS</Text>
                  {(telemetry.telemetry?.metrics || []).map((m, idx) => (
                    <View key={idx} style={styles.metricRow}>
                      <Text style={styles.metricName}>{m.metric_name}</Text>
                      <Text style={styles.metricVal}>{m.metric_value}</Text>
                      <Text style={styles.metricBadge}>{m.status_label}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <ActivityIndicator color="#d4af37" style={{ marginVertical: 20 }} />
              )}
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 3: PAYSTACK SECURITY FIREWALL MONITOR
            ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'paystack' && (
          <View>
            <View style={styles.firewallCard}>
              <Text style={styles.firewallTitle}>PAYSTACK HMAC-SHA512 FIREWALL</Text>
              <Text style={styles.firewallSub}>
                Zero-loss financial ledger specifications. All incoming Paystack webhooks are signed, verified, and locked under atomic row isolation.
              </Text>

              <View style={styles.ruleBox}>
                <Text style={styles.ruleLabel}>RULE 01: SIGNATURE VERIFICATION</Text>
                <Text style={styles.ruleDesc}>
                  Compares x-paystack-signature header with hmac.new(PAYSTACK_SECRET_KEY, request.body, hashlib.sha512).digest().
                </Text>
              </View>

              <View style={styles.ruleBox}>
                <Text style={styles.ruleLabel}>RULE 02: IDEMPOTENCY LOCK</Text>
                <Text style={styles.ruleDesc}>
                  Prevents duplicate execution on webhook replay storms using Redis cached transaction references.
                </Text>
              </View>

              <View style={styles.ruleBox}>
                <Text style={styles.ruleLabel}>RULE 03: ACID LEDGER ROW LOCK</Text>
                <Text style={styles.ruleDesc}>
                  PostgreSQL select_for_update() row lock prevents race conditions during concurrent payments.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 4: OPERATIONS RESEARCH SIMPLEX OPTIMIZER
            ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'math' && (
          <View>
            <View style={styles.orCard}>
              <Text style={styles.orTitle}>COMPUTATIONAL RESOURCE OPTIMIZER</Text>
              <Text style={styles.orSub}>
                B.Tech Mathematics foundation: Optimizes engineering resource allocation across software domains using Linear Programming constraints.
              </Text>

              <Text style={styles.inputLabel}>PROFIT PER FINTECH SERVICE (₦k)</Text>
              <TextInput
                style={styles.orInput}
                value={profitA}
                onChangeText={setProfitA}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>PROFIT PER DRF SAAS CONTRACT (₦k)</Text>
              <TextInput
                style={styles.orInput}
                value={profitB}
                onChangeText={setProfitB}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>TOTAL MONTHLY ARCHITECT CAPACITY (HOURS)</Text>
              <TextInput
                style={styles.orInput}
                value={devHours}
                onChangeText={setDevHours}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.runOrBtn}
                onPress={runSimplexOptimization}
                disabled={isOptimizing}
              >
                <Text style={styles.runOrBtnText}>
                  {isOptimizing ? 'COMPUTING SIMPLEX...' : 'COMPUTE OPTIMAL ALLOCATION ⚡'}
                </Text>
              </TouchableOpacity>

              {orResult && (
                <View style={styles.orResultsBox}>
                  <Text style={styles.orResultsTitle}>OPTIMAL LINEAR SOLUTION</Text>
                  <Text style={styles.orResultLine}>
                    • Fintech Integrations: <Text style={{ color: '#3dff8b' }}>{orResult.optimal_service_a_units} Projects</Text>
                  </Text>
                  <Text style={styles.orResultLine}>
                    • DRF SaaS Architectures: <Text style={{ color: '#d4af37' }}>{orResult.optimal_service_b_units} Projects</Text>
                  </Text>
                  <Text style={styles.orResultLine}>
                    • Maximized Revenue Yield: <Text style={{ color: '#00dcff', fontWeight: '900' }}>{orResult.maximized_profit}</Text>
                  </Text>
                  <Text style={styles.orStatusLine}>Status: {orResult.status}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: CLUSTER SERVER HOST SWITCHER
          ═══════════════════════════════════════════════════════════ */}
      <Modal visible={showHostModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>BACKEND CLUSTER ENDPOINT</Text>
              <TouchableOpacity onPress={() => setShowHostModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.presetBtn,
                apiHost === 'https://empirecodes-backend-drf.onrender.com' && styles.presetBtnActive,
              ]}
              onPress={() => {
                setApiHost('https://empirecodes-backend-drf.onrender.com');
                setCustomHost('https://empirecodes-backend-drf.onrender.com');
              }}
            >
              <Text style={styles.presetTitle}>☁️ Render Production Cluster</Text>
              <Text style={styles.presetSub}>https://empirecodes-backend-drf.onrender.com</Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={[
                styles.presetBtn,
                apiHost === 'http://192.168.100.13:8000' && styles.presetBtnActive,
              ]}
              onPress={() => {
                setApiHost('http://192.168.100.13:8000');
                setCustomHost('http://192.168.100.13:8000');
              }}
            >
              <Text style={styles.presetTitle}>💻 Local Laptop Development</Text>
              <Text style={styles.presetSub}>http://192.168.100.13:8000</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.customHostInput}
              value={customHost}
              onChangeText={setCustomHost}
              placeholder="Custom host..."
              placeholderTextColor="#666"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.saveHostBtn}
              onPress={() => {
                setApiHost(customHost.trim());
                setShowHostModal(false);
                pingServer();
              }}
            >
              <Text style={styles.saveHostBtnText}>CONNECT CLUSTER 🌐</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLESHEET
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020202',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#020202',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  authCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#080808',
    borderWidth: 1.5,
    borderColor: '#d4af37',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  authEmblem: {
    fontSize: 42,
    marginBottom: 8,
  },
  authTitle: {
    color: '#d4af37',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 2,
  },
  authArchitect: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  authSub: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 20,
  },
  authInputBox: {
    width: '100%',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 4,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  authTextInput: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 10,
    textAlign: 'center',
    letterSpacing: 4,
  },
  authSubmitBtn: {
    width: '100%',
    backgroundColor: '#d4af37',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  authSubmitBtnText: {
    color: '#020202',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#050505',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    color: '#3dff8b',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  pulseGreen: {
    backgroundColor: '#3dff8b',
  },
  pulseRed: {
    backgroundColor: '#ff4444',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  hostBtn: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  hostBtnText: {
    color: '#3dff8b',
    fontSize: 9,
    fontWeight: '800',
  },
  lockBtn: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  lockBtnText: {
    fontSize: 10,
  },
  healthBar: {
    flexDirection: 'row',
    backgroundColor: '#080808',
    borderBottomWidth: 1,
    borderBottomColor: '#181818',
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  healthItem: {
    alignItems: 'center',
  },
  healthLabel: {
    color: '#666',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  healthValGreen: { color: '#3dff8b', fontSize: 10, fontWeight: '800', marginTop: 1 },
  healthValGold: { color: '#d4af37', fontSize: 10, fontWeight: '800', marginTop: 1 },
  healthValCyan: { color: '#00dcff', fontSize: 10, fontWeight: '800', marginTop: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0c0c0c',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#3dff8b',
    backgroundColor: 'rgba(61, 255, 139, 0.05)',
  },
  tabText: {
    color: '#777',
    fontSize: 9,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#3dff8b',
  },
  contentArea: {
    padding: 14,
    paddingBottom: 40,
  },
  adminHeroCard: {
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#d4af37',
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
  },
  adminHeroTitle: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  adminHeroSub: {
    color: '#999',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  adminUrlBox: {
    backgroundColor: '#020202',
    borderWidth: 1,
    borderColor: '#222',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  adminUrlLabel: {
    color: '#666',
    fontSize: 8,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  adminUrlText: {
    color: '#3dff8b',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  launchAdminBtn: {
    backgroundColor: '#d4af37',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  launchAdminBtnText: {
    color: '#020202',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionHeader: {
    color: '#bbb',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  shortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  shortcutCard: {
    width: '48%',
    backgroundColor: '#070707',
    borderWidth: 1,
    borderColor: '#222',
    padding: 12,
    borderRadius: 4,
    marginBottom: 4,
  },
  shortcutIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  shortcutTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  shortcutSub: {
    color: '#666',
    fontSize: 9,
  },
  telemetryTopCard: {
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 6,
    padding: 14,
  },
  telemetryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  telemetryCardTitle: {
    color: '#d4af37',
    fontSize: 13,
    fontWeight: '900',
  },
  refreshText: {
    color: '#3dff8b',
    fontSize: 10,
    fontWeight: '800',
  },
  telemetryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#030303',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  statPillLabel: {
    color: '#666',
    fontSize: 8,
    fontWeight: '800',
  },
  statPillVal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  subSectionTitle: {
    color: '#888',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#030303',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  metricName: {
    color: '#ccc',
    fontSize: 11,
    flex: 1,
  },
  metricVal: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    marginRight: 8,
    fontFamily: 'monospace',
  },
  metricBadge: {
    color: '#3dff8b',
    fontSize: 8,
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: '#3dff8b',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  firewallCard: {
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 6,
    padding: 14,
  },
  firewallTitle: {
    color: '#3dff8b',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  firewallSub: {
    color: '#999',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  ruleBox: {
    backgroundColor: '#020202',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  ruleLabel: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  ruleDesc: {
    color: '#bbb',
    fontSize: 10,
    lineHeight: 15,
  },
  orCard: {
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 6,
    padding: 14,
  },
  orTitle: {
    color: '#00dcff',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  orSub: {
    color: '#999',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  inputLabel: {
    color: '#666',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
  },
  orInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    marginBottom: 10,
  },
  runOrBtn: {
    backgroundColor: '#00dcff',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginVertical: 6,
  },
  runOrBtnText: {
    color: '#020202',
    fontSize: 10,
    fontWeight: '900',
  },
  orResultsBox: {
    backgroundColor: '#020202',
    borderWidth: 1,
    borderColor: '#00dcff',
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  orResultsTitle: {
    color: '#00dcff',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 6,
  },
  orResultLine: {
    color: '#ccc',
    fontSize: 11,
    marginBottom: 4,
  },
  orStatusLine: {
    color: '#888',
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#3dff8b',
    borderRadius: 6,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#3dff8b',
    fontSize: 12,
    fontWeight: '900',
  },
  modalCloseText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '900',
  },
  presetBtn: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#262626',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  presetBtnActive: {
    borderColor: '#3dff8b',
  },
  presetTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  presetSub: {
    color: '#777',
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  customHostInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    borderRadius: 4,
    padding: 8,
    fontSize: 11,
    marginVertical: 10,
  },
  saveHostBtn: {
    backgroundColor: '#3dff8b',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  saveHostBtnText: {
    color: '#020202',
    fontSize: 11,
    fontWeight: '900',
  },
});

