import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallBanner() {
  const colors = useColors();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa-install-dismissed', '1');
  };

  useEffect(() => {
    if (showBanner && sessionStorage.getItem('pwa-install-dismissed') === '1') {
      setShowBanner(false);
    }
  }, [showBanner]);

  if (isInstalled || !showBanner || Platform.OS !== 'web') return null;

  return (
    <Modal transparent animationType="fade" visible={showBanner} onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
            <Feather name="download-cloud" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Instalar Gym Tracker</Text>
          <Text style={[styles.desc, { color: colors.mutedForeground }]}>
            Agrega la app a tu pantalla de inicio para acceso rapido y uso sin conexion.
          </Text>
          <View style={styles.actions}>
            <Pressable onPress={handleDismiss} style={[styles.btn, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.btnText, { color: colors.secondaryForeground }]}>Ahora no</Text>
            </Pressable>
            <Pressable onPress={handleInstall} style={[styles.btn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Instalar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
