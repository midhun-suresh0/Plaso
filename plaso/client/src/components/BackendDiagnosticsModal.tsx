import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { config, setCustomApiBaseUrl, LOCAL_API_URL, CLOUD_API_URL } from '../constants/config';
import { tokenStorage } from '../services/tokenStorage';

interface BackendDiagnosticsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface TestResult {
  title: string;
  status: 'idle' | 'testing' | 'success' | 'failed';
  latency?: number;
  message?: string;
}

export const BackendDiagnosticsModal: React.FC<BackendDiagnosticsModalProps> = ({
  visible,
  onClose,
}) => {
  const [currentUrl, setCurrentUrl] = useState(config.api.baseUrl);
  const [customInput, setCustomInput] = useState(config.api.baseUrl);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([
    { title: 'API Gateway Health (/api/health)', status: 'idle' },
    { title: 'Static Uploads Host (/uploads)', status: 'idle' },
    { title: 'Authentication Token Status', status: 'idle' },
  ]);

  useEffect(() => {
    if (visible) {
      setCurrentUrl(config.api.baseUrl);
      setCustomInput(config.api.baseUrl);
      runDiagnostics(config.api.baseUrl);
    }
  }, [visible]);

  const runDiagnostics = async (baseUrl: string) => {
    setTesting(true);
    const results: TestResult[] = [
      { title: 'API Gateway Health (/api/health)', status: 'testing' },
      { title: 'Static Uploads Host (/uploads)', status: 'testing' },
      { title: 'Authentication Token Status', status: 'testing' },
    ];
    setTestResults([...results]);

    // Test 1: API Health
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${baseUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const latency = Date.now() - start;

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        results[0] = {
          title: 'API Gateway Health (/api/health)',
          status: 'success',
          latency,
          message: json.message || 'Connected (HTTP 200 OK)',
        };
      } else {
        results[0] = {
          title: 'API Gateway Health (/api/health)',
          status: 'failed',
          latency,
          message: `HTTP ${res.status}: ${res.statusText}`,
        };
      }
    } catch (err: any) {
      results[0] = {
        title: 'API Gateway Health (/api/health)',
        status: 'failed',
        message: err.name === 'AbortError' ? 'Connection timed out (>8s)' : (err.message || 'Network unreachable'),
      };
    }
    setTestResults([...results]);

    // Test 2: Static Uploads Host
    try {
      const uploadBase = baseUrl.replace(/\/api\/?$/, '');
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${uploadBase}/uploads`, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);
      const latency = Date.now() - start;

      // Express static responds 200 or 404 for directory listing, both confirm the host is reachable
      if (res.status < 500) {
        results[1] = {
          title: 'Static Uploads Host (/uploads)',
          status: 'success',
          latency,
          message: `Image server accessible (${uploadBase}/uploads)`,
        };
      } else {
        results[1] = {
          title: 'Static Uploads Host (/uploads)',
          status: 'failed',
          latency,
          message: `Server returned error HTTP ${res.status}`,
        };
      }
    } catch (err: any) {
      results[1] = {
        title: 'Static Uploads Host (/uploads)',
        status: 'failed',
        message: 'Could not connect to image server path',
      };
    }
    setTestResults([...results]);

    // Test 3: Auth Token
    try {
      const token = await tokenStorage.getToken();
      if (token) {
        results[2] = {
          title: 'Authentication Token Status',
          status: 'success',
          message: `Active session token present (${token.substring(0, 10)}...)`,
        };
      } else {
        results[2] = {
          title: 'Authentication Token Status',
          status: 'failed',
          message: 'No login token stored. Please log in first.',
        };
      }
    } catch (err: any) {
      results[2] = {
        title: 'Authentication Token Status',
        status: 'failed',
        message: 'Could not access secure storage',
      };
    }

    setTestResults([...results]);
    setTesting(false);
  };

  const handleSelectPreset = async (presetUrl: string) => {
    await setCustomApiBaseUrl(presetUrl);
    setCurrentUrl(presetUrl);
    setCustomInput(presetUrl);
    runDiagnostics(presetUrl);
  };

  const handleApplyCustom = async () => {
    let clean = customInput.trim();
    if (!clean.endsWith('/api')) {
      clean = clean.replace(/\/+$/, '') + '/api';
    }
    await setCustomApiBaseUrl(clean);
    setCurrentUrl(clean);
    setCustomInput(clean);
    runDiagnostics(clean);
  };

  const handleResetToDefault = async () => {
    await setCustomApiBaseUrl(null);
    setCurrentUrl(config.api.baseUrl);
    setCustomInput(config.api.baseUrl);
    runDiagnostics(config.api.baseUrl);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="pulse" size={22} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Backend & API Diagnostics</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Active URL Card */}
            <View style={styles.activeUrlBox}>
              <Text style={styles.label}>CURRENT BACKEND TARGET</Text>
              <Text style={styles.urlText} numberOfLines={1}>
                {currentUrl}
              </Text>
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    currentUrl.includes('192.168.') && styles.presetBtnActive,
                  ]}
                  onPress={() => handleSelectPreset(LOCAL_API_URL)}
                >
                  <Ionicons name="desktop-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.presetText}>Local PC (Wi-Fi)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    currentUrl.includes('onrender.com') && styles.presetBtnActive,
                  ]}
                  onPress={() => handleSelectPreset(CLOUD_API_URL)}
                >
                  <Ionicons name="cloud-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.presetText}>Cloud (Render)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom URL Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>CUSTOM SERVER ADDRESS</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={customInput}
                  onChangeText={setCustomInput}
                  placeholder="http://192.168.x.x:5000/api"
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCustom}>
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleResetToDefault} style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                <Text style={styles.resetText}>Reset to default environment</Text>
              </TouchableOpacity>
            </View>

            {/* Diagnostics Results */}
            <View style={styles.resultsContainer}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.label}>COMMUNICATION TESTS</Text>
                <TouchableOpacity
                  style={styles.retestBtn}
                  onPress={() => runDiagnostics(currentUrl)}
                  disabled={testing}
                >
                  {testing ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="refresh" size={13} color={theme.colors.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.retestText}>Run Test</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {testResults.map((item, index) => (
                <View key={index} style={styles.testItem}>
                  <View style={styles.testIconContainer}>
                    {item.status === 'testing' && <ActivityIndicator size="small" color={theme.colors.primary} />}
                    {item.status === 'success' && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                    {item.status === 'failed' && <Ionicons name="alert-circle" size={20} color="#EF4444" />}
                    {item.status === 'idle' && <Ionicons name="ellipse-outline" size={20} color={theme.colors.textSecondary} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.testTitle}>{item.title}</Text>
                      {item.latency !== undefined && (
                        <Text style={[styles.latencyText, { color: item.latency < 500 ? '#10B981' : '#F59E0B' }]}>
                          {item.latency}ms
                        </Text>
                      )}
                    </View>
                    {item.message ? (
                      <Text style={[styles.testMsg, item.status === 'failed' && { color: '#EF4444' }]}>
                        {item.message}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>

            {/* Troubleshooting Note */}
            <View style={styles.noteBox}>
              <Ionicons name="information-circle-outline" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={styles.noteText}>
                Tip: When testing on a physical phone via Wi-Fi, select "Local PC" so listings and images match your local server directly.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  activeUrlBox: {
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  urlText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 6,
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  presetBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.text,
  },
  applyBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  resetText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
  resultsContainer: {
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  retestBtn: {
    padding: 4,
  },
  retestText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  testIconContainer: {
    width: 24,
    marginRight: 10,
    marginTop: 2,
    alignItems: 'center',
  },
  testTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  latencyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  testMsg: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
});
