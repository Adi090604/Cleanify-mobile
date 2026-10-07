import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import {
  ActivityIndicator,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const ALERT_STYLES = {
  success: { icon: 'check', color: '#17843f', background: '#e7f6eb' },
  error: { icon: 'times', color: '#b91c1c', background: '#fee2e2' },
  warning: { icon: 'exclamation', color: '#a16207', background: '#fef3c7' },
  confirm: { icon: 'question', color: '#17843f', background: '#e7f6eb' },
  info: { icon: 'info', color: '#2563eb', background: '#dbeafe' },
};

const CleanifyAlertContext = createContext(null);

export function CleanifyAlertProvider({ children }) {
  const nextId = useRef(0);
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((options) => {
    nextId.current += 1;
    setAlert({
      id: nextId.current,
      type: 'info',
      confirmText: 'OK',
      cancelText: 'Cancel',
      dismissible: true,
      ...options,
    });
  }, []);

  const dismissAlert = useCallback(() => setAlert(null), []);
  const value = useMemo(() => ({ showAlert, dismissAlert }), [dismissAlert, showAlert]);

  return (
    <CleanifyAlertContext.Provider value={value}>
      {children}
      <CleanifyAlert
        key={alert?.id ?? 'closed'}
        visible={Boolean(alert)}
        {...alert}
        onDismiss={() => setAlert((current) => current?.id === alert?.id ? null : current)}
      />
    </CleanifyAlertContext.Provider>
  );
}

export function useCleanifyAlert() {
  const context = useContext(CleanifyAlertContext);

  if (!context) {
    throw new Error('useCleanifyAlert must be used inside CleanifyAlertProvider.');
  }

  return context;
}

export default function CleanifyAlert({
  visible,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  onDismiss,
  showCancel = false,
  destructive = false,
  dismissible = true,
  loading = false,
  actions,
}) {
  const scale = useRef(new Animated.Value(0.94)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const actionPending = useRef(false);
  const [busy, setBusy] = useState(false);
  const isBusy = loading || busy;
  const appearance = ALERT_STYLES[type] ?? ALERT_STYLES.info;
  const hasActions = Array.isArray(actions) && actions.length > 0;

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0.94);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale, visible]);

  const cancel = () => {
    if (isBusy) return;
    onDismiss?.();
    onCancel?.();
  };

  const confirm = async () => {
    if (isBusy || actionPending.current) return;

    if (!onConfirm) {
      actionPending.current = true;
      onDismiss?.();
      return;
    }

    actionPending.current = true;
    setBusy(true);
    try {
      await onConfirm();
      onDismiss?.();
    } catch {
      // Keep the alert open when an action cannot complete.
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  };

  const selectAction = (action) => {
    if (isBusy || actionPending.current || action.disabled) return;
    actionPending.current = true;
    onDismiss?.();
    action.onPress?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (dismissible) cancel();
      }}
    >
      <TouchableWithoutFeedback onPress={() => dismissible && cancel()} disabled={!dismissible || isBusy}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              accessibilityViewIsModal
              style={[styles.card, { opacity, transform: [{ scale }] }]}
            >
              {!hasActions ? (
                <View style={[styles.iconCircle, { backgroundColor: appearance.background }]}>
                  <FontAwesome5 name={appearance.icon} size={18} color={appearance.color} />
                </View>
              ) : null}
              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}

              {hasActions ? (
                <View style={styles.actionList}>
                  {actions.map((action) => (
                    <TouchableOpacity
                      key={action.key ?? action.label}
                      style={[styles.choice, action.disabled && styles.disabled]}
                      onPress={() => selectAction(action)}
                      disabled={isBusy || action.disabled}
                      accessibilityRole="button"
                    >
                      <View style={styles.choiceIcon}>
                        <FontAwesome5 name={action.icon ?? 'circle'} size={16} color="#17843f" />
                      </View>
                      <View style={styles.choiceCopy}>
                        <Text style={styles.choiceLabel}>{action.label}</Text>
                        {action.description ? <Text style={styles.choiceDescription}>{action.description}</Text> : null}
                      </View>
                      <FontAwesome5 name="chevron-right" size={11} color="#9aa39f" />
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.actionCancel} onPress={cancel} disabled={isBusy}>
                    <Text style={styles.actionCancelText}>{cancelText}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.buttons}>
                  {showCancel ? (
                    <TouchableOpacity style={styles.cancelButton} onPress={cancel} disabled={isBusy}>
                      <Text style={styles.cancelText}>{cancelText}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.confirmButton, destructive && styles.destructiveButton, isBusy && styles.disabled]}
                    onPress={confirm}
                    disabled={isBusy}
                  >
                    {isBusy ? <ActivityIndicator size="small" color="#ffffff" /> : null}
                    <Text style={styles.confirmText}>{isBusy ? 'Please wait...' : confirmText}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22, backgroundColor: 'rgba(17, 24, 39, 0.45)' },
  card: { width: '100%', maxWidth: 390, padding: 20, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e9e7', shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 10 },
  iconCircle: { width: 46, height: 46, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderRadius: 23, marginBottom: 13 },
  title: { color: '#111827', fontSize: 19, fontWeight: '800', textAlign: 'center' },
  message: { color: '#667085', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  buttons: { flexDirection: 'row', gap: 9, marginTop: 19 },
  cancelButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#d6dcda', backgroundColor: '#ffffff' },
  cancelText: { color: '#4b5563', fontSize: 14, fontWeight: '700' },
  confirmButton: { flex: 1, minHeight: 48, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#17843f' },
  destructiveButton: { backgroundColor: '#b91c1c' },
  confirmText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.58 },
  actionList: { gap: 8, marginTop: 17 },
  choice: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: '#dce5e0', backgroundColor: '#f8fbf9' },
  choiceIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#e7f6eb', marginRight: 10 },
  choiceCopy: { flex: 1, paddingRight: 8 },
  choiceLabel: { color: '#1f2937', fontSize: 14, fontWeight: '800' },
  choiceDescription: { color: '#7b8580', fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  actionCancel: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  actionCancelText: { color: '#667085', fontSize: 13, fontWeight: '700' },
});
